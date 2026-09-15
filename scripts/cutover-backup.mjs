#!/usr/bin/env node
/**
 * CUTOVER — pre-deployment production snapshot. READ ONLY.
 *
 * WHY NOT `gcloud firestore export`
 *   The managed export writes to a Cloud Storage bucket and needs the Blaze
 *   plan. This project has no bucket and billing is deliberately not being
 *   enabled, so the managed path is unavailable. At this data volume it is also
 *   unnecessary: the collections below are tens of documents, and a plain JSON
 *   snapshot restores just as well and can be read without any tooling.
 *
 * WHAT IT CAPTURES
 *   bookings, payments, booking_references, booking_documents   (Firestore)
 *   the DEPLOYED Firestore ruleset                              (Rules API)
 *   the staff custom-claim state for named accounts             (Identity Toolkit)
 *   a manifest with counts, hashes and the git commit
 *
 * WHAT IT NEVER DOES
 *   writes to Firestore, deletes anything, or enumerates Auth users.
 *
 * OUTPUT contains real customer data. It is written under backups/, which is
 * gitignored, and must be handled as customer PII.
 *
 *   node scripts/cutover-backup.mjs            # snapshot
 *   node scripts/cutover-backup.mjs --verify   # counts + hashes only, no PII written
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execSync } from 'node:child_process';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const admin = require('../functions/node_modules/firebase-admin');
const { GoogleAuth } = require('../node_modules/google-auth-library');

const PROJECT_ID = process.env.GCLOUD_PROJECT || 'infiniteyatra-iy';
const VERIFY_ONLY = process.argv.includes('--verify');
const COLLECTIONS = ['bookings', 'payments', 'booking_references', 'booking_documents'];

const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const outDir = new URL(`../backups/${stamp}/`, import.meta.url);

const sha = (s) => createHash('sha256').update(s).digest('hex').slice(0, 16);

if (!admin.apps.length) admin.initializeApp({ projectId: PROJECT_ID });
const db = admin.firestore();

async function snapshotCollection(name) {
    const snap = await db.collection(name).get();
    const docs = {};
    snap.forEach((d) => {
        // toJSON-safe: Timestamps become ISO strings, tagged so a restore can
        // convert them back rather than guessing.
        docs[d.id] = JSON.parse(JSON.stringify(d.data(), (k, v) =>
            (v && typeof v === 'object' && typeof v._seconds === 'number')
                ? { __timestamp__: new Date(v._seconds * 1000).toISOString() } : v));
    });
    return { count: snap.size, docs };
}

async function deployedRuleset(client) {
    const base = 'https://firebaserules.googleapis.com/v1';
    const headers = { 'x-goog-user-project': PROJECT_ID };
    const rel = await client.request({ url: `${base}/projects/${PROJECT_ID}/releases`, headers });
    const out = {};
    for (const r of rel.data.releases || []) {
        const rs = await client.request({ url: `${base}/${r.rulesetName}`, headers });
        out[r.name.split('/').pop()] = {
            rulesetId: r.rulesetName.split('/').pop(),
            updateTime: r.updateTime,
            files: (rs.data.source?.files || []).map((f) => ({ name: f.name, content: f.content })),
        };
    }
    return out;
}

async function staffClaims(client, emails) {
    const out = {};
    for (const email of emails) {
        const res = await client.request({
            url: `https://identitytoolkit.googleapis.com/v1/projects/${PROJECT_ID}/accounts:lookup`,
            method: 'POST', data: { email: [email] },
            headers: { 'x-goog-user-project': PROJECT_ID },
        });
        const acct = (res.data.users || [])[0];
        // Claims only. No uid, no provider records, no password material.
        out[email] = acct ? JSON.parse(acct.customAttributes || '{}') : null;
    }
    return out;
}

const main = async () => {
    const auth = new GoogleAuth({
        scopes: ['https://www.googleapis.com/auth/cloud-platform'],
        clientOptions: { quotaProjectId: PROJECT_ID },
    });
    const client = await auth.getClient();

    const manifest = {
        takenAt: new Date().toISOString(),
        projectId: PROJECT_ID,
        gitCommit: execSync('git rev-parse HEAD').toString().trim(),
        collections: {},
        rulesets: {},
        claims: {},
        mode: VERIFY_ONLY ? 'verify' : 'snapshot',
    };

    if (!VERIFY_ONLY) mkdirSync(outDir, { recursive: true });

    for (const name of COLLECTIONS) {
        const { count, docs } = await snapshotCollection(name);
        const json = JSON.stringify(docs, null, 2);
        manifest.collections[name] = { count, sha256_16: sha(json) };
        if (!VERIFY_ONLY) writeFileSync(new URL(`${name}.json`, outDir), json);
        console.log(`  ${name.padEnd(20)} ${String(count).padStart(4)} docs   sha ${sha(json)}`);
    }

    const rules = await deployedRuleset(client);
    for (const [release, r] of Object.entries(rules)) {
        const json = JSON.stringify(r, null, 2);
        manifest.rulesets[release] = { rulesetId: r.rulesetId, updateTime: r.updateTime, sha256_16: sha(json) };
        if (!VERIFY_ONLY) writeFileSync(new URL(`rules.${release}.json`, outDir), json);
        console.log(`  rules:${release.padEnd(14)} ${r.rulesetId}  updated ${r.updateTime}`);
    }

    const emails = (process.env.CUTOVER_CLAIM_EMAILS || 'chauhanparth165@gmail.com').split(',');
    manifest.claims = await staffClaims(client, emails);
    for (const [e, c] of Object.entries(manifest.claims)) {
        const [u, d] = e.split('@');
        console.log(`  claim ${u[0]}${'*'.repeat(3)}${u.slice(-2)}@${d}  ${JSON.stringify(c)}`);
    }

    if (!VERIFY_ONLY) {
        writeFileSync(new URL('manifest.json', outDir), JSON.stringify(manifest, null, 2));
        console.log(`\n  Snapshot written to backups/${stamp}/  (gitignored; contains customer PII)\n`);
    } else {
        console.log('\n  VERIFY ONLY - counts and hashes above; nothing was written.\n');
    }
};

main().catch((err) => {
    console.error(`\n  Backup failed: ${err.code || String(err.message).split('\n')[0]}\n`);
    process.exit(1);
});
