# Infinite Yatra — Package Booking Implementation

**Current phase:** PB-1 — Secure Booking Foundation + Canonical Booking Record
**Status:** Review ready. Not committed, not deployed.
**Predecessor:** [`IY_PACKAGE_BOOKING_CURRENT_STATE.md`](IY_PACKAGE_BOOKING_CURRENT_STATE.md) — the current-state audit whose findings PB-1 addresses.

---

## 1. What PB-1 delivers

A server-authoritative path for creating and reading a package booking, alongside — not replacing — the existing browser-to-Firestore flow.

| Audit finding | PB-1 status |
|---|---|
| **P0-02** Browser computes and submits `totalPrice` | **Closed on the new path.** Price is derived server-side from the package document; no client amount is read or accepted |
| **P0-03** No package snapshot; edits rewrite history | **Closed on the new path.** An explicit retail-only snapshot is stored per booking |
| **P0-01** Private commercial fields reachable | **Contained on the new path.** `costPrice`, `tokenPrice`, `b2bPrice` are never snapshotted or returned. The public `packages` read rule is unchanged and still needs its own fix |
| **P1-06** `amountReceived` never written | **Schema laid.** `amountReceivedMinor` / `balanceAmountMinor` exist and are initialised. The ledger itself is PB-6 |
| **P1-07** `status` / `bookingStatus` duplicated | **Closed on the new path.** Four separate dimensions; the legacy fields are written only as a compatibility shim |
| **P0-04** Seats never decremented | **Not addressed.** Deliberately deferred — see §12 |

PB-1 bookings are always **UNPAID**. No gateway is called, no payment record is created, no invoice is issued.

---

## 2. Server host: Firebase Functions

PB-1 is implemented inside the **existing Firebase Functions Express application** (`functions/index.js`, exported as `exports.api`).

Chosen over the `server/` Node+Express+MongoDB service because PB-1's mandated constraints are already satisfied there and are not satisfied in `server/`:

| Requirement | `functions/` | `server/` |
|---|---|---|
| Canonical booking in Firestore | `firebase-admin ^11.5.0`, initialised | No firebase-admin dependency |
| Firebase Auth ID-token verification | Native | Cannot verify Firebase tokens |
| No second customer auth system | Uses Firebase Auth | Has its own bcrypt + JWT + MongoDB identity |
| No MongoDB booking records | — | Entire persistence layer is Mongoose |

Hosting PB-1 in `server/` would have required adding firebase-admin plus a **Firebase service-account private key on the VPS** — a new production secret surface — and would have placed booking ownership next to a competing identity system.

**`server/` was not modified by PB-1.**

---

## 2a. PB-1 release gates — closed

### Gate 1 — Firebase Emulator verification: **PASSED**

Java was unavailable at PB-1 review. It was installed locally as a keg-only Homebrew formula (`brew install openjdk` → `/opt/homebrew/opt/openjdk`, OpenJDK 26.0.2.1). No `sudo`, no system Java wrapper symlink, no production system touched. The emulator run needs only `JAVA_HOME=/opt/homebrew/opt/openjdk` on `PATH`.

`firebase.json` gained an `emulators` block (Auth 9099, Firestore 8080, UI disabled, `singleProjectMode`) — test configuration only.

| Suite | Command | Result |
|---|---|---|
| Unit, in-memory | `cd functions && npm test` | **71 / 71** |
| **Emulator integration** (real Admin SDK + real Firestore + real Auth) | `npm run test:emulator` | **14 / 14** |
| **PB-1 rules** (client SDK vs real `firestore.rules`) | `npm run test:pb1-rules` | **22 / 22** |
| Pre-existing rules (regression) | `npm run test:firestore-rules` | **36 / 36** |
| | **Total** | **143 / 143, 0 failures** |

| # | Gate 1 requirement | Evidence |
|---|---|---|
| 1 | Authenticated booking creation | `[G1-2][G1-4]` — read back through Admin SDK; `createdAt` is a real Firestore timestamp |
| 2 | Unauthenticated booking rejected | `[G1-1]` — 401, collection size unchanged |
| 3 | Firebase ID-token behaviour | `[G1-3]` ×3 — tokens genuinely minted by the Auth emulator and verified by `verifyIdToken()`; tampered signature and foreign-issuer tokens rejected |
| 4 | Booking transaction write | `[G1-2][G1-4]` — all four documents (booking, reference, activity, idempotency) committed together |
| 5 | Idempotency duplicate handling | `[G1-5]` ×2 — including **4 genuinely concurrent** submissions under real Firestore contention settling to exactly one booking and one audit entry |
| 6 | Reference reservation collision | `[G1-6]` ×2 — retry yields a distinct reference; pinned-collision case exhausts retries |
| 7 | Rollback / no partial writes | `[G1-6][G1-7]` — generator pinned to a pre-reserved value; handler returns 503 and leaves **no booking, no idempotency record**, with the existing reservation untouched |
| 8 | Owner reads own booking | `[G1-8]` |
| 9 | Cross-user read rejected | `[G1-9]` — 404, byte-identical to not-found |
| 10 | Server-owned collections closed to clients | `tests/pb1.rules.test.mjs` — 22 tests across `booking_references`, `booking_idempotency`, `activity`, and `bookings` ownership |

Requirement 5's concurrency case and requirement 7's rollback case are the two the in-memory double could not exercise; both now run against real Firestore.

### Blocker found and repaired: `functions/` dependency install

**Symptom.** `npm install` inside `functions/` failed outright:

```
npm error notarget No matching version found for jsonwebtoken@^9.1.2.
```

**Root cause — two faults, not one.**

1. `functions/package.json` pinned `jsonwebtoken@^9.1.2`. That version has never been published; 9.x releases are 9.0.0–9.0.3. `functions/security.js:16` genuinely requires the package.
2. More significantly, `functions/package-lock.json` had drifted badly: its root recorded only **8** of the **14** declared dependencies. `express-rate-limit`, `helmet`, `jsonwebtoken`, `qrcode`, `speakeasy` and `validator` were declared in the manifest but absent from the lock root. `jsonwebtoken@9.0.3` existed in the tree only *transitively*, as a dependency of `firebase-admin` (`^9.0.0`).

So `npm ci` would have failed on manifest/lock desynchronisation even with a valid version string. Both faults are pre-existing and unrelated to PB-1.

**Repair.** `jsonwebtoken` declared as `^9.0.3` — the exact version already resolved in the tree, so the installed package is byte-identical and `firebase-admin`'s own `^9.0.0` constraint is still satisfied. The lockfile was then refreshed with `npm install --package-lock-only`.

**Result — `npm ci` passes**, 341 packages:

| Check | Outcome |
|---|---|
| Direct dependencies changed | **None.** `firebase-admin` 11.11.1, `firebase-functions` 4.9.0, `express` 4.22.1, `cors`, `dotenv`, `nodemailer`, `pdfkit`, `razorpay` and `jsonwebtoken` 9.0.3 all unchanged |
| Packages removed | 0 |
| Packages added | 27 — the 6 previously unrecorded direct deps and their transitive trees |
| Transitive version changes | 1 — `linkify-it` 5.0.0 → 5.0.2 under `markdown-it`, a patch bump within its existing range, an unavoidable consequence of refreshing the lock |
| JWT behaviour | Unchanged — sign/verify round-trip, wrong-secret rejection and tampered-signature rejection all verified |
| Module loading | All six `functions/` modules load; all four PB-1 routes register |

The root-level `--no-save` install of `firebase-admin` used during gate verification is now redundant, since `functions/node_modules` is populated correctly.

---

## 3. Ingress requirement before release

**Production `/api` ownership is unverified and remains an open Phase 0 dependency** ([`IY_TARGET_ARCHITECTURE.md` §18](IY_TARGET_ARCHITECTURE.md)). Two committed, mutually exclusive configurations both claim `https://infiniteyatra.com/api/**`:

| Claimant | Evidence |
|---|---|
| Firebase Hosting → Function `api` | `firebase.json` rewrite `/api/** → "function": "api"`; `vite.config.js` dev proxy |
| VPS → Nginx → PM2 → `server/` | `deploy/setup.sh:88` `location /api/ { proxy_pass … }`; `deploy/DEPLOY.md`; `.env.production.example` |

A live check of `https://www.infiniteyatra.com/api/health` returned the frontend application rather than an Express health response, so **neither claimant is currently confirmed to serve `/api`**.

PB-1 therefore never hardcodes an origin. The client reads `VITE_BOOKING_API_BASE_URL`:

| Environment | Value | Notes |
|---|---|---|
| Local dev | *(empty)* | `vite.config.js` already proxies `/api` to the Functions emulator |
| Emulator, direct | `http://127.0.0.1:5001/infiniteyatra-iy/us-central1/api` | Bypasses the proxy |
| Staging | Cloud Functions HTTPS URL, or a dedicated API subdomain | |
| Production | *(empty)* **only once `/api` provably reaches Functions**; otherwise the direct Functions URL or an API subdomain | |

### Gate 2 — API origin decision

**A live check of `https://www.infiniteyatra.com/api/health` returned the React application, not a JSON response.** That is diagnostic: under the configured Firebase Hosting rewrite, `/api/health` would reach the Functions app and return a JSON 404 (no such route exists), not the SPA. Returning the SPA means the catch-all `** → /index.html` rewrite won, so **`/api` does not currently reach either backend on the live domain**.

| Option | Verdict |
|---|---|
| **A. Same-origin Firebase Hosting rewrite** | **Recommended for production.** Already configured in `firebase.json`. No CORS, no CSP change, no DNS change, no new config surface. Requires a Hosting deploy to take effect, and requires that Firebase Hosting actually serves the apex domain |
| **B. Direct Functions HTTPS URL** | **Recommended for staging.** `https://us-central1-infiniteyatra-iy.cloudfunctions.net/api`. Works under either topology, so it is the only option that can be validated *before* the ingress question is settled. Cross-origin, so needs CORS (already allowlisted) and a CSP entry |
| C. Dedicated API subdomain | Rejected — requires a DNS change, which is out of scope, for no benefit over A |
| D. VPS nginx exception proxy | Rejected unless the VPS is confirmed live. Adds a proxy hop and a second place routing can silently drift, which is exactly the class of problem that produced the current ambiguity |

**Recommendation: A for production, B for staging.** A is the simplest stable end state — same-origin removes CORS and CSP from the picture entirely, and the rewrite already exists. B is needed first because A cannot be validated without deploying Hosting, and PB-2 needs a reachable endpoint to integrate against.

Because PB-1 made the origin env-driven, moving B → A is a one-line environment change with no code edit.

| | Value |
|---|---|
| **Local development** | `VITE_BOOKING_API_BASE_URL=` (empty). `vite.config.js` already proxies `/api` → `http://127.0.0.1:5001/infiniteyatra-iy/us-central1/api`, stripping the `/api` prefix — which is why PB-1 registers both bare and `/api`-prefixed routes |
| **Staging** | `VITE_BOOKING_API_BASE_URL=https://us-central1-infiniteyatra-iy.cloudfunctions.net/api` (Option B) |
| **Production** | `VITE_BOOKING_API_BASE_URL=` (empty, Option A) once Hosting is confirmed to serve the domain and the rewrite is deployed. Until then, Option B |

**CORS requirement:** No change needed for Option A (same-origin). For Option B the existing allowlist at `functions/index.js:51` already contains `https://infiniteyatra.com`, `https://www.infiniteyatra.com`, `https://infiniteyatra-iy.web.app`, `http://localhost:5173` and `http://localhost:4173` — sufficient. Add a staging origin only if one is introduced.

**CSP requirement:** Only `netlify.toml` sets a CSP; Firebase Hosting sets none (`firebase.json` has no `headers` block) and the nginx config sets none. For Option A no change is needed (`connect-src 'self'` covers it). For Option B, if the Netlify target is used, `connect-src` must gain `https://*.cloudfunctions.net` — it currently lists only `'self'`, `*.firebaseapp.com`, `*.firebasestorage.app`, Google auth, GitHub and EmailJS.

**Production DNS change required: NO** under both A and B.

**Remaining before release:**

1. Confirm which host serves `infiniteyatra.com`, and why `/api/**` currently falls through to the SPA — most likely a Hosting deploy predating the rewrite.
2. ~~Fix `functions/package.json`'s `jsonwebtoken` pin~~ — **done**, see §2a. `npm ci` now passes.
3. Deploy Functions, then Hosting, then re-check `/api/health`.

---

## 4. Canonical booking model

Firestore remains the single source of truth. The existing **`bookings`** collection is reused — no `bookings_v2`, no MongoDB mirror.

PB-1 documents carry `schemaVersion: 2`. Pre-PB-1 documents have no `schemaVersion` and are treated as version 1.

### Collections

| Path | Purpose | Writer |
|---|---|---|
| `bookings/{bookingId}` | Canonical booking | Server (Admin SDK) + legacy client path |
| `bookings/{bookingId}/activity/{id}` | Audit trail | Server only |
| `booking_references/{reference}` | Uniqueness reservation for `IY-BKG-…` | Server only |
| `booking_idempotency/{sha256}` | Duplicate-submission guard | Server only |

### Record shape (v2)

```
identity     userId (from verified token), bookingReference, schemaVersion
package      packageId, packageSnapshot{…}
selection    departureDate, travellerCount, pickupLocationIndex
contact      customer{name,email,phone}, travellers[], specialRequests
bundle       hotelBundle{hotelId,hotelName,roomId,roomName,roomPriceMinor} | null
money        pricing{…}, amountReceivedMinor, balanceAmountMinor
status       bookingStatus, paymentStatus, documentStatus, paymentPlan
attribution  source, channel
timestamps   createdAt, updatedAt
legacy shim  status, packageTitle, bookingDate, travelers, contactName,
             contactEmail, contactPhone, travelersList, totalPrice,
             tourAmount, hotelAmount, pickupLocation, bundledHotelId,
             bundledHotelName
```

### Traveller storage: embedded

Travellers are stored **embedded** as `travellers[]`, not as a subcollection.

- Travellers are always read with their booking and never queried independently, which is exactly the case Firestore denormalisation is for.
- A 50-traveller booking of text fields is a few KB against a 1 MB document limit.
- The existing admin UI already reads the embedded `travelersList`; a subcollection would have forced an admin rewrite inside PB-1.
- Identity **documents** stay out of the booking entirely (PB-3), so the size and privacy arguments for splitting do not apply.

The legacy `travelersList` is written alongside `travellers` as part of the compatibility shim.

### Package snapshot

Built field-by-field in `buildPackageSnapshot()` — never a spread of the package document. Retail facts only: title, slug, location, duration, difficulty, departure type, pickup, inclusions, exclusions, cancellation policy, general policy, `unitPriceMinor`, `currency`, `snapshotAt`.

**Never snapshotted:** `costPrice`, `tokenPrice`, `pickupLocations[].b2bPrice`, `adminNotes`, `internalNotes`, `financialNotes`.

---

## 5. Money representation

All authoritative arithmetic is in **integer minor units (paise)**. Catalogue values are stored as rupees and converted once at the boundary by `toMinor()`, which rounds and then never re-enters floating point.

| Field | Meaning |
|---|---|
| `pricing.currency` | `'INR'` — explicit from day one, for international readiness |
| `pricing.minorUnitsPerMajor` | `100` |
| `pricing.unitPriceMinor` | Per-traveller price |
| `pricing.tourAmountMinor` | `unitPriceMinor × travellerCount` |
| `pricing.hotelGrossMinor` / `hotelDiscountMinor` / `hotelAmountMinor` | Bundle components |
| `pricing.grossAmountMinor` | **Authoritative booking total** |
| `amountReceivedMinor` | `0` at creation |
| `balanceAmountMinor` | `grossAmountMinor` at creation |

`toMinor()` rejects `null`, `undefined`, `''`, `[]`, `NaN`, negatives and out-of-range values rather than coercing them — `Number(null)` is `0`, which would otherwise price a booking at zero from a malformed catalogue field. A unit test covers each case.

The legacy rupee fields (`totalPrice`, `tourAmount`, `hotelAmount`) are **derived** from the minor-unit values for admin-UI compatibility and are never authoritative.

---

## 6. Pricing authority

**Server-authoritative: YES.**

The formulas reproduce the existing client behaviour in `src/pages/BookingPage.jsx` exactly; PB-1 moves *where* they run, it does not change *what* they compute.

```
unitPrice   = hasPickupLocations ? (pickupLocations[idx].price || package.price)
                                 : package.price
tourAmount  = unitPrice × travellerCount
hotelGross  = bundled room price            (resolved server-side from the hotel doc)
hotelDisc   = round(hotelGross × 15 / 100)
grossAmount = tourAmount + (hotelGross − hotelDisc)
```

Two behaviours reproduced deliberately, both marked in the source:

- **The `||` fallback** (not `??`): a pickup location priced `0` falls back to the package base price. This is live production behaviour; "fixing" it silently would change what customers are charged.
- **The private-group rule**: once `travellerCount >= package.minimumPersons`, any **in-season** date becomes bookable regardless of `departureType`. This lives in the DatePicker's `filterDate` in the existing UI and is easy to miss; it is commercially significant and is reproduced in `validateDeparture()`.

The bundled room price is re-resolved from the canonical hotel document. The client may name a `hotelId` and `roomId`; it may not state a price.

### Validated before pricing

package exists · package is bookable (`isVisible !== false`) · traveller count within `maxGroupSize` (absolute ceiling 50) · departure inside the season window · departure valid for `departureType` · pickup index in range · bundled hotel exists, is visible, and has the named room.

**`maxGroupSize` is now enforced.** The audit found it was collected but never applied. This is validation, not a formula change.

---

## 7. Booking reference

**Format:** `IY-BKG-<YYYY>-<SSSSSS>` — e.g. `IY-BKG-2026-7K4MQP`

- **Alphabet:** `23456789ABCDEFGHJKMNPQRSTVWXYZ` (30 chars). `0 O 1 I L U` excluded so the reference survives being read aloud or re-typed.
- **Not sequential.** A sequential public reference leaks trading volume — `IY-BKG-2026-000123` tells any holder roughly how many packages sold this year. ~729 million combinations per year instead.
- **Uniform draw.** Rejection sampling, not `byte % 30`, which would over-represent the first 16 characters by ~6%. A distribution test guards this.
- **Collision-safe.** Uniqueness comes from a transactional `booking_references/{reference}` reservation created in the same transaction as the booking, not from the randomness alone. `tx.create` fails if the document exists; the handler retries with a fresh candidate, up to 5 attempts, then returns `503` rather than issuing a duplicate.

The Firestore document ID remains separate and is what the API paths use.

---

## 8. Status model

Four independent dimensions. They change for different reasons, at different times, driven by different people — collapsing them forces staff to pick one label for several realities, and the data stops meaning anything.

| Dimension | Values | At creation |
|---|---|---|
| `bookingStatus` | `SUBMITTED` `UNDER_REVIEW` `CONFIRMED` `CANCELLED` `COMPLETED` | `SUBMITTED` |
| `paymentStatus` | `UNPAID` `PARTIALLY_PAID` `FULLY_PAID` | `UNPAID` |
| `documentStatus` | `NOT_REQUIRED` `PENDING` `PARTIAL` `COMPLETE` | `PENDING` |
| `paymentPlan` | `FULL` `TOKEN_BALANCE` `UNDECIDED` | `UNDECIDED` |

`paymentPlan` defaults to `UNDECIDED` because the current booking form does not ask. From PB-6, `paymentStatus` must be **derived from the payment ledger**, never typed by hand.

A booking never becomes paid by being submitted.

---

## 9. API contracts

### `POST /api/bookings/package`

Auth: `Authorization: Bearer <Firebase ID token>` — required.
Rate limit: 20 per 15 min per IP.

```jsonc
{
  "packageId": "himalaya-trek",
  "departureDate": "2026-05-15",          // YYYY-MM-DD
  "travellerCount": 2,
  "pickupLocationIndex": 0,               // optional, default 0
  "customer": { "name": "…", "email": "…", "phone": "+91…" },
  "travellers": [                          // optional; length must equal travellerCount
    { "firstName": "…", "lastName": "…", "dateOfBirth": "…", "gender": "…",
      "nationality": "…", "contactNumbers": ["…"], "emergencyContacts": [ … ] }
  ],
  "specialRequests": "…",                 // optional, ≤ 2000 chars
  "hotelBundle": { "hotelId": "…", "roomId": "…" },   // optional
  "paymentPlan": "UNDECIDED",             // optional
  "idempotencyKey": "bk-…",               // required, 16–128 chars
  "source": "web", "channel": "…"         // optional
}
```

`201` on create, `200` on idempotent replay (`idempotentReplay: true`), both returning the customer-safe booking.

**Any unlisted top-level field is rejected with `400`.** `userId`, `totalPrice`, `bookingStatus`, `pricing` and every future privileged field are refused by that rule rather than silently ignored, so tampering is visible in the response instead of quietly dropped.

Errors: `400` validation · `401` unauthenticated · `404` package or hotel not found · `409` package not bookable · `503` reference exhaustion.

### `GET /api/bookings/:bookingId`

Auth required. Returns the customer-safe booking, or `404` if the booking does not exist **or is not yours** — the two are deliberately indistinguishable so the endpoint cannot be used to probe which ids exist. A test asserts the responses are byte-identical.

### Customer-safe projection

`toCustomerSafeBooking()` is an **allowlist**. A field added to the booking document is invisible to customers until it is explicitly named there, so internal notes, supplier cost, margin or audit data cannot leak by being forgotten.

---

## 10. Authentication and authorization

**Authentication:** `requireFirebaseUser` verifies the bearer token with `admin.auth().verifyIdToken()` and sets `req.authUser = { uid, email }`. The uid comes from the verified token and nothing else — not the body, query string, a localStorage-backed header, or the Firestore user profile.

**Authorization:**
- *Create* — the booking's `userId` is assigned from `decoded.uid`. A body `userId` is rejected as an unaccepted field.
- *Read* — the stored `userId` is compared to the verified uid before any data is serialised.

### Admin SDK bypasses Firestore rules

The Admin SDK is not subject to Firestore Security Rules. **Every authorization decision on these routes is made in server code.** The rules added in §11 govern the browser SDK path only and must not be cited as protection for the API.

---

## 11. Firestore rules and indexes

**Rules changed — yes, three additive blocks:**

| Path | Rule | Why |
|---|---|---|
| `bookings/{id}/activity/{id}` | `read: isAdmin()`, `write: false` | Audit trail is server-written |
| `booking_references/{ref}` | `read: isAdmin()`, `write: false` | Server-owned reservations |
| `booking_idempotency/{id}` | `read, write: false` | Server-owned |

All three were already denied by Firestore's default-deny. They are stated **explicitly** because audit finding P0-08 was exactly this failure mode: a missing rule on `bookings/{id}/documents` caused an unnoticed permanent write failure. An explicit `write: false` fails loudly at review time rather than silently at runtime.

The existing `bookings` create rule is **unchanged** — the legacy client path must keep working until PB-2.

**Indexes changed — none.** PB-1 issues only document-ID lookups (`packages/{id}`, `hotels/{id}`, `bookings/{id}`, and the two server-owned docs), none of which need an index. The existing `bookings: userId ASC + createdAt DESC` composite already covers the customer-bookings-by-date query PB-2 will need. No speculative indexes were added.

---

## 12. Deliberately out of scope

| Item | Phase |
|---|---|
| Frontend cutover to the new API | **PB-2** |
| Secure traveller/customer documents | **PB-3** |
| Booking Summary / Provisional Invoice | **PB-4** |
| Admin booking management | **PB-5** |
| Manual/offline payment ledger | **PB-6** |
| Notifications | **PB-7** |
| **Seat inventory (`availableSeats`, audit P0-04)** | **PB-3** — needs a `departures` collection with transactional decrement; embedding the counter in `batchDates[]` cannot be decremented atomically |
| **Public `packages` read rule (audit P0-01)** | Separate — PB-1 contains the leak on the booking path but the catalogue is still world-readable |
| Razorpay / online payment | Untouched |

---

## 13. Tests

`cd functions && npm test` — **71 tests, 71 passing, 0 failing.** Node's built-in runner; no emulator required.

| File | Tests | Covers |
|---|---|---|
| `test/packageBookingPricing.test.js` | 27 | Money conversion, unit-price resolution, departure rules, traveller limits, bundle maths, integer-only guarantees |
| `test/packageBookingReference.test.js` | 7 | Format, alphabet, uniqueness over 20k draws, distribution bias |
| `test/packageBookingApi.test.js` | 37 | The mandated security matrix end to end |

### Mandated matrix

| # | Requirement | Test |
|---|---|---|
| 1 | Unauthenticated create rejected | `[1]`, `[1b]` |
| 2 | Authenticated create succeeds | `[2]` |
| 3 | Client `userId` cannot change owner | `[3]`, `[3b]` |
| 4 | Nonexistent package rejected | `[4]` |
| 5 | Unpublished package rejected | `[5]` |
| 6 | Manipulated price cannot set the total | `[6]`, `[6b]`, `[6c]` |
| 7 | Invalid departure rejected | `[7]`, `[7b]` |
| 8 | Invalid pickup rejected | `[8]` |
| 9 | Invalid traveller count rejected | `[9]`, `[9b]` |
| 10 | Duplicate submission creates one booking | `[10]`, `[10b]`, `[10c]` |
| 11 | New booking is UNPAID | `[11][12][13]`, `[11b]` |
| 12 | Received starts at zero | `[11][12][13]` |
| 13 | Balance equals server total | `[11][12][13]` |
| 14 | Customer reads own booking | `[14]` |
| 15 | Customer cannot read another's | `[15]`, `[15b]`, `[15c]` |
| 16 | Private fields never exposed | `[16]`, `[16b]`, `[16c]` |
| 17 | Reference server-generated, collision-safe | `[17]`, `[17b]`, `[17c]` |

### On the test double

The Firestore emulator needs a Java runtime, which is not installed on this machine (`java -version` fails). Rather than ship untested code or assert against constants, the API tests run the **real handlers** — auth middleware, validation, package loading, pricing, the idempotency transaction, the ownership check and the projection all execute — against an in-memory Firestore double (`test/helpers/fakeFirestore.js`).

The double matches Firestore where the handlers depend on it: `tx.create` rejects if the document exists (which is what makes reference reservation and idempotency collision-safe), and a thrown transaction applies no writes.

**What this does not cover, and needs the emulator before release:** real Firestore transaction contention and retry, real `verifyIdToken` signature validation, and the deployed Security Rules themselves. Once Java is available:

```bash
npm run test:firestore-rules     # existing rules harness
```

### Two real defects the tests caught

- `toMinor()` accepted `null` and `''` via `Number()` coercion, which would have priced a booking at **zero** from a malformed catalogue field. Now rejected explicitly.
- A naive leak assertion matched `"2000"` as a substring of the legitimate total `3200000`. Rewritten to assert on keys and exact values.

---

## 14. PB-2 — Customer booking API cutover (delivered)

### Old flow

```
Customer → BookingPage.handleConfirm()
   ├─ doc(collection(db,'bookings'))        client-generated id
   ├─ setDoc(...)  totalPrice, tourAmount, hotelAmount, statuses  ← all client-computed
   ├─ uploadDocFiles() → Firebase Storage
   │    └─ addDoc(bookings/{id}/documents)  ← ALWAYS failed, silently swallowed
   ├─ addDoc(hotel_bookings)                client-written bundle record
   ├─ addCredits(...)
   └─ navigate('/booking-success', { state })   ← lost on refresh
```

### New flow

```
Customer → BookingPage.handleConfirm()
   ├─ auth check → /login with `from` if the session expired
   ├─ buildCreateBookingPayload()   no price, no owner, no statuses
   ├─ POST /api/bookings/package    Bearer <Firebase ID token>
   │    └─ server: verify token → validate → price → reference → Firestore
   ├─ compare server total to the displayed estimate → notice if different
   ├─ addCredits(...)               unchanged
   └─ navigate('/booking-success?id=<id>', { state: { booking } })
        └─ on refresh: getMyBooking(id) re-fetches through the API
```

### Frontend files changed

| File | Change |
|---|---|
| `src/pages/BookingPage.jsx` | Firestore create, document upload and hotel-bundle write removed; submit now posts to the booking API; auth redirect, idempotency lifecycle, price-change notice, UNPAID display, disabled-while-submitting |
| `src/services/packageBookingApi.js` | Structured `BookingApiError`, testable `buildCreateBookingPayload`, `toCustomerMessage`, `stepForError`, DI seam for tests |
| `src/pages/BookingSuccess.jsx` | Reads the server booking; re-fetches via `getMyBooking` when router state is absent; shows the booking reference and `UNPAID`; PDF relabelled "Booking Summary — Not a payment receipt"; auto-download removed |
| `src/pages/Login.jsx` | Honours `location.state.from` (in-app paths only) so an expired session returns to the booking |

### Auth token handling

`getAuth().currentUser.getIdToken()` is called per request — never cached, so a refreshed token is always used. Sent as `Authorization: Bearer <token>`. The browser sends **no** `userId`, `customerId`, `ownerId` or `role`; PB-1's validator rejects unknown keys, so an attempt fails loudly rather than being ignored.

### Idempotency lifecycle

| Event | Behaviour |
|---|---|
| Reaching the review step | Key minted once via `crypto.randomUUID()` (random, not timestamp-derived) |
| Submit, retry after failure, double-click | **Same key reused** — the server replays the original booking and returns 200 |
| Date, traveller count, pickup or bundled hotel changes | Key discarded — this is a genuinely different booking |
| Stepping back and forward without changing anything | Key retained, so a re-submit still cannot duplicate |

### Success refresh behaviour

The booking id is carried in the URL (`/booking-success?id=…`) as well as router state. On refresh or a direct revisit the page calls `getMyBooking(id)`, which is ownership-checked server-side — another customer opening the same URL gets the same 404 as a non-existent booking.

### Error states

| Condition | Customer sees |
|---|---|
| Session expired | "Please sign in to complete your booking." → redirected to login, returns to the booking |
| Package missing / not bookable | "This package is currently unavailable for booking." |
| Invalid departure | "Please select an available departure date." → returned to step 1 |
| Invalid pickup | "Please select a valid pickup option." → returned to step 1 |
| Contact details rejected | "Please check your contact details and try again." → step 1 |
| Traveller details rejected | "Please check the number of travellers and their details." → step 2 |
| Bundled hotel gone | "The selected hotel is no longer available. Please remove it and try again." |
| Network failure | "We could not submit your booking. Please try again. Your booking will not be duplicated." |
| Server error | Same reassurance, "please try again in a moment" |

No message contains a collection name, field path or stack frame; a test asserts this across every error class.

### Price-change handling

The form still shows a client-side estimate. If the server's authoritative total differs, the booking is **not** silently accepted: an amber notice shows the earlier figure struck through beside the revised amount, the submit button is disabled, and the customer must click "Accept revised amount & continue". Because the booking was already created (idempotently) this is safe — it is UNPAID and nothing is charged.

### Direct Firestore cutover

`src/pages/BookingPage.jsx` now contains **no** `setDoc`, `addDoc`, `updateDoc`, `deleteDoc` or `serverTimestamp` call. Its remaining Firestore use is read-only (package lookup, suggested hotels) and is deliberately preserved. Admin and `MyBookings` Firestore usage is untouched.

### Firestore rules — prepared, not applied

With no browser writing bookings, the `bookings` create rule could tighten to `allow create: if isAdmin()`, closing audit P0-02 at the rules layer. **This is deliberately NOT changed**: the currently deployed frontend still uses the old path, and tightening before the cutover deploys would break live bookings. Apply it only after the PB-2 build is deployed and verified.

### Dependencies carried forward

- **PB-3 — documents.** The booking form still collects ID documents, but they are no longer uploaded at submit. Previously files went to Storage while the metadata write silently failed (audit P0-08), leaving orphaned passports under unreviewable Storage rules. The customer is now told documents will be requested separately. PB-3 owns secure upload, `documentStatus` and retention.
- **PB-4 — booking summary.** The confirmation PDF is relabelled and no longer auto-downloads, but the formal Provisional Booking Invoice is PB-4.
- **Hotel bundle record.** The bundle is priced and stored on the booking by the server, but the separate `hotel_bookings` row the client used to write is gone. If hotel operations need that row, it must be created server-side — a PB-5 follow-up, noted so it is not lost.
- **Ingress (§3).** Unchanged and still open for production.

### Staging configuration

```
VITE_BOOKING_API_BASE_URL=https://us-central1-infiniteyatra-iy.cloudfunctions.net/api
```

Local development leaves it empty — `vite.config.js` proxies `/api` to the Functions emulator. Production stays empty only once `/api` provably reaches Functions (§3).

---

## 14a. PB-3 — Secure traveller documents (delivered)

### What existed before, and what PB-2 removed

The pre-PB-2 booking form uploaded identity documents to Firebase Storage at
`bookings/{bookingId}/traveler_{n}/{filename}` and then wrote metadata to
`bookings/{bookingId}/documents`. That metadata write had **no Firestore rule**,
so it failed every time and the failure was swallowed by a `catch` (audit
P0-08). The observable result was the worst possible combination: the customer
was told their documents were submitted, passports and Aadhaar scans really did
land in Storage, no database record was ever created, and the admin document
viewer was empty for every booking. Because nothing pointed at those files, they
could not be found, reviewed, or deleted on request.

PB-2 stopped that flow rather than continue producing orphans. PB-3 replaces it.

**Reusable:** the document-type vocabulary from the booking form, and the
intended `bookings/{bookingId}/documents` subcollection path — which is now
implemented properly rather than abandoned. **Replaced:** the storage location,
the upload trigger point, the metadata writer, and the access model.

### Why documents are collected after the booking exists

The old flow uploaded files *before* a booking existed, so an upload failure
could cost the customer their booking, and a retry could create a second one.
PB-3 collects documents on the confirmation screen, against a booking that
already has a stable id and reference. A document failure is now structurally
incapable of affecting the booking, and a retry targets the same booking.

### Storage architecture

```
private-bookings/{ownerUid}/{bookingId}/travellers/{travellerId}/{documentId}
```

**The uid is the security boundary.** Firebase Storage rules cannot read
Firestore — there is no cross-service `get()` — so rules alone can never answer
"does this booking belong to this user?". Rather than weaken access to work
around that, ownership is encoded in the path and `storage.rules` pins the first
segment to `request.auth.uid`. That makes the guarantee that actually matters —
customer A can never reach customer B's identity documents — enforced by the
platform on read, write and delete alike.

The residual gap is narrow and closed one layer up: a customer could upload to a
*made-up bookingId inside their own namespace*. The finalize endpoint refuses to
create metadata for it, so it is an orphan with no database record rather than a
document. Orphan sweeping is listed under deployment dependencies below.

### Upload flow

```
browser ──1── uploadBytesResumable() ──▶ Firebase Storage
                                          (storage.rules: uid + MIME + size)
        ──2── POST /api/bookings/:id/documents
                 server: verify ID token
                         load booking, confirm caller owns it
                         confirm travellerId belongs to THAT booking
                         derive the expected storage path from trusted ids
                         read the REAL object metadata back from Storage
                         reject + delete if type or size is wrong
                         write bookings/{id}/documents/{documentId}
                         append DOCUMENT_UPLOADED activity
                         recompute booking.documentStatus
```

The file body never passes through Cloud Functions — there is no reason to pay
that cost when the rules already enforce ownership. Critically, **content type
and size are read from the stored object, not from the client's claims**, so a
lying client cannot register a 500 MB HTML file as a small PDF.

### Metadata model

One canonical location, reusing the path the old code intended:
`bookings/{bookingId}/documents/{documentId}`. No `traveller_documents`, no
`booking_documents`, no `documents_v2`.

| Field | Source |
|---|---|
| `documentId`, `bookingId`, `travellerId`, `documentType`, `expiryDate` | validated request |
| `customerId` | **copied from the booking**, never from the request |
| `storagePath` | **derived server-side** from trusted ids |
| `mimeType`, `fileSize` | **read back from the real Storage object** |
| `originalFilename` | sanitized, metadata only, never part of a path |
| `reviewStatus`, `rejectionReason`, `reviewedBy`, `reviewedAt` | server-owned; the customer cannot set or influence them |
| `uploadedBy`, `uploadedAt`, `updatedAt` | server |

**No download URL and no Firebase token is ever stored**, and `storagePath` is
never returned to a customer.

### Traveller identifier

PB-1 travellers had no stable id, so documents could only have been keyed by
array position — which would silently re-point if the list were ever reordered.
PB-1's booking creation now assigns `travellerId` (`tr_` + 12 hex) to each
traveller server-side. No separate traveller collection was introduced.

### Document types, formats and limits

`PHOTO` · `PASSPORT` · `AADHAAR` · `PAN` · `VISA` · `DRIVING_LICENCE` ·
`VOTER_ID` · `OTHER` — the vocabulary the booking form already used, kept as a
flat allowlist so international additions need no structural change.

**Accepted:** `application/pdf`, `image/jpeg`, `image/png`, `image/webp`.
Deliberately excluded: SVG (scriptable), HTML, JavaScript, executables and
`application/octet-stream`.

**Maximum 10 MB.** A phone photo of a passport page is typically 2–5 MB and a
multi-page PDF scan a little more, so 10 MB accommodates a legible scan while
refusing anything large enough to be abusive. No client-side compression is
applied: an illegible identity document is worse than a large one.

### Document status

`PENDING` (no documents) → `PARTIAL` (one or more). **`COMPLETE` is never
returned**, and that is deliberate: packages do not yet declare which documents
they require, so there is no honest way to know when a booking is finished.
Claiming `COMPLETE` on the first upload would tell operations a booking is ready
when it is not. `NOT_REQUIRED` is reachable only from an explicit empty
requirement list.

The value is recomputed server-side after every document change. A customer can
never set it.

**Future dependency:** once packages carry a document-requirements field
(likely differing for domestic vs international), `deriveDocumentStatus()`
becomes a real comparison and `COMPLETE` becomes meaningful. That field is
deliberately not invented here.

### Review states and replace/delete

`UPLOADED` → `UNDER_REVIEW` → `APPROVED` / `REJECTED`. Only staff move a
document past `UPLOADED`; PB-5 exposes the controls.

A customer may replace a document before approval, reusing the same
`documentId`; the replacement resets `reviewStatus` to `UPLOADED` so a file
cannot be swapped behind an approval. Deletion removes the Storage object first
and the metadata second, so a failure can never leave a record pointing at a
file that is gone. An approved document cannot be removed by the customer.

### Viewing

Customer self-view uses the authenticated Storage SDK (`getBlob`), so access is
authorized by the rules at read time against the caller's own uid. The resulting
object URL is transient and revoked; nothing durable is minted or stored.
Staff have **no ambient read access** — PB-5 will issue short-lived,
server-authorized signed URLs so that every staff access to an identity document
is attributable rather than ambient.

### Privacy classification

| Document | Assessment |
|---|---|
| `PHOTO` | Operationally useful (manifests, permits) |
| `PASSPORT` | **Required for international only.** Not justified for a domestic trek |
| `VISA` | Required for international only |
| `AADHAAR` | **Flagged for owner/legal review.** Aadhaar carries specific statutory handling obligations. It is offered to every traveller on every package today with no stated purpose |
| `PAN` | Only if tax reporting genuinely requires it |
| `DRIVING_LICENCE`, `VOTER_ID` | Alternative ID where one is needed |

PB-3 deliberately did **not** widen collection: every type offered was already
in the booking form. It also did not make anything mandatory. Making document
requirements conditional on package type is the correct fix and depends on the
business decisions already listed in the audit.

### International extensibility

The model already carries `documentType` and an optional `expiryDate`, and the
path is keyed by ids rather than by any country assumption — so passport, visa,
travel insurance and country-specific supporting documents are additions to an
allowlist, not a redesign. No visa workflow is built here.

### Tests

| Suite | Command | Result |
|---|---|---|
| **PB-3 Storage rules** (real Storage emulator) | `npm run test:pb3-storage` | **31 / 31** |
| **PB-3 document API** (real Firestore + Auth + Storage) | `npm run test:pb3` | **20 / 20** |

Covering every mandated boundary: anonymous denial, cross-customer upload/read/
list/delete denial, staff having no ambient read, six disallowed MIME types,
missing content type, oversize and empty files, loose and over-nested paths, the
closed legacy path, path-like filenames, server-derived ownership, refusal of
`reviewStatus`/`reviewedBy`/`customerId`/`storagePath` in the request, unknown
and cross-booking traveller ids, replace lifecycle, orphan-free delete, approved
documents surviving customer deletion, status recomputation, and audit entries
carrying no filename, document number or path.

### Deployment dependencies

1. **`storage.rules` is new and NOT deployed.** Deploying it **replaces the
   unreviewed rules currently live in the Console**. Before
   `firebase deploy --only storage`, read the live rules and confirm the only
   production Storage consumers are still `iy_cars/**` and
   `transport/content/**` — those are preserved here; everything else migrated
   to Cloudinary.
2. **`firestore.rules`** gains a `bookings/{id}/documents` deny-to-client block.
3. **Legacy orphan sweep.** Identity documents from the pre-PB-2 flow remain
   under `bookings/**` in Storage with no database record. The new rules close
   that path to everyone, but the objects still exist and need a deliberate,
   logged deletion — an owner decision, since it destroys customer data.
4. Production `/api` ingress (§3) remains open.

### PB-4 / PB-5 dependencies

- **PB-4** may show document status on the Booking Summary; no document data is
  needed in the invoice itself.
- **PB-5** can query `bookings/{id}/documents` directly for booking, traveller,
  type, upload date and review status without touching Storage, then mint a
  short-lived signed URL to view a file. The review fields already exist and are
  server-owned, so PB-5 adds controls rather than schema.

---

## 15. Files changed

**New — `functions/`**
`packageBookingPricing.js` · `packageBookingReference.js` · `packageBookingValidation.js` · `packageBookings.js` · `test/helpers/fakeFirestore.js` · `test/packageBookingPricing.test.js` · `test/packageBookingReference.test.js` · `test/packageBookingApi.test.js`

**New — frontend**
`src/services/packageBookingApi.js` *(not imported yet)*

**Modified (all additive)**
| File | Change |
|---|---|
| `functions/index.js` | +20/−0 — require and register the routes |
| `functions/package.json` | +2/−1 — `test` script |
| `firestore.rules` | +3 rule blocks for the server-owned collections |
| `eslint.config.js` | +11/−0 — Node/CommonJS globals for `functions/**`, which the config never declared. Without it `require` and `module` report as undefined and the directory cannot be linted meaningfully. Also reduced pre-existing `functions/` errors from 66 to 19 |
| `.env.example` | +14/−0 — `VITE_BOOKING_API_BASE_URL` |

**Not touched:** `server/`, Razorpay, hotel/transport payments, MongoDB auth, Trip Planner, SEO, UI, destination or vendor architecture, `src/pages/BookingPage.jsx`.
