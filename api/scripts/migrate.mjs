#!/usr/bin/env node
/** Applies migrations/*.sql in order, recording each in schema_migrations. */

import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import mysql from 'mysql2/promise';
import { config } from '../src/config.js';

const dir = join(dirname(fileURLToPath(import.meta.url)), '..', 'migrations');

const conn = await mysql.createConnection({
    host: config.db.host, port: config.db.port, user: config.db.user,
    password: config.db.password, database: config.db.database, multipleStatements: true,
});

await conn.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
  filename VARCHAR(255) NOT NULL PRIMARY KEY,
  applied_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB`);

const [applied] = await conn.query('SELECT filename FROM schema_migrations');
const done = new Set(applied.map((r) => r.filename));

let count = 0;
for (const file of readdirSync(dir).filter((f) => f.endsWith('.sql')).sort()) {
    if (done.has(file)) { console.log(`  skip     ${file}`); continue; }
    process.stdout.write(`  applying ${file} ... `);
    await conn.query(readFileSync(join(dir, file), 'utf8'));
    await conn.query('INSERT INTO schema_migrations (filename) VALUES (?)', [file]);
    console.log('ok');
    count += 1;
}
console.log(`\n  ${count} migration(s) applied.\n`);
await conn.end();
