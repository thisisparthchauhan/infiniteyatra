# Firebase retirement inventory

The Firebase project stays untouched as an archive. Nothing here deletes it.
This records exactly what still depends on it, so retirement becomes a checklist
rather than a judgement call.

Counted on the fresh-launch branch: **93 frontend files still import `firebase/*`.**

## FIREBASE NO LONGER USED — migrated to the Hostinger API

The whole customer-critical path now runs on Express + MariaDB:

| Area | File | Now uses |
|---|---|---|
| Customer identity | `src/context/AuthContext.jsx` | `/api/auth/*`, httpOnly cookie |
| API transport | `src/services/apiClient.js` (new) | same-origin `/api` |
| Booking create/read | `src/services/packageBookingApi.js` | `/api/bookings` |
| Booking history | `src/pages/MyBookings.jsx` | `/api/bookings` |
| Booking form + catalogue | `src/pages/BookingPage.jsx` | `/api/catalogue/*` |
| Booking confirmation | `src/pages/BookingSuccess.jsx` | via the services above |

Also retired by the rewrite: Firebase Auth for customers, Firestore reads for
packages/hotels on the booking path, and the Firebase ID token — there is no
token in JavaScript at all now.

## FIREBASE STILL USED BY NEW CODE

Nothing on the booking or auth path. What remains is ancillary and unbuilt
against the new API yet:

**Content and lead capture (customer-visible, low risk)**
`TravelStories`, `StoriesPage`, `CreateStoryModal`, `Hero`, `Contact`,
`ContactUs`, `ContactNew`, `EnquiryPopup`, `WhatsAppBookingButton`,
`Footer` (newsletter), `SpaceWaitlistModal`, `AscensionProject`.
→ Target: `content_pages` and a `leads` table. Each is a single write.

**Adjacent product lines not in this migration's scope**
Hotels booking (`HotelBookingPage`, `HotelDetail`, `HotelCompare`,
`HotelReviews`, `HotelInquiryModal`), transport (`TransportationBookingDrawer`),
referrals (`ReferralWidget`, `ReferralDashboard`), reviews (`ReviewForm`,
`ReviewModal`), availability (`useAvailability`), recommendations, profile.

**Admin dashboard (~60 files)**
Still reads Firestore directly. The replacement APIs exist and are tested
(`/api/admin/packages`, `/api/admin/hotels`, `/api/admin/bookings`,
`/api/admin/bookings/:id/status`, `/api/admin/bookings/:id/payments`), so this
is now wiring rather than design.

## Safe to remove once usage reaches zero

Do **not** remove these while any importer remains — the build will break loudly,
but a half-removed SDK fails in ways that are harder to read.

- **Dependencies:** `firebase` (frontend), `firebase-admin` + `firebase-functions`
  (in `functions/`, once that codebase is retired)
- **Files:** `src/firebase.js`, `firestore.rules`, `firestore.rules.cutover`,
  `storage.rules`, `firebase.json`, `.firebaserc`, `functions/`
- **Env:** every `VITE_FIREBASE_*` in the deploy workflow and its GitHub secrets
- **Scripts:** `api/scripts/import-catalogue.mjs` — its only purpose is the
  one-time read from Firebase; delete it after the import is confirmed

## Order

1. Wire the admin dashboard to the admin APIs (largest group, already built)
2. Move lead capture and content writes
3. Decide hotels/transport/referrals — migrate or retire the feature
4. Delete `src/firebase.js` and drop the `firebase` dependency
5. Retire `functions/`
6. **Only then**, and only on the owner's explicit approval, delete the Firebase
   project — after exporting it as an archive

Until step 6, Firebase remains the archive of record for the 16 historical
bookings, which are deliberately not migrated.
