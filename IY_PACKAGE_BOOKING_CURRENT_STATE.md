# Infinite Yatra — Package Booking System: Current State Audit

**Audit type:** Discovery and design only. No application code, database, security rules, or configuration was modified.
**Date:** 2026-09-15
**Scope:** Package booking only. Hotels, transport, cruise, cycles, jets, stories and passport modules were inspected only where they touch package booking.

---

## PART 1 — REPOSITORY STATE

| Item | Value |
|---|---|
| Branch | `main` |
| HEAD | `3d0dd187265ecf754a556263cac8efe9bce286a3` |
| HEAD message | "Add one-shot VPS deploy script (deploy/setup.sh)" (Codex, ~7 weeks ago) |
| Working tree | **Dirty** — 53 modified, 81 deleted, 90 untracked |

The working tree was dirty before this audit and was left untouched. Most of the churn is in `dist/` (build output that is committed to the repository — itself a problem, noted as P2-06) and in root-level `.md` documentation.

Untracked files of note (not created by this audit): `INFINITE_YATRA_FULL_AUDIT.md`, `IY_TARGET_ARCHITECTURE.md`, `SECURITY_REMEDIATION_STATUS.md`, `tests/firestore.rules.test.mjs`, `server/src/services/`, `server/src/routes/ai.js`.

One deleted file is staged: `D aws/RSA.pem` — a private key was committed to this repository at some point. Deleting it from the working tree does **not** remove it from git history. See P0-07.

---

## PART 2 — CURRENT TECHNOLOGY

### In plain language

Infinite Yatra is a **single-page website** built with React. There is no traditional back end for package bookings. When a customer books a trip, their browser talks **directly to Google's Firebase database**. There is no Infinite Yatra server in the middle checking anything.

That one fact explains most of the problems in this report.

### Technically

| Layer | Technology | Version | Notes |
|---|---|---|---|
| Frontend framework | React | ^18.3.1 | SPA, function components + hooks |
| Language | JavaScript (JSX) | ES modules | No TypeScript |
| Build tool | Vite | ^7.2.4 | |
| CSS | Tailwind CSS | ^4.1.17 | via `@tailwindcss/vite` |
| Routing | react-router-dom | ^7.9.6 | Client-side, lazy-loaded routes |
| Animation | framer-motion | ^11.18.2 | |
| Authentication | Firebase Auth | firebase ^12.6.0 | Email/password + Google |
| Database | **Cloud Firestore** | firebase ^12.6.0 | Accessed **directly from the browser** |
| Document storage | **Firebase Storage** | firebase ^12.6.0 | Customer ID documents |
| Marketing image storage | Cloudinary | — | Package/hotel photos (separate from IDs) |
| Hosting | Firebase Hosting | — | `netlify.toml` and `deploy/setup.sh` (VPS) also present — three deploy targets |
| API (partial) | Firebase Cloud Functions | Express app `api` | Payments/webhooks — **not used by package booking** |
| API (partial) | Node/Express + MongoDB | `server/` | Leads, enquiries, newsletter, auth, AI — **no package booking routes** |
| Invoice/PDF | jsPDF ^4.0.0 + jspdf-autotable ^5.0.7 | | **Client-side only**, never stored |
| Email | EmailJS ^4.4.1 | `@emailjs/browser` | **Client-side**; not wired to package booking |
| WhatsApp | `wa.me` deep links | — | **Manual**; opens a browser tab, no automation |
| Analytics | Firebase Analytics | `G-WJVGGTN2FB` | Page-level only |
| Admin | React SPA route `/admin` | | Same bundle as the public site |

### Which technology handles package booking

**Verified from source, not documentation:** package booking is handled **entirely by the browser** using the Firebase Web SDK.

- `src/pages/BookingPage.jsx:622-645` calls `setDoc()` directly against Firestore.
- `src/pages/BookingPage.jsx:593-595` calls `uploadBytes()` directly against Firebase Storage.
- The Cloud Functions Express API (`functions/index.js`) contains payment endpoints, but `payWithRazorpay` is **imported at `BookingPage.jsx:13` and never called**. Package booking never reaches the server.
- The Node/Express + MongoDB server in `server/` has routes for `auth`, `leads`, `enquiries`, `newsletter`, `ai` only. There is **no package booking route**. The `VITE_USE_API` flag (`src/lib/api.js:9`) does not gate booking.

**Conclusion: there is no server-side code in the package booking path at all.**

---

## PART 3 — PACKAGE ADMIN SYSTEM

| Item | Value |
|---|---|
| Admin route | `/admin` → `src/pages/AdminDashboard.jsx`, tab `packages` |
| Admin component | `src/components/admin/dashboard/Inventory.jsx` |
| Package form | `src/components/AdminPackageForm.jsx` (1,218 lines) |
| Collection | Firestore `packages` |
| Read context | `src/context/PackageContext.jsx` |
| Static fallback | `src/data/packages.js` (858 lines, 15 packages) |
| Image storage | Cloudinary (unsigned upload from the browser) |
| Publishing | `isVisible` boolean — filtered **client-side** in `PackageContext.jsx:64` |

### Current package field matrix

Source of truth: `AdminPackageForm.jsx:13-69` (form state) and `:325-357` (save transform).

| Field | Exists | Admin editable | DB field | On package page | Used in booking | Problem / gap |
|---|---|---|---|---|---|---|
| Package ID | Yes | No (auto) | Firestore doc ID | Yes | Yes | Slug-like IDs mixed with auto-IDs |
| Slug | **No** | — | — | — | — | URL uses raw doc ID |
| Title | Yes | Yes | `title` | Yes | Yes | — |
| Destination / Location | Yes | Yes | `location` | Yes | Yes | Free text, not normalised |
| Duration | Yes | Yes | `duration` | Yes | No | Free text ("5 Days / 4 Nights") |
| Price (sell) | Yes | Yes | `price` (Number) | Yes | Yes | — |
| Price display | Yes | Auto | `priceDisplay` | Yes | No | Derived; duplicated state |
| **Cost price** | **Yes** | **Yes** | **`costPrice`** | **No** | **No** | **P0-01 — publicly readable** |
| **Token price** | **Yes** | **Yes** | **`tokenPrice`** | **No** | **No** | **P0-01 — publicly readable; unused by booking** |
| Discount | Yes | Yes | `discount` | Yes | **No** | **Never applied in booking maths** |
| Pickup / Drop | Yes | Yes | `pickupDrop` | Yes | No | Display string only |
| Pickup locations (priced) | Yes | Yes | `pickupLocations[]` `{location, price, b2bPrice}` | Yes | Yes | **`b2bPrice` publicly readable — P0-01** |
| Departure type | Yes | Yes | `departureType` (`daily`/`weekly`/`minimum-clients`) | Yes | Yes | — |
| Weekly day | Yes | Yes | `weeklyDay` (0-6) | Yes | Yes | — |
| Batch / departure dates | Yes | Yes | `batchDates[]` `{date, availableSeats}` | Yes | Yes (filter only) | **Seats captured but never decremented** |
| Available seats | Yes (per batch) | Yes | `batchDates[].availableSeats` | Partial | **No** | **No inventory enforcement — P0-04** |
| Season window | Yes | Yes | `seasonStartDate`, `seasonEndDate` | Yes | Yes | — |
| Minimum travellers | Yes | Yes | `minimumPersons` | Yes | Yes (soft) | Advisory only, not enforced |
| Minimum clients | Yes | Yes | `minimumClients` | Yes | No | Only for `minimum-clients` type |
| Maximum travellers | Yes | Yes | `maxGroupSize` | Yes | **No** | **Not enforced at booking** |
| Hotels | Yes (link) | Yes | `linkedHotelIds[]` | Yes | Indirect | Bundle suggestion is separate logic |
| Transport | Yes (link) | Yes | `linkedVehicleIds[]` | Yes | No | — |
| Meals | Partial | Yes | `itinerary[].meals` | Yes | No | Per-day text only |
| Guide | **No** | — | — | — | — | Not modelled |
| Activities | Yes | Yes | `itinerary[].activities[]` | Yes | No | — |
| Highlights | Yes | Yes | `highlights[]` | Yes | No | — |
| Itinerary | Yes | Yes | `itinerary[]` (day, title, description, activities, distance, time, trekDistance, trekTime, altitude, stay, meals) | Yes | No | Rich; good |
| Inclusions | Yes | Yes | `inclusions[]` | Yes | No | — |
| Exclusions | Yes | Yes | `exclusions[]` | Yes | No | — |
| Cancellation policy | Yes | Yes | `cancellationPolicy[]` | Yes | **No** | **Not shown or accepted at booking — P1-05** |
| General terms | Yes | Yes | `generalPolicy` | Yes | **No** | **No T&C acceptance — P1-05** |
| Things to carry | Yes | Yes | `thingsToCarry[]` | Yes | No | — |
| Good to know | Yes | Yes | `goodToKnow[]` | Yes | No | — |
| Who is this for | Yes | Yes | `whoIsThisFor[]` | Yes | No | — |
| Difficulty | Yes | Yes | `difficulty` | Yes | No | — |
| Best season | Yes | Yes | `bestTime` | Yes | No | — |
| Gallery | Yes | Yes | `images[]` (Cloudinary URLs) | Yes | No | — |
| Featured image | Yes | Yes | `image` | Yes | Yes | — |
| FAQ | Yes | Yes | `faqs[]` `{question, answer}` | Yes | No | — |
| Category | Yes | Yes | `category[]` | Yes | No | — |
| Package route | Yes | Yes | `packageRoute` | Yes | No | — |
| Status | **Partial** | Yes | `isVisible` (bool) | Filter | No | **No draft/review/archived states** |
| Visibility | Yes | Yes | `isVisible` | Filter | No | **Client-side filter only — P1-02** |
| Featured on homepage | Yes | Yes | `featuredOnHomepage`, `displayOrder` | Yes | No | — |
| SEO | **No** | — | — | — | — | No meta title/description/OG fields |
| **Package version** | **No** | — | — | — | — | **P0-03 — no price/terms snapshot** |

---

## PART 4 — PACKAGE CREATION DATA FLOW

```
Admin browser
  └─ AdminPackageForm.jsx  (form state, 60+ fields)
       └─ handleSubmit()  AdminPackageForm.jsx:322
            ├─ number coercion (price, tokenPrice, costPrice, maxGroupSize)
            ├─ empty-string array filtering
            └─ onSave(cleanedData)
                 └─ Inventory.jsx
                      └─ setDoc / addDoc  →  Firestore  packages/{packageId}
                                                    ↑
                                        NO server. NO validation.
                                        Browser writes straight to the database.

Firestore packages/{id}
  ├─ PackageContext.jsx:17   getDocs(collection(db,'packages'))   ← ENTIRE collection, ALL fields
  │    └─ merged with src/data/packages.js static fallback
  │         └─ PackageDetail.jsx  (package page)
  └─ BookingPage.jsx:425      getDoc(doc(db,'packages',id))        ← direct read
```

### Answers

**Does admin write package data directly from browser to Firestore?**
**Yes.** `setDoc`/`addDoc` from the admin browser. There is no server API in the package write path.

**Is package pricing editable?** Yes — `price`, `costPrice`, `tokenPrice`, and per-location `price`/`b2bPrice`.

**Are departure dates editable?** Yes — `batchDates[]`, `departureType`, `weeklyDay`, `seasonStartDate`/`seasonEndDate`.

**Are seats editable?** Yes — `batchDates[].availableSeats` is captured. **It is never read or decremented during booking.** Seat counts are decorative.

**Are private commercial fields stored in the same document customers read?**

**Yes — this is the single worst finding in the audit.**

`firestore.rules:192-195`:
```
match /packages/{packageId} {
  allow read: if true;
  allow create, update, delete: if isAdmin();
}
```

`allow read: if true` means **any person on the internet, logged in or not**, can read every field of every package document — including `costPrice`, `tokenPrice`, and every `pickupLocations[].b2bPrice`.

This is not theoretical. `PackageContext.jsx:17` fetches the **entire** `packages` collection with no field projection on **every page load of the public website**. The margin on every trip Infinite Yatra sells is already sitting in the browser memory of every visitor, and is visible in the Network tab with no tooling.

A competitor can read Infinite Yatra's exact cost base and margin for every package in under a minute.

**Related:** `isVisible` is filtered **client-side** (`PackageContext.jsx:64`). Unpublished and draft packages are downloaded to every visitor's browser; they are merely not rendered.

---

## PART 5 — PACKAGE PAGE

Route `/package/:id` → `src/pages/PackageDetail.jsx` (1,000 lines).

Data source: `usePackages()` → `getPackageById(id)` (`PackageDetail.jsx:88-92`) — reads from the **already-fetched in-memory** package list, **merged with the static file**.

| Section | Source | Notes |
|---|---|---|
| Title, location, duration, difficulty, best time | Firestore (merged w/ static) | |
| Price | Firestore `price` / `pickupLocations[].price` | |
| Discount | Firestore `discount` | Displayed, **never applied in booking maths** |
| Dates | Firestore `batchDates`, `departureType`, season | |
| Seat availability | Firestore `batchDates[].availableSeats` | Displayed but meaningless — never decremented |
| Hotels | Firestore `hotels` via `linkedHotelIds` | Separate query, `PackageDetail.jsx:139` |
| Transport | Firestore `transportation` via `linkedVehicleIds` | `PackageDetail.jsx:164` |
| Meals / Activities / Itinerary | Firestore `itinerary[]` | |
| Inclusions / Exclusions | Firestore arrays | |
| Policies (cancellation, general) | Firestore | Display only |
| FAQ | Firestore `faqs[]` | |
| Gallery | Cloudinary URLs in `images[]` | |
| Reviews | Firestore `reviews` | `PackageDetail.jsx:184` |
| CTA "Book Now" | `handleBookNow()` `:214` | |
| Enquiry | `navigate('/contact')` `:227` | Generic contact page, no package context |
| WhatsApp | `wa.me` deep link `:230` | Manual |

**What is hardcoded:** the WhatsApp number `919265799325` appears in at least three files. Default cancellation policy text and the ₹2,000 token figure are hardcoded as form defaults in `AdminPackageForm.jsx:35-41`.

**What is static fallback:** `src/data/packages.js` — 15 packages, 858 lines. `PackageContext.jsx:24-37` **merges** static over Firestore (`{...staticPkg, ...fp}`) and then **appends** any static package missing from Firestore.

**What can become inconsistent:**
1. A package deleted from Firestore **reappears** from the static file (`PackageContext.jsx:33-37`).
2. A field removed in admin but still present in the static file **persists** via the merge.
3. `PackageContext.jsx:40` contains a hardcoded business rule: `filter(p => p.id !== 'kedarnath')` — a package is suppressed in code, not data.
4. `BookingPage.jsx:425-431` reads the package with a **direct `getDoc`**, falling back to `getPackageById` from the static file — a **different resolution path** from the package page. The page the customer reads and the price the booking charges can diverge.

---

## PART 6 — "BOOK NOW" ENTRY POINT

`PackageDetail.jsx:214-224`:
```js
const handleBookNow = () => {
    navigate(`/booking/${id}`, {
        state: { selectedLocation, locationPrice, selectedDate }
    });
};
```

| Item | Value |
|---|---|
| Route | `/booking/:id` |
| Authentication | **Login required** — `App.jsx:164-168` wraps `BookingPage` in `<ProtectedRoute>` |
| Package ID | URL param |
| Price | Passed in navigation state (`locationPrice`) — **and independently re-read from Firestore** in `BookingPage.jsx:425` |
| Date | Navigation state `selectedDate` |
| Traveller count | **Not passed** — resets to 2 (`BookingPage.jsx:397`) |
| Database reads | `getDoc(packages/{id})`, then **the entire `hotels` collection** (`BookingPage.jsx:443`) |

**Can booking start without login?** **No.** `/booking/:id` is behind `ProtectedRoute`. Guest booking is not supported.

However there is a **usability defect**: the "Book Now" button on the package page does not check auth before navigating. An anonymous visitor fills in interest, clicks Book Now, and is bounced to login — losing the selected date and pickup location held in navigation state.

A second defect: `BookingPage.jsx:606` — `handleConfirm` opens with `if (!currentUser) return;`. If the session expires mid-form, pressing "Confirm Booking Request" does **nothing at all** — no error, no message, no spinner change. The customer sees a dead button.

A third: `BookingPage.jsx:443` fetches **every hotel document** to suggest at most two. This will degrade as the hotel inventory grows.

---

## PART 7 — COMPLETE BOOKING FORM

Three steps (`BookingPage.jsx:18-22`): **Trip Details → Travellers → Review & Confirm**.

### Step 1 — Trip details and lead contact

| Field | Required | Validation | Stored | DB field | Concern |
|---|---|---|---|---|---|
| Pickup location | If package has them | Index select | Yes | `pickupLocation` (string) | Price driven by selection |
| Travel date | **Yes** | Present + `filterDate` rules | Yes | `bookingDate` (string `YYYY-MM-DD`) | Not a timestamp |
| Number of travellers | **Yes** | `>= 1` | Yes | `travelers` (Number) | **`maxGroupSize` not enforced** |
| Full name | **Yes** | Non-empty; letters/spaces only | Yes | `contactName` | Strips non-Latin names |
| Email | **Yes** | `/\S+@\S+\.\S+/` | Yes | `contactEmail` | **Not verified against auth identity** |
| Phone | **Yes** | Length ≥ 6 | Yes | `contactPhone` | E.164 via `react-phone-input-2` |
| Special requests | No | None | Yes | `specialRequests` | **No length cap** |
| Bundled hotel | No | — | Yes | `bundledHotelId`, `bundledHotelName` | 15% discount hardcoded `:581` |

**Not collected:** address, city, state, country, PIN code, lead-booker nationality, adults/children split, room count.

### Step 2 — Per-traveller details

Per traveller (`createEmptyTraveler()` `:54-73`):

| Field | Required | Validation | Stored | DB field | Concern |
|---|---|---|---|---|---|
| First name | **Yes** | Non-empty, letters only | Yes | `travelersList[].firstName` | Strips non-Latin characters |
| Middle name | No | Letters only | Yes | `travelersList[].middleName` | |
| Last name | **Yes** | Non-empty, letters only | Yes | `travelersList[].lastName` | |
| Date of birth | Marked `*` | **None enforced** | Yes | `travelersList[].dob` | **Label says required; `validateStep` never checks it** |
| Gender | Marked `*` | **None enforced** | Yes | `travelersList[].gender` | Same defect |
| Nationality | Marked `*` | Default "India" | Yes | `travelersList[].nationality` | Drives document type list |
| Contact numbers (max 5) | No | None | Yes | `travelersList[].contactNumbers[]` | Empty entries filtered on save |
| ID document type | **Optional** | — | Yes | `travelersList[].selectedDocType` | |
| ID document files | **Optional** | **None** | **See Part 8** | — | **No type/size validation** |
| Emergency contacts (max 5) | **Optional** | None | Yes | `travelersList[].emergencyContacts[]` | first/middle/last/relation/phone/email |

**Not collected:** age (derivable from DOB), ID number, medical information, food preference, passport number, passport expiry, visa status, insurance.

`validateStep(2)` (`:550-558`) checks **only** first name and last name. Every field marked with a red asterisk other than those two is **not actually enforced**. See P1-03.

### Step 3 — Review and confirm

Read-only summary. **No terms-and-conditions checkbox. No cancellation-policy acknowledgement. No consent capture for storing government ID documents.** See P1-05.

---

## PART 8 — CUSTOMER DOCUMENT UPLOAD

This is the highest-risk area in the system.

### Where documents go

`BookingPage.jsx:585-603`:
```js
const storageRef = ref(storage, `bookings/${bookingId}/traveler_${tIdx}/${fileKey}_${file.name}`);
await uploadBytes(storageRef, file);
const url = await getDownloadURL(storageRef);
```

| Item | Value |
|---|---|
| Storage backend | **Firebase Storage**, bucket `infiniteyatra-iy.firebasestorage.app` |
| Path | `bookings/{bookingId}/traveler_{index}/{docKey}_{originalFileName}` |
| Filename | **Customer's original filename, unsanitised** |
| URL type | `getDownloadURL()` — long-lived token URL, **does not expire** |
| Accepted types | `image/*,.pdf` (`:305`) — **client-side hint only, not enforced** |
| Size limit | **None** |
| Document kinds | Aadhaar, PAN, Passport, Driving Licence, Voter ID, SSN, National ID |

### Critical finding 1 — Storage rules are not in the repository

There is **no `storage.rules` file** anywhere in the repository, and **`firebase.json` has no `storage` section**.

Consequences:
- The access rules protecting customers' Aadhaar, PAN and passport scans are **not version-controlled**, **not reviewable in code**, and **not deployable from source**.
- Nobody on the team can answer "who can read these files?" by reading the repository.
- Whatever rules exist live only in the Firebase Console and could be the default `allow read, write: if request.auth != null` — which would mean **any logged-in user can read every other customer's passport** by URL.

**This audit cannot determine who can currently access customer identity documents.** That fact is itself the finding. Resolving it requires reading the live Storage rules in the Firebase Console — a console action, not a code change.

### Critical finding 2 — The document database record is never written

`BookingPage.jsx:648-658`:
```js
try {
    const uploadedDocs = await uploadDocFiles(newBookingRef.id);
    if (uploadedDocs.length > 0) {
        await addDoc(collection(db, 'bookings', newBookingRef.id, 'documents'), { ... });
    }
} catch (docErr) {
    console.warn('Document upload skipped:', docErr);
}
```

The write targets the subcollection `bookings/{bookingId}/documents`.

`firestore.rules` contains **no rule for that path**. There is no nested `match /documents/{docId}` inside the `bookings` block, and no recursive `{document=**}` wildcard anywhere in the file (verified: the only `documents` match is the standard `/databases/{database}/documents` root).

**Firestore denies by default when no rule matches.** Therefore this write **always fails** — and the failure is swallowed by the `catch` on line 656, which only logs a console warning the customer never sees.

The observable result:

1. The customer's Aadhaar/passport images **do** upload to Firebase Storage.
2. The database record pointing at those files is **never created**.
3. The customer sees a success screen and believes their documents were submitted.
4. `Bookings.jsx:31` — the admin document viewer reads that same empty subcollection. **Admin sees nothing, every time.**
5. The identity documents sit in Storage as **orphans**: no index, no owner reference, no retention handle, no way to find them except by guessing booking IDs.

So the system currently collects passports and Aadhaar cards, stores them under unknown access rules, tells the customer it worked, shows the admin nothing, and keeps no record that the files exist.

### Access questions

| Question | Answer |
|---|---|
| Can admin view/download documents? | **No** — the metadata record is never written; the viewer is always empty |
| Can a customer view their own documents? | **No** — no UI exists |
| Could another customer access documents? | **Unknown — depends on Storage rules that are not in the repository.** If rules are the common `if request.auth != null` default, then **yes** |
| Are URLs permanent or expiring? | **Permanent.** `getDownloadURL()` tokens do not expire and are not revoked when a booking is cancelled |
| Are government IDs mixed with marketing media? | **No** — this part is correct. IDs go to Firebase Storage `bookings/`; marketing images go to Cloudinary. Good separation, worth keeping |

No real customer document was opened or accessed during this audit.

---

## PART 9 — BOOKING SUBMISSION

```
Step 3 "Confirm Booking Request"
  └─ handleConfirm()                    BookingPage.jsx:605
       ├─ if (!currentUser) return;          ← silent no-op on expired session
       ├─ strip File objects from travellers  :611-620
       ├─ doc(collection(db,'bookings'))      ← client generates the ID
       ├─ setDoc(...)                         :624-645   ← THE booking write
       ├─ uploadDocFiles()                    :649       ← Storage upload
       │    └─ addDoc(bookings/{id}/documents) :651      ← ALWAYS FAILS (no rule)
       ├─ addDoc(hotel_bookings)              :663       ← if bundle selected
       ├─ addCredits(... 100)                 :680       ← IY Passport credits
       └─ navigate('/booking-success', {state}) :684
            └─ BookingSuccess.jsx — renders from navigation state, generates PDF
```

### Fields actually written to `bookings/{id}`

| Field | Value | Source |
|---|---|---|
| `userId` | `currentUser.uid` | Auth |
| `packageId` | `pkg.id` | URL |
| `packageTitle` | `pkg.title` | Package doc (**denormalised, no version**) |
| `bookingDate` | `'YYYY-MM-DD'` string | Form |
| `travelers` | Number | Form |
| `contactName` / `contactEmail` / `contactPhone` | Strings | Form |
| `specialRequests` | String | Form |
| `travelersList` | **Array of traveller objects, embedded** | Form |
| `totalPrice` | **Computed in the browser** | `finalTotal` `:583` |
| `tourAmount` | **Computed in the browser** | `tourTotal` `:577` |
| `hotelAmount` | **Computed in the browser** | `:637` |
| `pickupLocation` | String or null | Form |
| `status` | `'pending'` | Hardcoded |
| `bookingStatus` | `'pending'` | Hardcoded — **duplicate of `status`** |
| `paymentStatus` | `'pending'` | Hardcoded |
| `createdAt` | `serverTimestamp()` | Server clock — good |
| `bundledHotelId` / `bundledHotelName` | or null | Bundle |

### Answers

- **Collection:** `bookings` (shared with hotel-bundle cross-references; hotel bookings have their own `hotel_bookings` collection).
- **Owner:** `userId` = Firebase Auth uid. Enforced on create by `ownsNewDocument()`.
- **Booking ID:** `doc(collection(db,'bookings'))` — a **client-generated Firestore auto-ID** (20-char alphanumeric, e.g. `xK9mPqR2nL4vB8cD1eF3`). Not customer-friendly, not sequential, not branded.
- **Initial status:** `pending` / `pending` / `pending`.

### What the booking does **not** contain

`packageVersion`, `packagePriceAtBooking`, unit price, `discount`, tax/GST, `currency`, `amountPaid`, `balanceDue`, `paymentPlan`, `tokenAmount`, `documents[]`, `updatedAt`, `source`/`channel`, `termsAcceptedAt`, `adults`/`children` split, `rooms`, cancellation snapshot, assigned staff, internal notes.

### The price is decided by the customer's browser

`totalPrice`, `tourAmount` and `hotelAmount` are all computed client-side (`BookingPage.jsx:576-583`) and written straight into the database.

`firestore.rules` permits `totalPrice` in the create allowlist **with no value validation**. It checks that the three status fields equal `'pending'` and that no extra keys are present — but never that `totalPrice` bears any relationship to the package price.

Anyone who can open browser devtools can submit a ₹60,000 trek as `totalPrice: 1`. The booking is accepted, appears in the admin list as a legitimate ₹1 booking, and flows into the revenue figures on the admin Overview dashboard.

This is P0-02 and it is exploitable today by a non-expert following a public tutorial.

---

## PART 10 — DATABASE MAP

Collections actually touched by package booking:

| Collection | Purpose | Key fields | Relationship |
|---|---|---|---|
| `packages` | Package catalogue | `title`, `price`, **`costPrice`**, **`tokenPrice`**, `pickupLocations[]` (**`b2bPrice`**), `itinerary[]`, `batchDates[]`, `isVisible` | Referenced by `bookings.packageId` |
| `bookings` | Package bookings | `userId`, `packageId`, `travelersList[]`, `totalPrice`, `status`/`bookingStatus`/`paymentStatus` | Owned by `users`; references `packages` |
| `bookings/{id}/documents` | **Intended** doc metadata | `docs[]` `{travelerIndex, docKey, url, fileName}` | **Never written — no security rule exists** |
| `users` | Customer profiles | `email`, `name`, `phone`, `role` | `bookings.userId` → `users/{uid}` |
| `hotel_bookings` | Hotel bookings | `bundledWithTour` → booking ID | Cross-reference for bundles |
| `reviews` | Package reviews | `userId`, `packageId` | Post-trip |
| `leads` / `enquiries` | Pre-booking enquiries | `name`, `phone`, `message` | **Not linked to `packages` or `bookings`** |
| `passport_*` | IY Passport credits | credits ledger | `addCredits(...)` on booking |

Collections that **do not exist**: `payments` (for packages), `invoices`, `travellers`, `departures`, `booking_documents`, `booking_activity`, `notifications`.

### Actual architecture today

```
users/{uid}
   │  userId
   ▼
bookings/{autoId}                      ← ONE flat document
   ├── travelersList[]        (embedded array — no separate collection)
   │      └── emergencyContacts[]  (embedded array inside embedded array)
   ├── packageId ──────────► packages/{id}   (no version, no price snapshot)
   ├── bundledHotelId ─────► hotel_bookings/{id}
   └── documents/           ← subcollection that is NEVER WRITTEN (rule missing)

Firebase Storage  bookings/{bookingId}/traveler_{n}/{file}
   └── ORPHANED — no database record points here

payments   ── does not exist for packages
invoices   ── does not exist (PDF generated in browser, never stored)
```

---

## PART 11 — WHERE EXACTLY IS CUSTOMER DATA GOING?

In plain language, for the owner.

Everything below lives in **Google Cloud Firestore**, project **`infiniteyatra-iy`**, unless stated otherwise.

| # | Data | Where it lands |
|---|---|---|
| 1 | **Customer name** | `bookings` → `{bookingId}` → field `contactName` |
| 2 | **Customer phone** | `bookings` → `{bookingId}` → field `contactPhone` |
| 3 | **Customer email** | `bookings` → `{bookingId}` → field `contactEmail` |
| 4 | **Traveller details** | `bookings` → `{bookingId}` → field `travelersList` — an **array inside the same booking record**, not a separate table. Each entry holds first/middle/last name, date of birth, gender, nationality, phone numbers, and which ID type they chose |
| 5 | **Emergency contacts** | `bookings` → `{bookingId}` → `travelersList[n].emergencyContacts` — **nested two levels deep inside the booking record**. Cannot be searched or reported on |
| 6 | **Uploaded documents** | **Firebase Storage** (a different system), path `bookings/{bookingId}/traveler_{n}/`. **The database keeps no record that these files exist.** Nobody can find them from the admin panel |
| 7 | **Package information** | Only `packageId` and `packageTitle` are copied into the booking. Everything else (price list, itinerary, cancellation terms) is read live from `packages` → `{packageId}` — **so if you edit the package later, the booking silently changes meaning** |
| 8 | **Booking price** | `bookings` → `{bookingId}` → `totalPrice`, `tourAmount`, `hotelAmount`. **Calculated by the customer's own web browser**, then saved |
| 9 | **Booking status** | `bookings` → `{bookingId}` → `status` **and** `bookingStatus` — two fields holding the same value |
| 10 | **Payment status** | `bookings` → `{bookingId}` → `paymentStatus`. Always `"pending"`. **Nothing in the system can ever change it** |
| 11 | **Invoice data** | **Nowhere.** The PDF is built inside the customer's browser and downloaded. No copy is stored, emailed, or recorded |

---

## PART 12 — BOOKING INVOICE / BOOKING SUMMARY

Two separate PDF generators exist.

### A. Customer-facing — `src/pages/BookingSuccess.jsx:17-110`

| Item | Value |
|---|---|
| Library | jsPDF + jspdf-autotable, **in the browser** |
| Trigger | **Auto-downloads on page mount** (`:113-118`) — unrequested |
| Header | **"Invoice & Booking Receipt"** |
| Booking number | The raw Firestore auto-ID |
| Invoice number | **None** |
| Data source | **`location.state`** — navigation state, **not the database** |
| Contents | Booking ref, issue date, package title, travel date, Total / Amount Paid / Balance Due |
| Traveller details | **Not included** |
| Company details / GST | **Not included** |
| Taxes | **Not modelled at all** |
| Stored? | **No** |
| Emailed? | **No** |

**Defect:** because it renders from `location.state`, a page refresh loses the booking entirely (`:120` → "No booking found"). The state is also client-controlled, so the "invoice" reflects whatever the browser says, not the database.

**Naming defect:** the document is titled **"Invoice & Booking Receipt"** for a booking where **no money has been received**. It should be a *Booking Summary* or *Provisional Booking Confirmation*.

### B. Admin-facing — `src/services/InvoiceGenerator.js`, invoked at `Bookings.jsx:141`

| Item | Value |
|---|---|
| Header text | **"IY INVOICE – BOOKING AMOUNT RECEIVED"** (`InvoiceGenerator.js:48`) |
| Invoice number | `invoiceId` generated at render time — **not persisted, not sequential, not unique** |
| Line item | **"Token Paid"** (`:261`) |
| Balance Due | `totalPrice - bookingAmount` (`:139`) |
| Terms | Hardcoded, incl. "Remaining balance must be cleared at least 7 days before departure" |

**This generator fabricates a financial record.** `Bookings.jsx:124-129`:

```js
const payment = {
    amount: selectedBooking.amountPaid || 1000,      // ← amountPaid is NEVER written
    method: 'Online',                                 // ← hardcoded
    id: selectedBooking.razorpayOrderId || 'N/A',
    status: selectedBooking.paymentStatus || 'success' // ← defaults to "success"
};
```

`amountPaid` is not in the booking write (`BookingPage.jsx:624-645`) and is **not even permitted** by the Firestore create allowlist. It is therefore always `undefined`, so `|| 1000` always fires.

**Every admin-generated invoice for a package booking is a PDF headed "BOOKING AMOUNT RECEIVED" declaring a ₹1,000 token payment that never happened, with the payment method stated as "Online".**

If such a document has ever been sent to a customer or used in bookkeeping, it is a false financial record. This is P0-05 and it should be disabled before anything else in this report is actioned.

Further, `customer.phone` reads `selectedBooking.phone` while the booking stores `contactPhone` — so the customer phone is blank on every admin invoice. The same applies to `age`, `gender`, `address`, and `emergencyContact`, none of which exist at the booking's top level.

### Required distinction going forward

| Document | When | Says |
|---|---|---|
| **Booking Summary / Provisional Booking** | Immediately on submission | "Request received. No payment taken. Amount payable: ₹X" |
| **Payment Receipt** | Each time a payment is recorded | "Received ₹Y on DD/MM/YYYY via UPI, ref ABC123. Balance ₹Z" |
| **Final / Tax Invoice** | Once fully paid (or per finance policy) | Full tax invoice with GST, company details, sequential number |

Nothing should print "PAID" or "RECEIVED" until a payment record exists in the database.

---

## PART 13 — CURRENT PAYMENT MODEL

**Package booking takes no payment whatsoever. This is by design and the UI is honest about it** — `BookingSuccess.jsx:154` reads *"No payment has been taken yet."*

| Artefact | State for packages |
|---|---|
| `payWithRazorpay` | **Imported at `BookingPage.jsx:13`, never called** — dead import |
| `src/services/paymentGateway.js` | Used by **hotels** (`HotelBookingPage.jsx:161`) and **transport** (`TransportDetails.jsx:143`) only |
| `src/services/PaymentService.js` | Razorpay checkout wrapper — **not used by packages** |
| `src/services/refundService.js` | Reads `booking.paidAmount \|\| booking.amountPaid` — **both always undefined for packages** |
| `functions/index.js` create-order / verify-payment / webhook | Exists; **never reached by package booking** |
| `booking.paymentStatus` | Written once as `'pending'`. **No code path ever changes it** |
| `booking.amountPaid` | **Read in 4 admin files. Written by nothing. Not permitted by Firestore rules** |
| `booking.razorpayOrderId` | Read at `Bookings.jsx:127,415`. **Never written for packages** |
| Manual payment recording | **Does not exist** — no UI, no service, no field |

So there are three layers of confusion: package booking genuinely takes no payment (correct and intended); several admin screens are written as though it does; and the invoice generator manufactures a ₹1,000 payment to fill the gap.

`Financials.jsx:41` computes collected revenue as `parseFloat(b.amountPaid) || 0` — which is **always 0** for every package booking. The admin financial dashboard reports zero collected against every booking, forever.

---

## PART 14 — REQUIRED MANUAL PAYMENT MODEL *(design only — not implemented)*

### Recommended status vocabulary

Reviewing the proposed names, three adjustments are worth making:

| Proposed | Recommended | Reason |
|---|---|---|
| `UNPAID` | **`UNPAID`** | Keep |
| `TOKEN_RECEIVED` | **drop** | Redundant — a token is simply the first partial payment. Derive it: `amountReceived > 0 && amountReceived < total`. One less state to keep consistent |
| `PARTIALLY_PAID` | **`PARTIALLY_PAID`** | Keep — covers token and any later part payment |
| `FULLY_PAID` | **`FULLY_PAID`** | Keep |
| `REFUND_PENDING` | **`REFUND_PENDING`** | Keep |
| `PARTIALLY_REFUNDED` | **`PARTIALLY_REFUNDED`** | Keep |
| `REFUNDED` | **`REFUNDED`** | Keep |
| — | **add `OVERPAID`** | Real bookkeeping needs it; a customer transfers ₹50,000 against a ₹45,000 balance and finance must see it |

Final recommended set: `UNPAID`, `PARTIALLY_PAID`, `FULLY_PAID`, `OVERPAID`, `REFUND_PENDING`, `PARTIALLY_REFUNDED`, `REFUNDED`.

**Critical principle: `paymentStatus` must be *derived* from the payment ledger, never typed in by hand.** Two people editing a status field is how books stop balancing.

### Proposed payment record

Collection `booking_payments` (or subcollection `bookings/{id}/payments`).

| Field | Type | Notes |
|---|---|---|
| `paymentId` | string | Document ID |
| `bookingId` | string | **Indexed** |
| `customerId` | string | Denormalised for reporting |
| `amount` | number | **Positive for receipts, negative for refunds** — one ledger, signed |
| `currency` | string | `'INR'` — present from day one (Part 22) |
| `paymentType` | enum | `TOKEN`, `PART_PAYMENT`, `FINAL_PAYMENT`, `REFUND`, `ADJUSTMENT` |
| `paymentMethod` | enum | `BANK_TRANSFER`, `UPI`, `CASH`, `CHEQUE`, `CARD`, `ONLINE_GATEWAY`, `OTHER` |
| `transactionReference` | string | UTR / UPI ref / cheque no. **Should be unique per method** |
| `paymentDate` | timestamp | **When the money moved** — distinct from `createdAt` |
| `receivedInAccount` | string | Which IY bank account |
| `proofUrl` | string | Screenshot/slip — **private storage, same protection as ID documents** |
| `notes` | string | Free text |
| `recordedBy` | string | **Staff uid — mandatory, server-set, never client-supplied** |
| `createdAt` / `updatedAt` | timestamp | Server timestamps |
| `reversalOf` | string \| null | Points at the payment being reversed |
| `status` | enum | `ACTIVE`, `REVERSED` — **never hard-delete a payment record** |

**Two rules that matter more than the schema:**

1. **Payments are append-only.** Correct a mistake with a reversing entry, never by editing or deleting. An auditor must be able to reconstruct every figure.
2. **Only a server endpoint may write payments.** Not the admin browser. This is the same class of flaw as P0-02 — if the browser can write financial records directly, the books are only as trustworthy as the least careful laptop.

---

## PART 15 — MULTIPLE PAYMENT ENTRIES *(design only)*

Confirmed: **a single `amountPaid` field is inadequate.** The worked example in the brief makes the point:

```
Booking total          ₹1,00,000
  Payment 1  ₹20,000   TOKEN          12 Jan, UPI,  ref UPI7781
  Payment 2  ₹30,000   PART_PAYMENT   02 Feb, Bank, ref UTR9920
  Payment 3  ₹50,000   FINAL_PAYMENT  20 Feb, Cash, receipt 0043
─────────────────────────────────────────────────────────────────
Total received        ₹1,00,000
Balance                       ₹0
paymentStatus         FULLY_PAID   ← derived, not typed
```

A single field cannot answer "when did the second instalment arrive and through which account?" — which is exactly what finance and any future audit will ask.

**Recommended relationship:**

```
bookings/{bookingId}
    │  1
    │
    │  many
    ▼
booking_payments/{paymentId}
```

Derived values on the booking (`amountReceived`, `balanceDue`, `paymentStatus`) should be **recomputed by the server on every ledger write** and stored for query performance — but the ledger remains the single source of truth. If the two ever disagree, the ledger wins and the cached value is rebuilt.

---

## PART 16 — ADMIN BOOKING MANAGEMENT

| Item | Value |
|---|---|
| Route | `/admin`, tab `bookings` |
| Component | `src/components/admin/dashboard/Bookings.jsx` (728 lines) |
| Query | `getDocs(query(collection(db,'bookings')))` — **entire collection, no pagination** (`:51`) |
| Sorting | Client-side by `createdAt` (`:57`) |
| Filters | Status (`all`/`confirmed`/`pending`/…) (`:99`) |
| Search | Client-side substring |
| Status controls | `updateDoc` → `status` + `bookingStatus` (`:73-76`) |
| Delete | `deleteDoc` — **hard delete, confirm dialog only** (`:88`) |
| Export | CSV (`:161-168`) |
| Detail view | Slide-over panel |

### Capability matrix

| Admin can see | Status | Note |
|---|---|---|
| Booking number | **AVAILABLE** | Raw Firestore auto-ID |
| Package | **AVAILABLE** | `packageTitle` |
| Customer name / email | **AVAILABLE** | |
| Customer phone | **PARTIAL** | Shown in the list; **blank on the invoice** (`selectedBooking.phone` vs stored `contactPhone`) |
| Travel date | **AVAILABLE** | |
| Travellers | **AVAILABLE** | `travelersList` rendered at `:581-587` |
| Total value | **AVAILABLE** | But customer-supplied — see P0-02 |
| Amount received | **MISSING** | `amountPaid` never written; always blank |
| Balance | **MISSING** | `amountPaid < totalPrice` is `undefined < n` → `false`; indicator never renders (`:339`) |
| Booking status | **AVAILABLE** | |
| Payment status | **PARTIAL** | Displays, but permanently `pending` |
| Documents | **MISSING** | Viewer reads a subcollection that is never written (Part 8) |
| Traveller documents | **MISSING** | Same cause |
| Emergency contacts | **PARTIAL** | Present in data, nested two levels deep; not surfaced as a distinct panel |
| Notes | **MISSING** | No field, no UI |
| Created date | **AVAILABLE** | |
| Assigned staff | **MISSING** | Not modelled |
| Activity history | **MISSING** | Not modelled |
| Record a payment | **MISSING** | No UI, no service, no field |

### Additional defects

- **`/admin` role list is wrong.** `App.jsx:192` — `allowedRoles={['admin', 'ops', 'finance']}`. The canonical machine roles issued as custom claims by `functions/index.js:773` (`setCustomUserClaims(uid, { role })`) are `admin`, `hotel_manager`, `tour_manager`, `finance_manager`, `content_manager`, `booking_manager`. **`'ops'` and `'finance'` match no claim that the system ever issues**, so those two entries are inert and the staff they were meant to admit cannot get in.
- **No pagination.** The whole `bookings` collection loads into the browser on every visit to the tab. This degrades linearly and will eventually fail.
- **Hard delete.** `deleteDoc` destroys the booking permanently, guarded only by `window.confirm`.

---

## PART 17 — IDEAL ADMIN BOOKING DETAIL *(design only)*

Recommended sections, with the reasoning that matters:

**1. Booking summary** — reference, status, package, departure, created date, source/channel.
*Why:* the first question on any customer call is "which booking?". `source` matters because it is the only way to learn which marketing actually converts (Part 24).

**2. Customer** — name, email, phone, address, nationality, link to all their past bookings.
*Why:* the past-bookings link is what turns a booking screen into a relationship view and makes repeat customers visible.

**3. Travellers** — full list, age (derived from DOB), gender, nationality, ID type and number, document thumbnails, special requirements.
*Why:* this is the manifest handed to the trek leader. It must be printable as one page.

**4. Trip** — pickup, drop, departure, hotels, transport, meals, special requests.

**5. Financial** — booking value, token required, received, remaining, payment status.
*Why:* every number here must be **derived from the ledger**, never hand-typed. The current screen's ₹1,000 fabrication is exactly what happens when a display value has no authoritative source.

**6. Payment history** — every ledger entry with date, method, reference, recorded-by, proof link, and reversal status.
*Why:* the answer to "did that ₹30,000 arrive?" must be one glance, with an audit trail.

**7. Documents** — per traveller, with an explicit access log.
*Why:* these are passports and Aadhaar cards. Who opened them and when should be recorded — that is both a security control and what makes a retention policy enforceable.

**8. Internal operations** — assigned employee, internal notes, follow-up date, supplier/vendor status.
*Why:* this is the difference between a database and an operations tool. Notes must be internal-only and clearly marked as never customer-visible.

**9. Activity timeline** — created, contacted, payment recorded, documents received, status changed, invoice issued; each with actor and timestamp.
*Why:* it settles disputes, and it is the raw material for every operational metric later.

---

## PART 18 — NOTIFICATIONS

### What actually happens when a customer submits a package booking

**Nothing. No notification of any kind is sent to anyone.**

Verified:

| Channel | Implementation | Wired to package booking? |
|---|---|---|
| Email | `src/services/email.js` — EmailJS, client-side | **No.** `sendBookingEmails` is exported at `email.js:10` and **called from nowhere in the entire repository** |
| WhatsApp | `src/services/whatsappService.js` | **No.** And it is not automation — `sendWhatsAppNotification` calls `window.open('https://wa.me/...')`, which merely **opens a browser tab** with a pre-filled message that a human must then press send on. Used by hotel inquiries only |
| SMS | — | **Does not exist** |
| Admin notification | — | **Does not exist** |
| Cloud Function trigger | `functions/index.js` | **None on `bookings`.** The only Firestore trigger is `createStaffAccount` on `staff_invites` (`:744`) |
| In-app / dashboard alert | — | **Does not exist** |

`BookingSuccess.jsx:195` tells the customer *"Confirmation will be emailed once approved"*. **No code exists that sends that email.**

The operational reality: **a booking's arrival depends entirely on a staff member happening to open the admin panel and look.** If nobody looks over a weekend, a customer who submitted passports and traveller details on Friday hears nothing until Monday — and no alert exists to prevent that.

This is the single largest operational gap in the system, and it is more likely to cost a booking than any of the security findings.

### Recommended notifications *(design only)*

| Event | Recipient | Channel | Priority |
|---|---|---|---|
| **New booking** | Admin | Email **+** WhatsApp | **P0** |
| **New booking** | Customer | Email — booking summary PDF attached | **P0** |
| Payment recorded | Customer | Email receipt | P1 |
| Payment recorded | Admin/finance | Dashboard entry | P2 |
| Balance due (T-14, T-7) | Admin | Email digest | P1 |
| Balance due reminder | Customer | Email (opt-in) | P2 |
| Booking confirmed | Customer | Email + WhatsApp | P1 |
| Documents pending | Admin | Dashboard | P2 |
| Departure approaching (T-3) | Both | Email | P2 |

**Architectural requirement:** these must be **Cloud Function Firestore triggers**, not browser calls. A browser-side notification does not fire if the customer closes the tab — precisely when it is needed most. EmailJS with a public key in client code is also abusable as an open relay.

---

## PART 19 — INTERNAL ADMIN NOTIFICATION CENTRE

**Recommendation: yes, but not yet — and not as a standalone system.**

Sequence matters here:

**Phase A (immediate, with Part 18):** email + WhatsApp to admin on new booking. Solves the "nobody knew" problem at the lowest cost.

**Phase B:** an **action-required widget** on the existing admin Overview dashboard — not a new subsystem. Counts, each linking to a filtered booking list:
- New bookings not yet reviewed
- Token pending > 48h
- Documents missing < 14 days to departure
- Balance overdue
- Departures in the next 7 days

**Phase C (only if volume justifies it):** a true task system with assignment and due dates.

**Reasoning:** a notification centre nobody opens is worse than an email nobody can ignore. Email first establishes the habit; the dashboard widget then reduces the noise. Building a task system before booking volume justifies it creates a second place to keep in sync and it will drift.

**Recommended: combination — email/WhatsApp for arrival, dashboard widget for the queue.**

---

## PART 20 — BOOKING STATUS MODEL

### Current state

Three fields, all initialised to `'pending'`:

- `status` — `'pending'` → admin sets `'confirmed'` / `'cancelled'` / `'completed'`
- `bookingStatus` — **an exact duplicate**, written in lockstep (`Bookings.jsx:74-75`)
- `paymentStatus` — `'pending'`, **never changed by any code path**

`status` and `bookingStatus` are pure duplication and a guaranteed future divergence. Any code that updates one but not the other silently creates two truths.

### Recommended lifecycle *(design only)*

**Four independent dimensions.** They must be separate because **they change for different reasons, at different times, driven by different people.**

**BOOKING STATUS** — the commercial state of the agreement:
`DRAFT` → `SUBMITTED` → `UNDER_REVIEW` → `CONFIRMED` → `TRAVEL_COMPLETED`, with `CANCELLED` and `EXPIRED` as terminal branches.

**PAYMENT STATUS** — **derived from the ledger, never typed:**
`UNPAID` / `PARTIALLY_PAID` / `FULLY_PAID` / `OVERPAID` / `REFUND_PENDING` / `PARTIALLY_REFUNDED` / `REFUNDED`.

**DOCUMENT STATUS** — compliance readiness:
`NOT_REQUIRED` / `PENDING` / `PARTIAL` / `SUBMITTED` / `VERIFIED` / `REJECTED`.

**FULFILMENT STATUS** — operational readiness:
`NOT_STARTED` / `VENDORS_PENDING` / `VENDORS_CONFIRMED` / `READY_FOR_DEPARTURE` / `IN_PROGRESS` / `COMPLETED`.

**Why separate them:** a booking can legitimately be *fully paid* but *documents pending*; or *confirmed* but *vendors unconfirmed*. Collapsing these into one field forces a false choice — and when staff have to pick one label for three realities, they pick inconsistently and the data stops meaning anything. Four dimensions also make the operational queues in Part 19 trivial to compute.

**Note the collision:** today's `'confirmed'` means "IY accepted the booking". It does **not** mean paid. Any future automation must not treat `confirmed` as a payment signal.

---

## PART 21 — BOOKING NUMBER

**Current:** `doc(collection(db,'bookings'))` — a client-generated Firestore auto-ID, 20 characters, e.g. `xK9mPqR2nL4vB8cD1eF3`.

Problems: unreadable over the phone; unbranded; carries no date or type; impossible to sanity-check; looks like an error message to a customer.

### Recommendation *(design only)*

**Keep two identifiers. They serve different purposes and should not be merged.**

| | Database ID | Customer reference |
|---|---|---|
| Value | Firestore auto-ID (unchanged) | `IY-PKG-2026-00123` |
| Field | document ID | `bookingReference` |
| Purpose | Internal relations, indexes | Human communication |
| Properties | Random, collision-safe | Readable, sequential, branded |

Format: `IY-{MODULE}-{YEAR}-{SEQ}` — e.g. `IY-PKG-2026-00123`, `IY-HTL-2026-00456`.

**Two implementation cautions:**
1. The sequence **must be allocated server-side** (a Firestore transaction on a counter document, or a Cloud Function). A browser cannot safely allocate a sequential number — two simultaneous bookings would collide.
2. A strictly sequential public number **leaks business volume**: `IY-PKG-2026-00123` tells a competitor exactly how many packages have been sold this year. If that matters commercially, start the counter at a non-obvious number or add a short check suffix. **This is a business decision, not a technical one** (Part 34).

---

## PART 22 — DOMESTIC + INTERNATIONAL READINESS

### Already supports

| Capability | Where |
|---|---|
| Nationality per traveller | `travelersList[].nationality`, full country list (`src/data/countries.js`) |
| Nationality-aware document types | `BookingPage.jsx:25-48` — India/USA/UK/other; passport and visa page already offered |
| Passport as a document type | `DOC_TYPES_BY_NATIONALITY` — all four profiles |
| International phone numbers | `react-phone-input-2` with country selector |
| Multi-day itinerary with stays | `itinerary[]` |
| Per-location pricing | `pickupLocations[]` — could extend to origin cities |

This is a better starting position than expected. The traveller model is already nationality-aware.

### Requires schema expansion

| Capability | Gap |
|---|---|
| **Currency** | **Nothing is modelled.** `₹` is hardcoded throughout. No `currency` field anywhere |
| **Country / region on package** | `location` is free text; no ISO country code, no domestic/international flag |
| **Timezone** | Dates are `'YYYY-MM-DD'` strings with no timezone. `BookingPage.jsx:507-509` does manual offset arithmetic |
| **Passport number & expiry** | Document **images** are collected; **no structured fields**. Cannot check "expires within 6 months of travel" |
| **Visa status** | Not modelled as state — only as an optional image |
| **Travel insurance** | Not modelled |
| **International flights** | Not modelled |
| **Airport transfers** | `pickupDrop` is free text |
| **Forex / multi-currency pricing** | Not modelled |
| **Country-specific terms** | `generalPolicy` is a single string |
| **Taxes** | **Not modelled at all** — no GST, no TCS. TCS on overseas tour packages is a statutory consideration for Indian outbound travel and needs a finance decision (Part 34) |
| **International suppliers** | Vendor model does not distinguish |
| **Emergency support abroad** | Not modelled |

**Highest-leverage recommendation:** add `currency` (default `'INR'`) and `countryCode` to packages, bookings **and payment records now**, while the data volume is small. Retrofitting currency onto a populated financial ledger is materially harder than including it from the start, and it costs almost nothing today.

---

## PART 23 — GROUP / FAMILY / CORPORATE READINESS

| Type | Supported | Limitation |
|---|---|---|
| Solo | **Yes** | Traveller count 1 works |
| Couple | **Yes** | |
| Family | **Partial** | No adult/child distinction → **no child pricing possible**. No relationship field between travellers. No room allocation |
| Friends | **Partial** | Works, but one payer only |
| Group departure | **Partial** | `minimumPersons` / `minimumClients` exist but are advisory; `batchDates[].availableSeats` is never decremented, so **two groups can book the same last seat** |
| Corporate | **No** | No company/GSTIN field, no billing entity separate from lead traveller, no PO reference, no consolidated invoicing |
| Custom / private trip | **Partial** | `minimumPersons` unlocks any date, but there is no custom-quote path — pricing is fixed per package |

### Structural limitations

1. **One payer assumed.** `totalPrice` is a single number against one `userId`. Split payment across group members is impossible.
2. **No adult/child/infant split.** `travelers` is one integer; price is `effectivePrice × travelers`. Child pricing, infant-free, and senior concessions are all unreachable without a schema change.
3. **No room/occupancy model.** No single/double/triple supplement — standard for both domestic and international packages.
4. **No traveller relationships.** Cannot express "these four are one family".
5. **No billing entity.** The lead traveller is assumed to be the payer. Corporate bookings need company name, GSTIN and a billing address distinct from the traveller.
6. **No inventory locking.** The most serious of these — nothing prevents overselling a departure.

---

## PART 24 — DASHBOARD & BUSINESS ANALYTICS

Current analytics: `src/components/admin/dashboard/Overview.jsx` and `Financials.jsx`. Both read the entire `bookings` collection and aggregate client-side.

| Question | Status | Note |
|---|---|---|
| Bookings this month | **AVAILABLE NOW** | `createdAt` present |
| Bookings this year | **AVAILABLE NOW** | |
| Travellers this month | **AVAILABLE NOW** | Sum `travelers` |
| Total booking value | **POSSIBLE — BUT UNRELIABLE** | `totalPrice` is customer-supplied (P0-02). **The revenue figure on the dashboard cannot be trusted** |
| **Amount collected** | **NOT POSSIBLE** | `amountPaid` is never written. `Financials.jsx:41` returns **0 for every booking** |
| **Outstanding amount** | **NOT POSSIBLE** | Requires the payment ledger |
| Most booked package | **AVAILABLE NOW** | `Overview.jsx:128-130` |
| Most booked destination | **POSSIBLE** | Via `packageId` → `packages.location` (free text — needs normalising) |
| Popular month | **AVAILABLE NOW** | From `bookingDate` |
| Popular departure date | **AVAILABLE NOW** | |
| **Popular origin city** | **POSSIBLE** | `pickupLocation` is stored — an underused asset. Normalise it and it answers "where should we add a pickup?" |
| **Domestic vs international** | **REQUIRES NEW DATA** | No country/region flag |
| Cancellation rate | **POSSIBLE** | `status == 'cancelled'`, but no cancellation timestamp or reason |
| Average booking value | **POSSIBLE — UNRELIABLE** | Same `totalPrice` problem |
| Repeat customer | **AVAILABLE NOW** | Group by `userId` |
| **Token vs full payment** | **NOT POSSIBLE** | No payment data exists |
| **Lead source** | **REQUIRES NEW DATA** | No `source`/`utm` field. `leads`/`enquiries` are **not linked** to `bookings` |
| **Package conversion** | **REQUIRES NEW DATA** | No view-tracking; no enquiry→booking link |

**Summary: the two numbers a travel business runs on — how much was collected, and how much is outstanding — are both unanswerable today.** Everything else is achievable, and roughly half is already achievable from existing data.

---

## PART 25 — DATA WE SHOULD START CAPTURING

Grouped by justification. Nothing here is proposed merely because AI might want it.

### Required for booking (operational necessity)

| Field | Why |
|---|---|
| `packagePriceAtBooking` | **Server-derived.** Without it, editing a package rewrites history for every past booking |
| `packageVersion` | Snapshot of terms as accepted |
| `currency` | Trivial now, painful later (Part 22) |
| `adults` / `children` | Unlocks child pricing; needed for manifests |
| `termsAcceptedAt` + `termsVersion` | The cancellation policy is currently never presented or accepted (P1-05) |
| `bookingReference` | Human-usable reference (Part 21) |
| `updatedAt` | Absent today |

### Useful for operations

| Field | Why |
|---|---|
| Payment ledger (Part 14) | Collected vs outstanding |
| `documents[]` metadata | Presently orphaned (Part 8) |
| `assignedTo` | Accountability |
| Internal notes | Currently no place to write "customer prefers evening calls" |
| Activity timeline | Dispute resolution |
| `cancellationReason` + `cancelledAt` | Cancellation analytics are impossible without them |
| Passport number + **expiry** | Structured — needed to validate before international travel |

### Useful for analytics

| Field | Why |
|---|---|
| `source` / `utm_*` | **The single highest-value addition.** Without it, marketing spend cannot be evaluated |
| `enquiryId` link | Connects `leads`/`enquiries` to `bookings` — unlocks conversion rate |
| `deviceType` | Mobile vs desktop conversion |
| `timeToBook` | Enquiry → booking duration |
| Normalised `originCity` | `pickupLocation` already collected; just needs normalising |
| `countryCode` + `isInternational` | Domestic vs international split |

### Optional / consent-based

Marketing opt-in (explicit, separate from booking), dietary preference, travel interests, birthday (for offers — **only with consent**).

### Sensitive — avoid unless genuinely required

| Data | Position |
|---|---|
| **Aadhaar number/image** | **Collect only when a specific vendor or statutory requirement demands it.** Aadhaar carries specific handling obligations under Indian law. Currently collected as *optional* with no stated purpose — which is the weakest possible position. A business/legal decision (Part 34) |
| **PAN** | Only if required for TCS/tax reporting. Not needed for a domestic trek |
| **Passport** | Justified for international travel. **Not** for domestic. Should be conditional on package type |
| Medical information | Only if the activity genuinely requires it (high-altitude trek). Treat as health data |
| Payment proof screenshots | Necessary for manual reconciliation; restrict access to finance |
| Photographs | Purpose must be stated |

**Governing principle:** the current form offers Aadhaar, PAN, passport, driving licence and voter ID to **every** traveller on **every** package, all optional, with **no stated purpose and no consent text**. Collecting the most sensitive category of personal data "just in case" is the highest-liability, lowest-value pattern available. Documents should be **conditional on what the trip actually requires**.

---

## PART 26 — FUTURE AI LEARNING

Realistic applications once the data model above is in place:

| Application | Data required | Feasible when |
|---|---|---|
| Trip recommendations | Booking history, package attributes, `userId` | After Phase 1 |
| Package popularity | Bookings per package over time | **Partly possible today** |
| Seasonality | `bookingDate` + `createdAt` distributions | **Partly possible today** |
| Conversion analysis | `source`, enquiry→booking link, view tracking | Requires Part 25 additions |
| Customer preferences | Aggregated categories, durations, price bands | After Phase 1 |
| Pricing intelligence | Price, `costPrice`, conversion, competitor context | After payment ledger |
| Demand forecasting | 12–24 months of bookings with departure dates | Needs history to accumulate |
| Vendor performance | Vendor assignment + outcomes | Requires a vendor model |
| Repeat-customer recommendations | Booking history by `userId` | **Partly possible today** |

### Boundaries — explicit

**Never used for AI, analytics, or model training:**
- Aadhaar, PAN, passport, driving licence, voter ID, SSN — numbers **or** images
- Any uploaded document image
- Payment proof screenshots
- Medical information
- Emergency contact details
- Raw phone numbers and email addresses

**The correct pattern:** analytics runs on a **separate, minimised, structured projection** of booking data — package ID, price band, traveller count, month, origin city, source, outcome. Never on the raw booking document, and never on Storage contents.

This is not only a privacy position. Identity documents contain no signal relevant to any of the questions above. Excluding them costs nothing analytically and removes an entire category of risk.

---

## PART 27 — DATA RETENTION & PRIVACY

### Currently collected

| Category | Where | Assessment |
|---|---|---|
| Lead contact (name, email, phone) | `bookings` | **Necessary** |
| Traveller names | `bookings.travelersList[]` | **Necessary** |
| Date of birth | `travelersList[].dob` | **Necessary** (age limits, ID matching) |
| Gender | `travelersList[].gender` | **Questionable** — no stated operational use. Room allocation would justify it, but no room model exists |
| Nationality | `travelersList[].nationality` | **Necessary** for international |
| Up to 5 phone numbers per traveller | `travelersList[].contactNumbers[]` | **Excessive** — one per traveller plus the lead contact is sufficient |
| Up to 5 emergency contacts per traveller | `travelersList[].emergencyContacts[]` | **Excessive** — for 6 travellers this is up to **30 third-party contact records**, from people who never consented and will never be told |
| Aadhaar / PAN / Passport / DL / Voter ID images | **Firebase Storage** | **Highest risk — see below** |

### Findings requiring action

1. **No retention policy exists.** Nothing is ever deleted. Passports uploaded for a 2024 trek are still in the bucket, indefinitely.
2. **Documents are orphaned** (Part 8). Even a deliberate deletion request could not be honoured — **there is no record of which files belong to whom.** This alone makes any data-subject deletion request impossible to fulfil.
3. **Storage access rules are not in the repository.** Who can read these files is unknown and unverifiable from source.
4. **Download URLs never expire.** A URL leaked once — forwarded in an email, pasted in a chat — grants permanent access. Cancelling a booking does not revoke it.
5. **No consent text.** No purpose statement, no retention notice, no privacy-policy link at the point of document upload.
6. **No access logging.** No record of which staff member viewed which passport.
7. **Emergency contacts have no relationship to the business.** Their data is collected from a third party who is never informed.

### Should have restricted access

Identity documents, payment proofs, emergency contacts, full DOB, and (once it exists) the payment ledger. Presently **no role-based distinction exists for any of these** — any admin sees everything.

### Requires business/legal decision — not technical

- Retention period for identity documents after travel completion
- Whether Aadhaar should be collected at all, given its specific statutory handling obligations
- Whether documents are required for **domestic** travel or only international
- Lawful basis and consent wording for storing government IDs
- Data-subject deletion request process
- Whether DPDP Act obligations apply at current scale
- Staff access tiers for identity documents

*This audit does not provide legal advice. These items need qualified input.*

---

## PART 28 — SECURITY (package booking path only)

| Control | State | Finding |
|---|---|---|
| Customer ownership on create | **OK** | `ownsNewDocument()` forces `userId == auth.uid` |
| Cross-user booking read | **OK** | `allow get, list: if isAdmin() \|\| ownsExistingDocument()` |
| Customer booking update | **OK** | `allow update, delete: if isAdmin()` — customers cannot mutate |
| Status injection on create | **OK** | All three status fields pinned to `'pending'` |
| Field injection on create | **OK** | Closed `hasOnly([...])` allowlist |
| **Package price tampering** | **BROKEN — P0-02** | `totalPrice` accepted from the browser with **no validation whatsoever** |
| **Package ID tampering** | **BROKEN — P0-03** | `packageId` never validated against a real package; `packageTitle` is a free string. A booking can reference a non-existent package with an arbitrary title |
| **Private commercial data** | **BROKEN — P0-01** | `allow read: if true` on `packages` exposes `costPrice`, `tokenPrice`, `b2bPrice` to the entire internet |
| **Document access** | **UNKNOWN — P0-06** | Storage rules not in the repository |
| **Document metadata write** | **BROKEN — P0-08** | No rule for `bookings/{id}/documents` → silent permanent failure |
| Traveller data access | **OK** | Embedded in the booking, inherits booking rules |
| Manual payment modification | **N/A** | No payment system exists yet. **Must be server-side when built** |
| Invoice access | **WEAK** | Generated from client state; **fabricates payment data (P0-05)** |
| Booking-status modification | **OK** | Admin-only via rules |
| **Admin role gate** | **BROKEN — P1-01** | `App.jsx:192` allows `'ops'`/`'finance'`, which are not roles the system issues |
| **Committed private key** | **P0-07** | `aws/RSA.pem` deleted from the tree but **present in git history** |

### Relationship to the existing security programme

The `bookings` and `users` rules on `main` are noticeably well-written — closed key allowlists, affected-key diffing on `users`, explicit `ownsExistingDocument()` helpers. Their own comments say server-authoritative pricing was *"intentionally deferred to Phases 0D/0E"*.

So P0-02 is a **known, accepted deferral**, not an oversight. This report's contribution is to record that the deferral is now the binding blocker: the payment ledger in Part 14 cannot be built on a `totalPrice` the customer controls. **Phase 1 must close it.**

P0-01, P0-06 and P0-08, by contrast, appear **not** to have been identified previously.

---

## PART 29 — PACKAGE BOOKING ISSUE REGISTER

| ID | Area | Problem | Sev | File | Customer impact | Business impact | Direction |
|---|---|---|---|---|---|---|---|
| **P0-01** | Privacy | `costPrice`, `tokenPrice`, `b2bPrice` publicly readable; whole collection fetched on every page load | **P0** | `firestore.rules:193`, `PackageContext.jsx:17` | None visible | **Competitors can read every margin** | Split private fields to a restricted subcollection; project fields on read |
| **P0-02** | Integrity | `totalPrice` computed in browser, written with no validation | **P0** | `BookingPage.jsx:583,635`; `firestore.rules` | Could underpay | **Revenue loss; dashboard figures untrustworthy** | Server-derived pricing (already deferred as Phase 0D/0E) |
| **P0-03** | Integrity | No package version/price snapshot; `packageId` unvalidated | **P0** | `BookingPage.jsx:626-627` | Terms change after booking | Disputes are unwinnable | Snapshot price + terms; validate package exists |
| **P0-04** | Inventory | `availableSeats` never decremented | **P0** | `BookingPage.jsx`, `AdminPackageForm.jsx` | **Turned away after paying** | Overselling; reputational | Transactional seat decrement |
| **P0-05** | Finance | Admin invoice fabricates a ₹1,000 payment and prints "BOOKING AMOUNT RECEIVED" | **P0** | `Bookings.jsx:125,128`; `InvoiceGenerator.js:48` | **Receives a false receipt** | **False financial records** | **Disable immediately**; rebuild after ledger exists |
| **P0-06** | Privacy | No `storage.rules` in repo; ID document access rules unknown & unreviewable | **P0** | *(absent)*; `firebase.json` | **Passports may be exposed** | Regulatory exposure | Author, review and commit Storage rules |
| **P0-07** | Secrets | `aws/RSA.pem` present in git history | **P0** | git history | — | Credential compromise | Rotate the key; purge history |
| **P0-08** | Function | Document metadata write always denied (no rule); failure silently swallowed | **P0** | `BookingPage.jsx:651,656`; `firestore.rules` | **Told it worked; it didn't** | **Admin never sees documents; orphaned IDs** | Add the rule; surface the error |
| **P1-01** | Access | `/admin` allows `'ops'`/`'finance'`, which are not issued roles | **P1** | `App.jsx:192` | — | Staff locked out | Use canonical machine roles |
| **P1-02** | Privacy | `isVisible` filtered client-side; unpublished packages downloaded | **P1** | `PackageContext.jsx:64` | — | Draft/pricing leakage | Server-side `where('isVisible','==',true)` |
| **P1-03** | Data quality | DOB/gender/nationality marked required but never validated | **P1** | `BookingPage.jsx:550-558` | Contacted later for missing data | Incomplete manifests | Validate what is marked required |
| **P1-04** | Notification | **Zero notifications on booking submission** | **P1** | *(absent)* | **Silence after booking** | **Lost bookings** | Cloud Function trigger → email + WhatsApp |
| **P1-05** | Legal | No T&C / cancellation-policy acceptance; no consent for ID storage | **P1** | `BookingPage.jsx` step 3 | Unaware of terms | Unenforceable cancellation terms | Explicit checkbox + `termsAcceptedAt` |
| **P1-06** | Finance | `amountPaid` read in 4 files, written by none; collected revenue always 0 | **P1** | `Financials.jsx:41` et al. | — | **Cannot see money collected** | Payment ledger (Part 14) |
| **P1-07** | Data | `status` and `bookingStatus` duplicated | **P1** | `BookingPage.jsx:639-640` | — | Guaranteed divergence | Single field |
| **P1-08** | Resilience | `BookingSuccess` renders from navigation state; refresh loses everything | **P1** | `BookingSuccess.jsx:11,120` | **Loses confirmation on refresh** | Support load | Fetch by booking ID |
| **P1-09** | UX | Expired session → confirm button silently does nothing | **P1** | `BookingPage.jsx:606` | **Dead button, no message** | Abandoned bookings | Handle and message |
| **P2-01** | Perf | Entire `hotels` collection fetched to suggest 2 | **P2** | `BookingPage.jsx:443` | Slow load | Cost | Query with limit |
| **P2-02** | Perf | Admin loads all bookings, no pagination | **P2** | `Bookings.jsx:51` | — | Degrades with growth | Paginate |
| **P2-03** | Data | Static package file merged over Firestore; deleted packages reappear | **P2** | `PackageContext.jsx:24-37` | Sees stale packages | Confusion | Retire the fallback |
| **P2-04** | Data | Hardcoded `filter(p => p.id !== 'kedarnath')` | **P2** | `PackageContext.jsx:40` | — | Business rule in code | Data-driven visibility |
| **P2-05** | Safety | Admin hard-deletes bookings | **P2** | `Bookings.jsx:88` | Booking vanishes | **Irrecoverable** | Soft delete |
| **P2-06** | Hygiene | `dist/` build output committed | **P2** | repo root | — | Noise; stale-asset risk | Gitignore |
| **P2-07** | Validation | No file type/size enforcement on upload | **P2** | `BookingPage.jsx:303-308` | — | Storage cost; malicious upload | Server-side validation |
| **P2-08** | Data | Invoice reads `selectedBooking.phone`; field is `contactPhone` | **P2** | `Bookings.jsx:134` | Blank phone on invoice | Unprofessional | Correct the field name |
| **P3-01** | UX | Book Now doesn't check auth; selection lost at login | **P3** | `PackageDetail.jsx:214` | Re-enters details | Drop-off | Preserve intent |
| **P3-02** | Data | `discount` displayed but never applied | **P3** | `AdminPackageForm.jsx`, `BookingPage.jsx` | Expects a discount | Disputes | Apply or remove |
| **P3-03** | UX | Invoice auto-downloads unprompted | **P3** | `BookingSuccess.jsx:113` | Surprise download | — | Make it a button |
| **P3-04** | i18n | Name inputs strip non-Latin characters | **P3** | `BookingPage.jsx:194` | **Cannot enter own name** | Excludes customers | Widen the pattern |

---

## PART 30 — WHAT TO KEEP

Genuinely good work that should **not** be rebuilt:

| Component | Verdict | Reason |
|---|---|---|
| **Three-step booking flow** | **KEEP** | Well-paced; the step model is right |
| **Traveller card UX** | **KEEP** | Expand/collapse with per-traveller summary handles groups well |
| **Nationality-aware document types** | **KEEP** | `BookingPage.jsx:25-48` is genuinely thoughtful — most systems bolt this on late |
| **`react-phone-input-2` with country codes** | **KEEP** | International-ready from day one |
| **Firestore `bookings` / `users` rules** | **KEEP** | Closed key allowlists and affected-key diffing are well above average |
| **Cloudinary / Firebase Storage separation** | **KEEP** | Marketing images and identity documents correctly separated |
| **`serverTimestamp()` for `createdAt`** | **KEEP** | Correct — not client clock |
| **Rich itinerary model** | **KEEP** | day/title/description/activities/distance/altitude/stay/meals is a strong schema |
| **Per-location pricing** | **KEEP** | `pickupLocations[]` is a real competitive feature |
| **Departure-type model** | **KEEP** | daily/weekly/minimum-clients + season window is flexible and well-judged |
| **"Pay after team confirms" positioning** | **KEEP** | Honest, matches how the business actually operates |
| **Admin booking list + detail panel** | **IMPROVE** | Good shell; needs payments, documents, notes, pagination |
| **`AdminPackageForm`** | **IMPROVE** | Comprehensive; needs private-field separation and validation |
| **`PackageContext`** | **REFACTOR** | Sound idea; static merge and client-side filtering must go |
| **`BookingSuccess`** | **REFACTOR** | Fetch from DB, not navigation state; rename the document |
| **`InvoiceGenerator`** | **REPLACE** | Fabricates payment data; cannot be patched safely |
| **`src/data/packages.js` fallback** | **REPLACE** | Causes deleted packages to reappear |
| **`sendBookingEmails` (EmailJS)** | **REPLACE** | Client-side email is the wrong architecture; move server-side |

---

## PART 31 — TARGET ARCHITECTURE *(design only)*

Evaluating each proposed entity against **the simplest correct model for a Firestore-first architecture**:

| Entity | Verdict | Reasoning |
|---|---|---|
| **Package** | **Keep as a collection** | Exists and works |
| **PackagePrivate** | **NEW — subcollection `packages/{id}/private/commercial`** | Solves P0-01 cleanly. `costPrice`, `tokenPrice`, `b2bPrice` move here with staff-only read. **Minimal change, maximum benefit** |
| **PackageVersion** | **NOT a collection — snapshot into the booking** | A full version-history collection is over-engineering at this volume. Copy price, title and terms into the booking at creation. Solves P0-03 at a fraction of the cost |
| **Departure** | **Defer — but promote when inventory matters** | `batchDates[]` embedded works until seats must be atomically decremented. **A separate collection is the correct answer to P0-04**, because Firestore transactions on an array element are awkward. Promote when inventory enforcement is built (Phase 3) |
| **Customer** | **Use existing `users`** | Do not duplicate |
| **Booking** | **Keep as a collection** | Add the fields from Part 25 |
| **Traveller** | **Keep embedded in the booking** | Firestore favours denormalisation; travellers are always read with their booking and never queried independently. **Embedding is correct here** |
| **TravellerDocument** | **NEW — subcollection `bookings/{id}/documents`** | The path already exists in code (`BookingPage.jsx:651`) — **it only lacks a security rule**. Fixing P0-08 is a rules change, not a redesign |
| **BookingPayment** | **NEW — collection `booking_payments`** | **Top-level, not a subcollection.** Finance needs cross-booking queries ("all UPI receipts in March") which subcollections make awkward without collection-group indexes |
| **BookingInvoice** | **NEW — collection `invoices`** | Invoices need their own sequential numbers and independent lifecycle |
| **BookingActivity** | **NEW — subcollection `bookings/{id}/activity`** | Always read in booking context. Append-only |
| **BookingNote** | **Merge into `activity`** | A note is an activity entry of type `NOTE`. **A separate collection is unnecessary** |
| **Notification** | **Defer to Phase 7** | Not needed until Part 19 Phase C |

### Recommended model

```
packages/{packageId}                       public: read: if true
   └── private/commercial                  staff-only: costPrice, tokenPrice, b2bPrice   ← fixes P0-01

departures/{departureId}                   (Phase 3 — when seat enforcement is built)
   packageId, date, totalSeats, seatsBooked

users/{uid}

bookings/{bookingId}
   ├─ bookingReference   "IY-PKG-2026-00123"
   ├─ packageId + packageSnapshot{price,title,terms,version}   ← fixes P0-03
   ├─ travellers[]  (embedded — correct for Firestore)
   ├─ amountReceived / balanceDue / paymentStatus   (DERIVED from ledger)
   ├── documents/{docId}        ← EXISTS IN CODE, needs only a rule    fixes P0-08
   └── activity/{activityId}    (append-only; includes notes)

booking_payments/{paymentId}               top-level: cross-booking finance queries
invoices/{invoiceId}                       sequential numbering
```

Three new collections, one new subcollection pair, one field migration. **Not a rewrite.**

---

## PART 32 — TARGET DATA FLOW

```
ADMIN
  └─ creates package  ──► SERVER endpoint (validates, splits private fields)
                            └─► packages/{id}          public fields
                                packages/{id}/private  costPrice, tokenPrice, b2bPrice

                          ▼
                    PUBLISHED PACKAGE   (public read — public fields only)
                          ▼
CUSTOMER  browses ──► selects date + travellers ──► BOOKING FORM
                          ▼
                 SERVER endpoint: createBooking
                   ├─ validates package exists and is visible
                   ├─ DERIVES price from packages/{id}      ← fixes P0-02
                   ├─ snapshots price + terms               ← fixes P0-03
                   ├─ decrements departure seats (txn)      ← fixes P0-04
                   ├─ allocates IY-PKG-YYYY-NNNNN           ← Part 21
                   └─ writes bookings/{id}
                          ▼
              ┌───────────┴────────────┐
              ▼                        ▼
    bookings/{id}                  Firestore TRIGGER
      ├── travellers[]               ├─► admin email + WhatsApp   ← fixes P1-04
      ├── documents/     ← rule       └─► customer Booking Summary PDF
      └── activity/                        (NOT an invoice — no payment yet)
                          ▼
                   ADMIN MANAGEMENT
                     ├─ reviews, contacts, confirms
                     ├─ records payment ──► SERVER ──► booking_payments/{id}
                     │                                   └─► recompute derived totals
                     │                                   └─► receipt email
                     └─ once FULLY_PAID ──► invoices/{id}   (real tax invoice)
                          ▼
                    ANALYTICS  (minimised projection — no PII, no documents)
```

---

## PART 33 — DEVELOPMENT ROADMAP

Re-sequenced after the audit. **Three things move ahead of the brief's original order**, because they are either actively harmful or cheap and blocking.

---

### PHASE 0 — STOP THE BLEEDING *(days, not weeks)*

**Goal:** halt active harm. No new features.

| Task | Finding | Why first |
|---|---|---|
| Disable the admin invoice button | P0-05 | It generates false financial records **today** |
| Author, review, commit `storage.rules` | P0-06 | Passport exposure is currently unknown and unverifiable |
| Rotate the AWS key; purge from history | P0-07 | Credential may be compromised |
| Add the `bookings/{id}/documents` rule; surface the error | P0-08 | Documents are silently lost every booking |
| Fix `/admin` role list | P1-01 | One-line fix; staff are locked out |

**Exists:** nothing. **Changes:** `firestore.rules`, new `storage.rules`, `firebase.json`, `Bookings.jsx`, `App.jsx`.
**Tests:** rules tests for the documents subcollection.
**Business decisions:** none — all five are unambiguous.

---

### PHASE 1 — SERVER-AUTHORITATIVE DATA MODEL

**Goal:** the server owns price and identity. Everything downstream depends on this.

| Task | Finding |
|---|---|
| `createBooking` Cloud Function; server-derived pricing | P0-02 |
| Package snapshot into booking | P0-03 |
| Split private commercial fields to `packages/{id}/private` | P0-01 |
| Server-side `isVisible` filtering | P1-02 |
| `bookingReference` with transactional counter | Part 21 |
| Add `currency`, `updatedAt`, `source`; collapse `status`/`bookingStatus` | P1-07, Part 25 |

**Exists:** good Firestore rules; the Functions Express app is already deployed and can host the endpoint.
**Changes:** `functions/index.js`, `firestore.rules`, `BookingPage.jsx`, `PackageContext.jsx`, `AdminPackageForm.jsx`.
**Security dependency:** **this phase is the prerequisite for the payment ledger.** A ledger built on a customer-controlled `totalPrice` inherits the flaw.
**Tests:** rules tests; price-tampering rejection; snapshot immutability.
**Business decisions:** booking reference format and starting sequence (Part 34 Q14).

---

### PHASE 2 — BOOKING FORM & DATA CAPTURE

**Goal:** collect what is needed, validate what is marked required, obtain consent.

Tasks: enforce validation on required fields (P1-03); T&C + cancellation acceptance with `termsAcceptedAt` (P1-05); adults/children split; consent text at document upload; reduce phone numbers and emergency contacts to sane limits (Part 27); widen name validation (P3-04); fix session-expiry handling (P1-09).

**Business decisions:** which documents are mandatory, and for which package types (Q7, Q8).

---

### PHASE 3 — TRAVELLER & DOCUMENT HANDLING + INVENTORY

**Goal:** documents actually work end to end; seats stop overselling.

Tasks: `documents` subcollection written and read; file type/size validation server-side (P2-07); short-lived signed URLs instead of permanent tokens; access logging; admin document viewer; **promote `departures` to a collection with transactional seat decrement (P0-04)**.

**Note:** inventory is placed here rather than later because P0-04 lets a customer pay for a seat that does not exist — a customer-facing failure, not merely an internal one.

**Business decisions:** retention period (Q9); who may view identity documents (Q10).

---

### PHASE 4 — BOOKING CONFIRMATION & DOCUMENTS

**Goal:** correct documents with correct names.

Tasks: **Booking Summary** (not "Invoice") generated server-side and stored; `BookingSuccess` fetches from the database (P1-08); remove auto-download (P3-03); `invoices` collection with sequential numbering; clear separation of Summary / Receipt / Tax Invoice (Part 12).

**Business decisions:** when a tax invoice is issued (Q11); GST/TCS treatment (Q17).

---

### PHASE 5 — ADMIN BOOKING MANAGEMENT

**Goal:** the operational tool from Part 17.

Tasks: full detail screen; pagination (P2-02); soft delete (P2-05); internal notes; `assignedTo`; activity timeline; fix `contactPhone` (P2-08).

---

### PHASE 6 — MANUAL PAYMENT LEDGER

**Goal:** know what has been collected.

Tasks: `booking_payments` collection; **server-only writes**; append-only with reversals; derived `paymentStatus`; payment-proof upload; receipt generation; rebuild `Financials.jsx` on real data (P1-06).

**Depends on Phase 1.** **Business decisions:** Q1–Q6 (token policy, confirmation trigger, accepted methods).

---

### PHASE 7 — NOTIFICATIONS

**Goal:** nobody misses a booking.

Tasks: Firestore trigger on booking create → admin email + WhatsApp, customer acknowledgement (P1-04); payment receipt email; balance-due digest; **move off client-side EmailJS to a server provider**.

**Note on sequencing:** P1-04 is business-critical and might appear to belong in Phase 0. It sits here because a *correct* notification must contain a *correct* booking summary and a *trustworthy* price — both of which arrive in Phases 1 and 4. A stop-gap admin email in Phase 0 is reasonable if booking volume makes waiting costly; that is a business call.

---

### PHASE 8 — DASHBOARD & ANALYTICS

Tasks: rebuild Overview on server-derived figures; collected vs outstanding; source/conversion tracking; normalised origin city; the Part 24 matrix.

---

### PHASE 9 — DOMESTIC / INTERNATIONAL READINESS

Tasks: `countryCode`, `isInternational`; structured passport number + expiry with validation against travel date; visa status; multi-currency; country-specific terms; TCS handling.

**Business decisions:** Q16, Q17.

---

### PHASE 10 — QA / SECURITY / RELEASE

Tasks: full Firestore + Storage rules test suite; end-to-end booking tests; independent security review of the package path; retention policy implementation; load testing; runbook.

---

## PART 34 — BUSINESS QUESTIONS FOR THE OWNER

These require business decisions and cannot be answered from the code.

**Payment and confirmation**
1. When is a booking considered *confirmed* — on token receipt, on full payment, or on manual staff approval regardless of payment?
2. Is the token a fixed amount (the form defaults to ₹2,000/person) or a percentage of package value?
3. Can an admin override the token amount for a specific booking? Who may authorise that?
4. Can multiple part payments be recorded between token and final? (The design assumes yes — please confirm.)
5. Which payment methods are accepted: bank transfer, UPI, cash, cheque, card, other?
6. Is a booking ever confirmed with **no** payment — for repeat customers or corporate accounts?

**Documents**
7. Which documents are **compulsory** versus optional? Today everything is optional and the business relies on staff chasing.
8. Do document requirements differ between domestic and international packages?
9. How long should identity documents be retained after travel completes?
10. Who may view passports and Aadhaar — all admins, or a restricted role?
11. **Should Aadhaar be collected at all?** It carries specific statutory handling obligations. Is there an operational need a PAN or passport would not meet?

**Invoicing**
12. When should a customer receive an invoice — on submission, on token receipt, or on full payment?
13. Should a Booking Summary be issued before any payment? (Recommended: yes, clearly labelled as *not* a receipt.)
14. Booking reference format and starting sequence — noting that a sequential public number reveals annual volume (Part 21).

**Customer experience**
15. Must a customer create an account, or should guest booking be allowed? (Currently login is mandatory.)
16. Can a customer modify traveller details after submission, and up to what cut-off?
17. Can a customer cancel from the website, or must cancellation go through staff?

**Operations**
18. What is the policy for unpaid bookings — auto-expire after N days, or manual follow-up indefinitely?
19. Is WhatsApp needed immediately, or is email sufficient for the first release?
20. Who is notified of a new booking — one address, or a team distribution list?
21. Is there an internal SLA for first customer contact after a booking arrives?

**International**
22. Is international travel planned within the next 12 months? (This determines whether Phase 9 work belongs earlier.)
23. How should GST and TCS on overseas tour packages be handled? *(Requires qualified tax input.)*

---

## PART 35 — SUMMARY FOR THE OWNER

*Written in plain English. No technical terms.*

### 1. How package creation works today

You log into the admin panel and fill in a long form — title, price, photos, day-by-day itinerary, what's included, cancellation rules, departure dates. You press save and it goes straight into the database. It works, and the form is genuinely thorough.

**One serious problem.** That same form has boxes for your **cost price** and **token price** — your buying cost and your margin. These are saved in the same record that the public website reads. Anyone who visits infiniteyatra.com can see exactly what each trip costs you and what you make on it. They don't need to hack anything; the information is sent to every visitor's browser automatically. A competitor could read your entire margin structure in about a minute.

### 2. How customer booking works today

The customer opens a package, picks a date and pickup point, and clicks Book Now. They must log in. Then three steps: trip and contact details, then details for each traveller (name, date of birth, gender, nationality, phone, optional ID document, optional emergency contacts), then a review screen and Confirm.

They then see a success page saying the team will be in touch, and a PDF downloads automatically.

The flow itself is well built. The traveller section handles groups nicely and already asks for the right documents depending on nationality — that is better than most systems at this stage.

### 3. Where customer data goes today

Into Google's Firestore database, in a section called `bookings`. Each booking is one record containing the lead contact, every traveller's details, and the emergency contacts — all bundled together in a single entry.

**The price is the concern.** The total is worked out by the **customer's own web browser** and then saved. Nothing on your side checks it. Someone with basic technical knowledge could change a ₹60,000 trek to ₹1 before submitting, and it would be accepted and appear in your admin panel as a normal booking.

### 4. Where customer documents go today

This is the most serious finding in the report, and it has two parts.

**First:** when a customer uploads their Aadhaar or passport, the file uploads successfully — but **the database record that says "this file belongs to this booking" is never created.** A permission setting was never added, so that step fails every single time, silently. Nobody is told.

So the files exist, but nothing points to them. **Your admin panel's document viewer is empty for every booking, always.** And because there is no record of which file belongs to whom, you could not delete a customer's documents on request even if you wanted to — you have no way to find them.

**Second:** the rules controlling who can open those files are **not in your codebase at all.** They exist only in a Google settings page. Nobody on your team can tell you, from the project, who can read your customers' passports. It may be fine. It may be that any logged-in user can read anyone's. **This report cannot tell you which** — and that uncertainty about passport and Aadhaar files is itself the problem.

### 5. What admin can see today

The booking list works: customer name, email, package, date, travellers, total, status. You can filter, search, change status, and export to CSV. The layout is good.

What you **cannot** see:
- **Any uploaded document** — always empty, for the reason above
- **How much money has been received** — there is no field for it and no way to record it
- **The outstanding balance** — same reason
- **Any notes** about the booking
- **Who on your team is handling it**

Your Financials screen reports **₹0 collected against every booking**, because nothing can ever record a payment.

### 6. What happens after booking today

**Nothing happens automatically. Nothing at all.**

No email to you. No WhatsApp to you. No email to the customer. No alert anywhere.

A booking appears in the database and sits there **until a staff member happens to open the admin panel and look.** If a customer books on Friday evening and nobody checks until Monday, they have submitted their passport and traveller details and heard complete silence for three days.

The success page even promises them *"Confirmation will be emailed once approved"*. **No such email exists anywhere in the system.**

Of everything in this report, this is the one most likely to be costing you bookings right now.

### 7. What is missing

- Any way to record a payment
- Any automatic notification to you or the customer
- A working link between uploaded documents and bookings
- Server-side checking of the price
- Seat limits that actually apply — two customers can book the same last seat
- A readable booking number (currently something like `xK9mPqR2nL4vB8cD1eF3`)
- A record of terms being accepted
- Any note, assignment, or history on a booking

### 8. What is unsafe

1. **Your cost price and margin are visible to the public.**
2. **The customer's browser decides the price** — it can be changed before submitting.
3. **Customer passports and Aadhaar cards sit in storage under rules nobody can review**, with no record of what is there.
4. **Your admin "Download Invoice" button creates a false document.** Because no payment can ever be recorded, it fills the gap with **₹1,000** and prints a PDF headed **"BOOKING AMOUNT RECEIVED"**. If that has ever been sent to a customer or used in your books, it states a payment that never happened. **Please stop using that button today.**
5. **A private security key was committed** into the project history and needs replacing.
6. **Seats are never actually reserved**, so a departure can be oversold.

### 9. What should be built first

**Immediately — days, not weeks:**
1. Turn off the admin invoice button. It creates false financial records.
2. Find out who can read the passport files, write those rules down properly, and put them in the project.
3. Replace the security key that was committed.
4. Add the one missing permission so uploaded documents stop disappearing.

**Next:**
5. Move price calculation from the customer's browser to your server. Everything financial depends on this being right first.
6. Move your cost price and token price out of the public record.

**Then:**
7. Turn on notifications so you and the customer both hear about a booking immediately.
8. Build the payment recording system so you can finally see what has been collected and what is outstanding.

### 10. What should NOT be touched yet

- **The three-step booking flow** — it is well designed. Keep it.
- **The traveller details section** — the expanding cards and nationality-aware document list are genuinely good work.
- **The package admin form** — comprehensive and worth keeping; it only needs the private price fields separated out.
- **The "pay after we confirm" approach** — this is honest, it matches how you actually work, and customers respond well to it. **Do not rush to add online payment.** Get manual payment recording right first.
- **The itinerary structure** — day-by-day with distance, altitude, stay and meals is better than most competitors have.
- **Hotels, transport, cruise and other modules** — outside this audit's scope, untouched.

The foundations here are better than the problem list suggests. Most of what is wrong comes from one root cause: **there is no server in the middle.** The customer's browser talks straight to the database, so the database has to trust whatever the browser says. Fixing that one thing in Phase 1 resolves the price problem, the private data problem, and unblocks payments, notifications and reliable reporting.

---

## AUDIT METADATA

| Item | Value |
|---|---|
| Files read | 30+ across `src/`, `functions/`, `server/`, `firestore.rules`, `firebase.json`, `package.json` |
| Application code modified | **NONE** |
| Database modified | **NONE** |
| Security rules modified | **NONE** |
| Configuration modified | **NONE** |
| Files created | `IY_PACKAGE_BOOKING_CURRENT_STATE.md` (this file) |
| Commits | **NONE** |
| Pushes | **NONE** |
| Deploys | **NONE** |
| Customer documents accessed | **NONE** — architecture inspection only |

**Every finding is cited to a file and line and was verified from source, not from documentation.**
