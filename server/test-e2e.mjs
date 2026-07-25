// Throwaway end-to-end smoke test: boots an in-memory MongoDB, starts the API,
// and exercises the Phase 1/2 endpoints exactly as the browser would.
import { MongoMemoryServer } from 'mongodb-memory-server';
import { spawn } from 'node:child_process';

const mongo = await MongoMemoryServer.create();
const uri = mongo.getUri();
console.log('in-memory mongo:', uri);

const PORT = 8097;
const srv = spawn('node', ['src/index.js'], {
    env: { ...process.env, MONGODB_URI: uri, JWT_SECRET: 'e2e_secret', PORT: String(PORT), ADMIN_EMAILS: 'admin@iy.com' },
    stdio: 'inherit',
});

const base = `http://localhost:${PORT}`;
const post = (p, body, token) =>
    fetch(base + p, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(body),
    });
const get = (p, token) => fetch(base + p, { headers: token ? { Authorization: `Bearer ${token}` } : {} });

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

let failures = 0;
const check = (name, cond, extra = '') => {
    console.log(`${cond ? '✔' : '✘'}  ${name}${extra ? ' — ' + extra : ''}`);
    if (!cond) failures++;
};

try {
    await wait(2500); // let server connect + listen

    check('health', (await (await get('/api/health')).json()).ok === true);

    // Newsletter
    check('newsletter create', (await post('/api/newsletter', { email: 'a@b.com' })).status === 201);
    check('newsletter duplicate → 200 duplicate', (await (await post('/api/newsletter', { email: 'a@b.com' })).json()).duplicate === true);
    check('newsletter bad email → 400', (await post('/api/newsletter', { email: 'nope' })).status === 400);

    // Enquiries + leads (public)
    check('enquiry create', (await post('/api/enquiries', { firstName: 'P', lastName: 'C', email: 'p@c.com', mobile: '9999' })).status === 201);
    check('lead create', (await post('/api/leads', { name: 'P C', email: 'p@c.com', source_type: 'enquiry_popup' })).status === 201);
    check('lead oversized email → 400', (await post('/api/leads', { name: 'x', email: 'bad' })).status === 400);

    // Auth
    const reg = await (await post('/api/auth/register', { email: 'admin@iy.com', password: 'password123' })).json();
    check('register admin gets admin role', reg.user?.role === 'admin', reg.user?.role);
    check('register returns token', typeof reg.token === 'string');
    const login = await (await post('/api/auth/login', { email: 'admin@iy.com', password: 'password123' })).json();
    check('login works', typeof login.token === 'string');
    check('login wrong pw → 401', (await post('/api/auth/login', { email: 'admin@iy.com', password: 'wrong' })).status === 401);

    // Admin-gated reads
    check('leads GET without token → 401', (await get('/api/leads')).status === 401);
    check('leads GET with admin token → 200', (await get('/api/leads', login.token)).status === 200);
    const leadsData = await (await get('/api/leads', login.token)).json();
    check('leads persisted in mongo', Array.isArray(leadsData.leads) && leadsData.leads.length >= 1, `${leadsData.leads?.length} leads`);

    console.log(failures ? `\n❌ ${failures} check(s) failed` : '\n✅ all checks passed');
} finally {
    srv.kill();
    await mongo.stop();
    process.exit(failures ? 1 : 0);
}
