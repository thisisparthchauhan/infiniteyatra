# Production cutover foundation

Code and tests only. **Nothing here is deployed.**

Production state this was built against: 15 bookings in the legacy shape, zero
canonical PB bookings, old permissive rules live, no PB Functions deployed, no
Storage bucket.

## Classification

A booking is canonical if and only if it carries a numeric `schemaVersion >= 2`.
Anything else — including every historical record — is `LEGACY`.

The value is **2, not 1**: PB-1 already shipped `schemaVersion: 2` on canonical
bookings, so a fresh numbering would have created two competing meanings for one
field. The comparison is `>=` so a future shape bump cannot silently reclassify
every existing canonical booking as legacy and withdraw features from customers
who already have them.

The marker is written **outside** the transition-compatibility block in
`createPackageBooking`. That block is retired in PB-5; the marker must outlive it.

Sources of truth, kept identical and drift-tested:
- `functions/bookingSchema.js` (server)
- `src/config/bookingSchema.js` (client, display only)

## Legacy is read-only

| | Legacy | Canonical |
|---|---|---|
| Owner read | yes | yes |
| Booking Summary | 409 `BOOKING_SUMMARY_NOT_AVAILABLE` | yes |
| Document upload | 409 `BOOKING_DOCUMENTS_NOT_AVAILABLE` | yes |

Documents are refused for a **data** reason, not a policy one: legacy travellers
are bare names with no stable `travellerId`, and array position is not an
identity — reordering one entry would reassign another person's passport scan.

Legacy money is historical record only. No `amountReceived` or balance is ever
derived, `paymentStatus` is never read as proof of payment, and nothing is
repriced against today's catalogue.

## Deploy order — this matters

1. Deploy the PB booking API (Functions)
2. Deploy the frontend that posts to it
3. Confirm new bookings arrive carrying `schemaVersion`
4. **Only then** deploy `firestore.rules.cutover`

Until step 4, `firestore.rules` stays live and is the transitional state: it
still permits the legacy client-side create, which is what keeps the live site
taking bookings mid-cutover. Deploying the final rules early stops sales.

## PB-only API

`functions/bookingApi.js` mounts health plus the PB routes and nothing else.
`functions/index.js` is not imported — it would drag in `./security`, which
reads `JWT_SECRET` at module load and throws on a production runtime without it,
so the booking API would refuse to start over a secret it never uses. It also
keeps the unsafe legacy surface (client-supplied payment amounts, the webhook
with signature verification disabled, invoice generation, `createStaffAccount`)
off the production API entirely.

To deploy it and only it, point `functions/package.json` `main` at
`bookingApi.entry.js`.

## Storage gate

`PB_STORAGE_ENABLED` gates documents and summary PDFs. **Unset on a production
runtime means off**, because the failure mode of guessing "on" is a customer
uploading a passport scan into a bucket that does not exist. Emulator and tests
default on. Booking creation and reads never depend on storage.

Set it to `true` only once the bucket genuinely exists.

## Runtime

`functions/package.json` declares Node 22. Verified on Node 22.23.2:
firebase-admin 11.11.1, firebase-functions 4.9.0, pdfkit PDF rendering, the
booking API, and the PB-3/PB-4 emulator suites.

---

# Rehearsal findings (read-only production survey)

Surveyed read-only against `infiniteyatra-iy`. No production data was modified.

## Production is not what the brief assumed

- **16 bookings, not 15** — and the count is still moving, because the deployed
  frontend writes bookings directly. Take the backup at cutover time, not before.
- **3 distinct field shapes, not 4.** One record carries `razorpayOrderId`,
  `razorpayPaymentId`, snake_case `booking_status` / `payment_status`, and
  `updatedAt`. The customer projection is an allowlist, so none of it is exposed;
  fixture E in `tests/fixtures/legacyBookings.mjs` is the proof.
- **0 canonical bookings, 0 booking_references, 0 booking_documents**, 6 payments.
- All 16 carry a `userId`, so owner-based reads work for every historical record.

## The live rules are weaker than the repo's

The deployed ruleset (last changed 2026-07-25) contains:

```
match /bookings/{bookingId} {
  allow read: if request.auth != null;
```

**Any signed-in user can currently read every booking**, including all 16
customers' contact details. This predates the cutover work and is unrelated to
it. The repo's `firestore.rules` already fixes it with an owner check.

Shapes A and B — the two the live frontend actually creates — satisfy the repo's
transitional create allowlist, and no client code writes the Razorpay fields
(those came from the deployed `/verify-payment`, which is dead: no Functions are
deployed). So the transitional ruleset can be deployed without breaking the live
create path, and doing so early closes the read exposure sooner.

## Backup

`node scripts/cutover-backup.mjs` — `--verify` for counts and hashes only.
Managed `gcloud firestore export` is unavailable (it needs a bucket and Blaze).
At tens of documents a JSON snapshot restores just as well. Output lands in
`backups/`, which is gitignored and contains customer PII.

It captures: the four collections, the deployed ruleset (id + source, so a
rollback re-releases the exact bytes), and the owner claim state.
