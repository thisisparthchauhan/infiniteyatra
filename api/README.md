# Infinite Yatra API

Express + MariaDB on Hostinger, Node 22. Serves `/api/*` on the same origin as
the React app, so the session cookie is first-party and no CORS grant is needed
in production.

## Deploy

```bash
cd api
npm ci --omit=dev
npm run migrate                 # applies migrations/*.sql, idempotent
IY_ADMIN_EMAIL=... IY_ADMIN_PASSWORD='...' npm run seed:admin   # once, ever
npm start
```

Configure the environment from `.env.example`. Nothing in it has a committed
value.

## One-time catalogue import

Business data only — packages, hotels and stories. Customer data is not
readable by the tool: there is no code path to `users`, `bookings`, `payments`,
travellers or documents, and a guard refuses if one is added.

```bash
node scripts/import-catalogue.mjs            # dry run, reports counts
node scripts/import-catalogue.mjs --apply    # idempotent; matches on legacy_id
```

Firebase is read only. Nothing there is written or deleted.

## Storage is off at launch

`PRIVATE_STORAGE_DIR` is empty, so document upload and summary PDFs are
disabled and the UI does not offer them. `GET /api/capabilities` reports this,
and the booking payload carries it per booking, so the frontend never has to
guess. Point it at an absolute path **outside `public_html`** to enable — a
passport scan under the web root would be world-readable.

## Tests

Needs a MariaDB. Locally:

```bash
mariadb -e "CREATE DATABASE iy_test; CREATE USER 'iy_test'@'127.0.0.1' IDENTIFIED BY 'iy_test_local_only'; GRANT ALL ON iy_test.* TO 'iy_test'@'127.0.0.1';"
npm run migrate
npm test
```
