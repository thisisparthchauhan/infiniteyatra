# Infinite Yatra — Staff Authorization

**Phase:** SA-1 — Staff Authorization Alignment
**Status:** Code complete. **No production claims have been changed.** Awaiting owner role approval.
**Blocks:** PB-5 (staff access to customer identity documents)

---

## 1. Why SA-1 exists

The codebase had drifted into **three disagreeing authorization systems**, and PB-5 was about to grant staff access to passports, Aadhaar and PAN documents on top of them.

| | Mechanism | Trusted | Real boundary? |
|---|---|---|---|
| 1 | `AuthContext` + `RoleRoute` | a hardcoded email list and Firestore `users.role` | **No** |
| 2 | `firestore.rules` / `storage.rules` | Firebase ID token custom claims | **Yes** |
| 3 | `security.js adminAuthMiddleware` | a custom JWT, Firestore `users.role`, 2FA | **No** |

The practical result: **a staff member invited through the UI received the claim `operations`, which no rule recognises.** They got the full admin dashboard and were then denied by every rules-protected read. Meanwhile three hardcoded email addresses granted admin UI with no claim at all.

## 2. The source of authorization truth

**The Firebase ID token custom claim, verified server-side. Nothing else.**

Not an email address. Not `users.role`. Not any client-held value.

## 3. Canonical role vocabulary

| Machine value | Label |
|---|---|
| `admin` | Administrator |
| `hotel_manager` | Hotel Manager |
| `booking_manager` | Booking Manager |
| `tour_manager` | Tour Manager |
| `finance_manager` | Finance Manager |
| `content_manager` | Content Manager |

Defined once per runtime and kept in lockstep:

- `functions/staffRoles.js` — server
- `src/config/staffRoles.js` — client mirror (labels and descriptions live here too)
- `storage.rules` `isStaff()` / `firestore.rules` `isAdmin()` — the enforcing copies

`tests/sa1.staff-auth.test.mjs` **parses the rules files** and fails if any copy drifts. Silent divergence is exactly what caused this problem, so it is now a build failure.

Machine values are never rendered; labels are never compared.

`src/config/roles.js` is **unrelated** — it holds admin-dashboard *workspace* display labels and was deliberately left alone.

### Retired values

`operations` · `finance` · `guide` · `ops` — issuable or referenced before SA-1, recognised by no rule. They are now rejected everywhere and are **never auto-translated**: mapping a real person from one of these to a real role has security consequences and is an owner decision.

## 4. Claim issuance

Unchanged path, now validated: `staff_invites/{id}` created → `createStaffAccount` trigger → `setCustomUserClaims(uid, { role })`.

**New:** the trigger rejects any role that is not canonical *before* issuing a claim, marking the invite `rejected` with the allowed list. The invite document is client-written, so its role is untrusted input — previously it was issued verbatim.

The invite UI now offers only canonical roles, defaulting to `booking_manager`.

## 5. Client consumption

`AuthContext` resolves claims with `getIdTokenResult()` and exposes:

- `claimRole` — the verified claim, or `null`
- `isAdmin` — `claims.admin === true || claimRole === 'admin'`
- `isStaff` — admin, or any canonical staff role
- `profileRole` — the Firestore value, kept for display under a name that **cannot be mistaken** for the authorization role

It **fails closed**: if claims cannot be resolved, no staff affordance is granted.

`RoleRoute` grants on `claimRole` only. The direct email grant and the `users.role` fallback are gone.

**Client route protection is UX.** It decides what to render, never what is permitted. Every protected action is authorised again server-side.

## 6. Server authorization

```js
app.get(path,
    requireFirebaseUser,                        // verifies the ID token
    requireStaff(['admin', 'booking_manager']), // checks the verified claim
    handler);
```

`requireFirebaseUser` now retains `role` and `isAdminClaim` from the decoded token — and only those. `requireStaff`:

- takes the role from the verified claim, with **no email and no `users.role` fallback**
- treats an `admin` claim as satisfying any staff guard, matching both rules files
- **throws at startup** if constructed with a non-canonical role, rather than silently permitting nothing
- **fails closed** with 401 if mounted without `requireFirebaseUser`
- returns a 403 body that names neither the required role nor the caller's, so probing reveals nothing

This is the primitive PB-5 builds on. It is **not yet mounted on any route** — SA-1 adds no endpoints.

## 7. `/admin` route — deliberately narrowed, not broadened

`['admin', 'ops', 'finance']` → `['admin']`.

`ops` never existed as a claim. `finance` was issuable but matched no rule.

It was **not** opened to all six staff roles: `/admin` mounts the entire dashboard — hotels, transport, finance, content, packages, staff management — so admitting `booking_manager` there would hand booking staff every unrelated module. **PB-5 adds a booking-scoped surface for `admin` + `booking_manager` instead.**

> **Open issue:** the admin dashboard is a single route with no per-module authorization. Splitting it by role is a larger piece of work than SA-1 and is recorded here rather than attempted.

## 8. Legacy `adminAuthMiddleware` — untouched

`functions/security.js` still authorises on a custom JWT plus `users.role`, and additionally demands 2FA enrolment.

**PB-5 must not use it, and it must not be extended.** Three independent reasons: it trusts a mutable profile field; it introduces a second token system alongside Firebase Auth; and its 2FA precondition would lock out correctly-claimed staff.

SA-1 deliberately does not rewrite it — that is a separate retirement, and widening this patch would risk unrelated endpoints.

## 9. Provisioning tool — dry run by default

`scripts/staff-claims.mjs`

```bash
gcloud auth application-default login
node scripts/staff-claims.mjs --mapping scripts/staff-roles.json           # dry run
node scripts/staff-claims.mjs --mapping scripts/staff-roles.json --apply   # writes
```

Mapping file at `scripts/staff-roles.json` (gitignored via `scripts/.gitignore` — it contains staff addresses):

```json
{ "someone@example.com": "booking_manager" }
```

**Safety properties, each test-enforced:**

| | |
|---|---|
| Dry run unless `--apply` | no accidental writes |
| Mapping file mandatory | **never infers a role for anyone** |
| Validates every role up front | a typo cannot half-apply a batch |
| Refuses legacy values with a hint | `operations` must be mapped deliberately |
| Looks up only named accounts | `getUserByEmail`, never `listUsers` |
| Never exports the auth database | no `auth:export`, no enumeration |
| Masks identifiers, prints only the role | no hashes, tokens or secrets |
| Prints no stack traces | they can carry credential paths |
| Replaces claims wholesale | a stale `admin: true` cannot survive |

Credentials come from Application Default Credentials. **No service-account JSON is read from or written to this repository.**

## 10. Token refresh

Custom claims do not appear in an already-issued ID token. After provisioning, an affected staff member must **sign out and back in**, or wait for the token to refresh (up to one hour). The tool prints this after any `--apply`.

Sign-out/in is preferred over a forced client refresh: it is simpler, unambiguous, and needs no code that behaves differently while a stale token is in play. **No fallback that honours the old token is provided** — that would reintroduce exactly the gap SA-1 closes.

## 11. Deployment ordering — important

**Claims must be provisioned BEFORE this build ships.**

Once deployed, the UI grants on the claim alone. Anyone who currently reaches `/admin` via a hardcoded email or a Firestore `users.role` of `admin`, but holds no custom claim, **will lose admin UI access**.

That is the intended correction — they had no data access anyway — but it is operationally significant and must not be discovered in production.

1. Owner approves the role mapping (§12)
2. Run the tool in dry run; confirm the output
3. Run with `--apply`
4. Affected staff sign out and back in; verify access
5. Only then deploy this build

## 12. Owner role-mapping gate

Claim status for real accounts **could not be verified from this environment**, and was deliberately not forced: the only available mechanism (`firebase auth:export`) dumps the entire production user database including password hashes — disproportionate for checking a handful of accounts. The Admin SDK path needs ADC, which is not configured here.

The three previously hardcoded addresses are **legacy UI admin candidates**. They must not receive `admin` merely because they appeared in code. Each needs explicit owner confirmation.

Legacy claim holders need a deliberate decision. `finance → finance_manager` is near-obvious; `operations → booking_manager` and `guide → tour_manager` are **recommendations only** and must be justified by what the person actually does.

## 13. PB-5 dependency

PB-5 is unblocked once:

- the canonical vocabulary is in place — **done**
- PB-5 can authorise without email or `users.role` — **done** (`requireStaff`)
- intended staff hold canonical claims — **pending owner approval and `--apply`**
- no permission is weakened to make PB-5 work — **held**

PB-5 will mount `requireStaff(['admin', 'booking_manager'])` on its booking and document-review routes.
