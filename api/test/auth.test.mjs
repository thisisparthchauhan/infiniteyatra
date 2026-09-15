import './env.mjs';
import { after, before, beforeEach, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { startServer, makeClient, resetDatabase, closePool, query } from './helpers.mjs';

let srv;
before(async () => { srv = await startServer(); });
after(async () => { await srv.close(); await closePool(); });
beforeEach(resetDatabase);

const REG = { email: 'customer@example.invalid', password: 'a-long-enough-passphrase', fullName: 'Test Customer' };

describe('customer authentication', () => {
    test('registration creates an account and signs the user in', async () => {
        const c = makeClient(srv.base);
        const res = await c.req('/api/auth/register', { method: 'POST', body: REG });
        assert.equal(res.status, 201);
        assert.equal(res.body.user.email, REG.email);
        assert.ok(c.jar.has('iy_session'), 'a session cookie must be set');
        // The account id exposed is a public id, never the primary key.
        assert.match(res.body.user.id, /^[0-9A-HJKMNP-TV-Z]{26}$/);
        assert.ok(!('password' in res.body.user) && !('password_hash' in res.body.user));
    });

    test('the password is never stored in clear and is argon2id', async () => {
        const c = makeClient(srv.base);
        await c.req('/api/auth/register', { method: 'POST', body: REG });
        const row = (await query('SELECT password_hash FROM users WHERE email_normalised = ?', [REG.email]))[0];
        assert.ok(row.password_hash.startsWith('$argon2id$'), 'must be argon2id');
        assert.ok(!row.password_hash.includes(REG.password));
    });

    test('the session cookie is httpOnly and same-site', async () => {
        const c = makeClient(srv.base);
        const res = await c.req('/api/auth/register', { method: 'POST', body: REG });
        const setCookie = (res.headers.getSetCookie?.() || []).find((s) => s.startsWith('iy_session='));
        assert.ok(setCookie, 'session cookie must be issued');
        assert.match(setCookie, /HttpOnly/i, 'script must not be able to read the session');
        assert.match(setCookie, /SameSite=Lax/i);
    });

    test('a duplicate registration is refused', async () => {
        const c = makeClient(srv.base);
        await c.req('/api/auth/register', { method: 'POST', body: REG });
        const c2 = makeClient(srv.base);
        const res = await c2.req('/api/auth/register', { method: 'POST', body: REG });
        assert.equal(res.status, 409);
    });

    test('a short password is rejected', async () => {
        const c = makeClient(srv.base);
        const res = await c.req('/api/auth/register', { method: 'POST', body: { ...REG, password: 'short' } });
        assert.equal(res.status, 400);
        assert.ok(res.body.details.some((d) => /at least 10/.test(d)));
    });

    test('unknown registration fields are rejected, not ignored', async () => {
        const c = makeClient(srv.base);
        const res = await c.req('/api/auth/register', { method: 'POST', body: { ...REG, role: 'admin', status: 'active' } });
        assert.equal(res.status, 400);
        assert.ok(res.body.details.some((d) => d.includes('role')));
    });

    test('login then logout, and the session really dies', async () => {
        const c = makeClient(srv.base);
        await c.req('/api/auth/register', { method: 'POST', body: REG });
        await c.req('/api/auth/logout', { method: 'POST' });
        const me = await c.req('/api/auth/me');
        assert.equal(me.status, 401);

        const login = await c.req('/api/auth/login', { method: 'POST', body: { email: REG.email, password: REG.password } });
        assert.equal(login.status, 200);
        assert.equal((await c.req('/api/auth/me')).status, 200);
    });

    test('a revoked session cannot be replayed', async () => {
        const c = makeClient(srv.base);
        await c.req('/api/auth/register', { method: 'POST', body: REG });
        const stolen = c.jar.get('iy_session');
        await c.req('/api/auth/logout', { method: 'POST' });

        const attacker = makeClient(srv.base);
        attacker.jar.set('iy_session', stolen);
        assert.equal((await attacker.req('/api/auth/me')).status, 401);
    });

    test('a wrong password is refused and does not reveal whether the account exists', async () => {
        const c = makeClient(srv.base);
        await c.req('/api/auth/register', { method: 'POST', body: REG });
        const wrong = await c.req('/api/auth/login', { method: 'POST', body: { email: REG.email, password: 'not-the-password' } });
        const missing = await c.req('/api/auth/login', { method: 'POST', body: { email: 'nobody@example.invalid', password: 'whatever-long' } });
        assert.equal(wrong.status, 401);
        assert.equal(missing.status, 401);
        assert.deepEqual(wrong.body, missing.body, 'responses must be indistinguishable');
    });

    test('an unauthenticated request to a protected endpoint is 401', async () => {
        const c = makeClient(srv.base);
        assert.equal((await c.req('/api/auth/me')).status, 401);
        assert.equal((await c.req('/api/bookings')).status, 401);
    });

    test('password reset issues a single-use token and kills existing sessions', async () => {
        const c = makeClient(srv.base);
        await c.req('/api/auth/register', { method: 'POST', body: REG });

        const forgot = await c.req('/api/auth/forgot-password', { method: 'POST', body: { email: REG.email } });
        assert.equal(forgot.status, 202);
        const token = forgot.body.devToken;
        assert.ok(token);

        const reset = await c.req('/api/auth/reset-password', { method: 'POST', body: { token, password: 'a-brand-new-passphrase' } });
        assert.equal(reset.status, 204);

        // The old session is gone even though the cookie is still held.
        assert.equal((await c.req('/api/auth/me')).status, 401);

        // The token cannot be used twice.
        const replay = await c.req('/api/auth/reset-password', { method: 'POST', body: { token, password: 'yet-another-passphrase' } });
        assert.equal(replay.status, 400);

        // The new password works.
        const c2 = makeClient(srv.base);
        assert.equal((await c2.req('/api/auth/login', { method: 'POST', body: { email: REG.email, password: 'a-brand-new-passphrase' } })).status, 200);
    });

    test('forgot-password does not reveal whether an address exists', async () => {
        const c = makeClient(srv.base);
        const unknown = await c.req('/api/auth/forgot-password', { method: 'POST', body: { email: 'nobody@example.invalid' } });
        assert.equal(unknown.status, 202);
        assert.equal(unknown.body.devToken, undefined, 'no token for an address with no account');
    });

    test('the reset token is stored only as a hash', async () => {
        const c = makeClient(srv.base);
        await c.req('/api/auth/register', { method: 'POST', body: REG });
        const { devToken } = (await c.req('/api/auth/forgot-password', { method: 'POST', body: { email: REG.email } })).body;
        const rows = await query('SELECT token_hash FROM user_tokens');
        assert.equal(rows.length, 1);
        assert.notEqual(rows[0].token_hash, devToken);
        assert.match(rows[0].token_hash, /^[0-9a-f]{64}$/);
    });

    test('a cross-site POST is blocked', async () => {
        const c = makeClient(srv.base);
        await c.req('/api/auth/register', { method: 'POST', body: REG });
        const res = await c.req('/api/auth/logout-all', { method: 'POST', origin: 'https://evil.example.com' });
        assert.equal(res.status, 403);
    });
});
