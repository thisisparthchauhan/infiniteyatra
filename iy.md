# Infinite Yatra — Complete Site Documentation

> **A living document covering everything about the Infinite Yatra platform — architecture, technology, file structure, how each page works, how to run / build / deploy, and the full log of recent design changes.**

---

## 1. Project Overview

**Infinite Yatra** ("Explore Infinite") is a comprehensive travel-tech platform that combines multiple verticals into one unified product:

- 🌍 **Tour packages** — curated multi-day itineraries
- 🏨 **Hotels** — partner inventory + bookings
- 🚗 **Transportation** — cars, cabs, cruises, cycles, private jets
- 🤖 **AI Trip Planner** — generate custom itineraries with Gemini / OpenAI
- ✍️ **Travel Stories & Blog** — user-generated and editorial content
- 📔 **Travel Passport** — gamified passport stamps for completed trips
- 🚀 **IY Space Program (`/future`)** — futuristic vertical for the space-tourism vision
- 🪐 **The Ascension Project (`/ascension-project`)** — the long-arc civilization-development initiative (founder document)
- 👨‍💼 **Admin Dashboard** — full CRM, finance, operations, content management

The site is a **single-page React application** deployed as a **static SPA on Firebase Hosting**, with **Firestore** as the primary database and **Firebase Cloud Functions** for server-side logic.

---

## 2. Tech Stack

### Frontend
| Layer | Tool | Version |
|-------|------|---------|
| Framework | **React** | 18.3.1 |
| Build tool | **Vite** | 7.x |
| Routing | **react-router-dom** | 7.x |
| Styling | **Tailwind CSS v4** (with `@tailwindcss/vite`) | 4.1.x |
| Animations | **framer-motion** | 11.x |
| Icons | **lucide-react** | latest |
| SEO | **react-helmet-async** | 2.x |
| Charts | **recharts** | 3.x |
| Maps | **react-simple-maps** | 3.x |
| Date picker | **react-datepicker** | 9.x |
| PDF / Excel | **jspdf**, **xlsx**, **html2canvas**, **file-saver** | – |
| Toasts | **react-hot-toast** | – |

### Backend / Services
| Service | Purpose |
|---------|---------|
| **Firebase Auth** | Email/password + Google sign-in |
| **Firestore** | Primary NoSQL database (all collections) |
| **Firebase Hosting** | Static SPA deployment |
| **Firebase Cloud Functions** | Server-side endpoints (`/api/**`) — payment webhooks, fraud checks, server-secrets |
| **Cloudinary** | Image hosting / transforms |
| **EmailJS** | Transactional emails (bookings, admin alerts) |
| **Razorpay** | Payment gateway (primary) |
| **Stripe / PayPal** | Optional secondary gateways |
| **Google Gemini API** | AI itinerary generation, content suggestions |
| **OpenAI** | Secondary AI provider |
| **Groq** | Fast LLM inference for some real-time features |
| **WhatsApp Business API** | Transactional WhatsApp messages |

### Dev / QA
| Tool | Purpose |
|------|---------|
| **Playwright** | End-to-end tests (`npm run test`) |
| **ESLint** | Linting |
| **GitHub** | Repo at `github.com/thisisparthchauhan/infiniteyatra` |

---

## 3. Repository Layout

```
infiniteyatra/
├── public/              # Static assets served at root
│   ├── favicon.png
│   ├── logo.png
│   ├── og-image.png
│   ├── fonts/
│   │   └── SpaceX.ttf   # SpaceX display font (used on /future, /ascension-project)
│   ├── images/
│   └── itineraries/
├── src/
│   ├── App.jsx          # Top-level router + layout switching
│   ├── main.jsx         # ReactDOM entry
│   ├── index.css        # Global Tailwind + @font-face declarations
│   ├── firebase.js      # Firebase init (app, auth, db)
│   ├── assets/          # Local images / SVGs
│   ├── components/
│   │   ├── auth/        # ProtectedRoute, AdminRoute, RoleRoute
│   │   ├── admin/       # Every admin-panel sub-page (40+ components)
│   │   ├── layout/      # Navbar, Footer, page chrome
│   │   ├── common/      # SEO, shared UI
│   │   └── ...          # Modals, cards, etc.
│   ├── pages/           # Top-level routes
│   │   ├── Home.jsx
│   │   ├── Future.jsx          ★ Space program landing
│   │   ├── AscensionProject.jsx ★ Founder charter long-form
│   │   ├── AdminDashboard.jsx
│   │   ├── Hotels.jsx
│   │   ├── PackageDetail.jsx
│   │   ├── TripPlanner.jsx
│   │   ├── BlogPage.jsx
│   │   ├── StoriesPage.jsx
│   │   ├── Passport.jsx
│   │   └── ... (50+ pages)
│   ├── services/        # API wrappers (Razorpay, Firestore queries, AI, etc.)
│   │   ├── PaymentService.js
│   │   ├── carService.js, hotelService.js, ...
│   │   ├── gemini.js, openai.js, groq.js
│   │   ├── email.js, whatsappService.js
│   │   ├── db_schema.js     # Firestore collection map
│   │   └── ...
│   ├── context/         # React Context providers
│   │   ├── AuthContext.jsx    # currentUser, loading, sign-in/out
│   │   ├── RoleContext.jsx    # admin / ops / finance role permissions
│   │   └── ...
│   ├── hooks/           # Custom hooks
│   ├── config/
│   │   └── roles.js     # MENU_ITEMS, USER_ROLES, permission matrix
│   ├── data/            # Static data (destinations seed, etc.)
│   └── utils/           # Helpers
├── functions/           # Firebase Cloud Functions source
├── dist/                # Build output (git-ignored)
├── firebase.json        # Firebase Hosting + Functions config
├── firestore.rules      # Firestore security rules
├── firestore.indexes.json
├── tailwind.config.js   # (handled by @tailwindcss/vite)
├── vite.config.js
├── package.json
└── iy.md                # ← THIS FILE
```

---

## 4. Routing Map (selected)

All routes are declared in `src/App.jsx`. The router uses `react-router-dom v7`.

| Route | Component | Notes |
|-------|-----------|-------|
| `/` | `Home` | Marketing homepage |
| `/destinations` | `DestinationsPage` | |
| `/login`, `/signup` | `Login`, `Signup` | |
| `/trip-planner` | `TripPlanner` | AI-assisted (Gemini) |
| `/package/:id` | `PackageDetail` | |
| `/blog`, `/blog/:id` | `BlogPage`, `BlogPost` | |
| `/stories`, `/story/:id` | `StoriesPage`, `StoryDetail` | |
| `/contact`, `/careers` | – | |
| `/hotels`, `/hotels/:id`, `/hotels/book/:id`, ... | Hotels vertical | |
| `/transport/...`, `/transportation/...` | Transport vertical | |
| `/cruise`, `/cycles`, `/private-jets` | – | |
| `/trip/:tripId`, `/plan/:shareId` | Trip details / shared plan | |
| `/wishlist`, `/my-bookings`, `/passport` | Protected (requires login) | |
| `/profile` | User profile | |
| `/admin` | `AdminDashboard` | `RoleRoute` — admin / ops / finance only |
| `/connect` | `QRLanding` | QR scan landing |
| **`/future`** | **`Future`** | ★ IY Space Program |
| **`/ascension-project`** | **`AscensionProject`** | ★ Founder long-form document |
| `/team-guide` | `TeamGuide` | Internal staff page |
| `/terms` | Legal | |

> **Layout switching:** In `App.jsx`, `shouldHideLayout` is true for `/admin`, `/connect`, `/future`, `/ascension-project` — these pages render with no global navbar/footer (they ship their own).

---

## 5. Firestore Data Model

The collection map lives in `src/services/db_schema.js`. High-level overview:

| Collection | Holds |
|-----------|-------|
| `users` | Customer accounts (email, displayName, photoURL, savedTrips) |
| `staff` / `roles` | Admin role assignments — admin / ops / finance |
| `packages` | Tour package master data |
| `bookings` | Tour bookings (trip-level) |
| `hotels`, `hotelBookings`, `hotelInquiries`, `hotelReviews` | Hotels vertical |
| `cars`, `carBookings`, `vehicles`, `transportBookings` | Transport vertical |
| `cruiseBookings`, `cycleBookings` | Other transport |
| `stories`, `storyComments` | User travel stories |
| `blogPosts` | Editorial blog |
| `inquiries` / `leads` | CRM lead pipeline |
| `passport` / `passportStamps` | Travel passport gamification |
| `waitlist_space` | Future / Space program waitlist signups |
| `reviews` | Package reviews + admin moderation |
| `homepageContent` | Homepage editorial blocks managed from admin |
| `payments`, `refunds`, `invoices` | Finance |

**Security:** Rules in `firestore.rules` use a role-check pattern. Admin-side collections require `request.auth.token.role in ['admin','ops','finance']` (mirrored via `RoleContext`).

---

## 6. Authentication & Roles

- **Provider**: Firebase Auth (email + Google).
- **State**: `src/context/AuthContext.jsx` exposes `currentUser`, `loading`, `signIn`, `signOut`.
- **Admin roles**: `src/context/RoleContext.jsx` reads role from a `staff` document keyed by uid and exposes `currentRole`, `hasPermission(menuId)`, etc.
- **Allowed admin emails** (hard-coded fallback in `src/components/auth/AdminRoute.jsx`):
  ```js
  ['infiniteyatra@gmail.com', 'chauhanparth165@gmail.com', 'universetcenter@gmail.com']
  ```
- **Route guards**:
  - `ProtectedRoute` → requires any logged-in user
  - `RoleRoute allowedRoles={[…]}` → checks role
  - `AdminRoute` → checks against hard-coded admin email list

> **Admin profile dropdown** in `AdminDashboard.jsx` reads from `useAuth()` so it always shows the actual logged-in user (this was the bug fixed earlier — it used to show a hard-coded name/email).

---

## 7. Environment Variables

See **`ENV_VARIABLES.md`** for the canonical list. Roughly:

```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID

VITE_RAZORPAY_KEY_ID
VITE_GEMINI_API_KEY
VITE_OPENAI_API_KEY
VITE_GROQ_API_KEY
VITE_CLOUDINARY_CLOUD_NAME

VITE_EMAILJS_SERVICE_ID
VITE_EMAILJS_TEMPLATE_USER
VITE_EMAILJS_TEMPLATE_ADMIN
VITE_EMAILJS_PUBLIC_KEY
```

Stored in `.env` (git-ignored). Server-side secrets (Razorpay secret, Stripe secret, Cloud Functions config) live in `firebase functions:config` — never in client code.

---

## 8. Local Development

```bash
# Install
npm install

# Dev server (Vite — usually http://localhost:5173)
npm run dev

# Type/lint
npm run lint

# Production build (outputs to dist/)
npm run build

# Preview the prod build locally
npm run preview

# E2E tests
npm run test
npm run test:ui
```

---

## 9. Build & Deploy

The deploy script is in `package.json`:

```bash
npm run deploy
# = vite build && firebase deploy
```

This:
1. Builds the SPA into `dist/`
2. Deploys hosting + functions + Firestore rules to the configured Firebase project.

Firebase Hosting config (`firebase.json`):
- `public: dist`
- All non-`/api` paths rewrite to `/index.html` (SPA fallback)
- `/api/**` routes to the `api` Cloud Function

**Manual deploy targets** (when you don't want everything):
```bash
firebase deploy --only hosting
firebase deploy --only firestore:rules
firebase deploy --only functions:api
```

GitHub remote: `https://github.com/thisisparthchauhan/infiniteyatra` — branch `main`.

---

## 10. The `/future` Page — IY Space Program

**File:** `src/pages/Future.jsx`

### Purpose
Marketing / brand page for Infinite Yatra's space-tourism vision — "today across Earth, tomorrow beyond it."

### Sections
1. **Hero** — `INFINITE YATRA` headline bottom-left, three meta tiles (Program / Fleet / Status)
2. **01 — The Fleet** — 2×2 grid of vehicle cards:
   - **IY Aurora** (orbital, 400 km, 72 hrs, 6 pax)
   - **IY Horizon** (deep space, 2.7 AU, 180 days, 4 pax)
   - **IY Selene** (lunar, 384 k km, 7 days, 2 pax)
   - **IY Mangal** (interplanetary, 225 m km, 6 months, 100 pax)
3. **02 — Program Timeline** — 5-phase roadmap (2026 → 2040+)
4. **03 — Reservation** — `Reserve Your Seat` CTA + Flight Manifest panel → opens `SpaceWaitlistModal` which writes to Firestore `waitlist_space`
5. **04 — The Ascension Project** — link card to `/ascension-project`
6. **Footer** — IY logo, program links, classified footer

### Visual language
- Pure black `#000` background with subtle radial glow + 1.5 % SVG noise grain
- White text, `white/60` secondary, `white/40` tertiary
- Hairline `white/10` borders
- Mono-font numbered labels (`01 — FLEET`)
- **SpaceX font** for display headings (auto-lowercased by CSS rule, see §13)
- **Inter** for body paragraphs
- Ghost CTA buttons that invert on hover

### Vehicle illustrations
The 4 rocket SVGs (`RocketAurora`, `RocketHorizon`, `RocketSelene`, `RocketMangal`) are **static monochrome technical schematics** with engineering callout labels (EXT TANK, GRID FIN, RAPTOR CLUSTER, etc.). They are inside `Future.jsx`, lines ~189–443.

### Background animation
`StarField` (canvas) renders ~320 parallax-twinkling stars. `CustomCursor` shows a cyan cursor on desktop.

---

## 11. The `/ascension-project` Page

**File:** `src/pages/AscensionProject.jsx`

### Purpose
A long-form **founder document / charter** for *The Ascension Project* — Arius Raynott's stewardship initiative for humanity's expansion beyond a single world. Linked from the footer card on `/future`.

### Sections (13 total)
| # | Section | Anchor id |
|---|---------|-----------|
| Hero | Mission overview + founder identity | `#hero` |
| 01 | Purpose — why we exist | `#purpose` |
| 02 | Vision — multiplanetary / sovereign / resilient | `#vision` |
| 03 | Core Principles (6 cards) | `#principles` |
| 04 | Core Beliefs (10 numbered statements) | `#beliefs` |
| 05 | AI Philosophy (4 stance cards) | `#ai` |
| 06 | Contribution Philosophy (4 contributor roles) | `#contribution` |
| 07 | Founder Responsibilities + Dev Roadmap | `#founder` |
| 08 | Research Foundation Roadmap (4 phases 2026–2035) | `#roadmap` |
| 09 | Long-Term Civilization Roadmap (Near / Mid / Long) | `#civilization` |
| 10 | Success & Failure Criteria | `#success` |
| 11 | Future of Humanity | `#future` |
| 12 | Closing Manifesto (signed by Arius Raynott) | `#manifesto` |

### Visual language
Same SpaceX.com aesthetic as `/future`. Fixed top nav with project title centered + `MENU` button that opens a full-screen slide-out index. Smooth-scroll between sections, scroll-spy highlights active section.

### Where the content came from
Distilled & expanded from `Executive Summary (1).docx` (the user's source document) — the founder document for the charter.

---

## 12. Admin Panel (`/admin`)

**File:** `src/pages/AdminDashboard.jsx` + every component in `src/components/admin/`.

### Access
- Wrapped in `RoleRoute allowedRoles={['admin','ops','finance']}` → only those roles can see it
- Profile dropdown top-right shows the **actual logged-in user** (`useAuth().currentUser.email`)
- Hidden global layout — admin ships its own sidebar + header

### Modules
- **Overview** — KPIs, charts
- **Bookings** — every booking type
- **Inventory** — packages, hotels, vehicles
- **Operations** — staff assignment, day-of-trip ops
- **Financials** — payments, refunds, invoices (jsPDF generator)
- **Customer CRM** — leads, contacts
- **Content** — blog, stories, homepage manager
- **Experiences** — curated experiences
- **Hotels** — full hotel-partner manager (forms, finance, reviews, availability, vendors, bookings, inquiries, pricing simulator)
- **Transport** — cities, vehicles, cars, cruise, cycles, bookings, content, settings
- **AI Widgets** — `AdminAIPlanner`, `AdminAIWidget`
- **Sitemap** — internal route audit
- **Seat Analytics** — `/future` waitlist analytics
- **Stats** — site-wide metrics
- **Staff** — `AddStaffModal` — provisions admin users
- **Passport** — passport stamp management

Menu items + per-role permissions are defined in `src/config/roles.js` (`MENU_ITEMS`, `USER_ROLES`).

---

## 13. Design System & Recent Changes (Change Log)

This whole section captures the design choices made over the recent session.

### 13.1 Fonts

- **SpaceX** — custom display font for `/future` & `/ascension-project` headlines  
  Location: `public/fonts/SpaceX.ttf`  
  Declaration: `@font-face` in `src/index.css`
- **Inter** — body text on `/future` & `/ascension-project`
- **Raleway** — site-wide logo font (used in the homepage `Navbar` / `Footer`)
- **Orbitron** — legacy fallback
- **Mono** (system mono) — small numbered labels and meta tags

### 13.2 Global CSS rules (`src/index.css`)

```css
@font-face {
    font-family: 'SpaceX';
    src: url('/fonts/SpaceX.ttf') format('truetype');
    font-display: swap;
}

/* Anything that uses the SpaceX font auto-lowercases */
[class*="font-['SpaceX'"] {
    text-transform: lowercase;
}
```

This means: every heading using `font-['SpaceX',_'Helvetica_Neue',_sans-serif]` renders lowercase, while body text in Inter / mono labels keeps natural case.

### 13.3 Color & spacing tokens (SpaceX.com aesthetic)

| Token | Value | Usage |
|-------|-------|-------|
| Background | `#000000` | Page base |
| Text primary | `white` | Headings |
| Text secondary | `white/60` | Body |
| Text tertiary | `white/40` | Labels |
| Quaternary | `white/30` | Disabled / footnote |
| Hairline | `white/10` | Dividers, card borders |
| Section padding | `py-28 md:py-40` | All sections |
| Container | `max-w-7xl mx-auto` with `px-6 md:px-16 lg:px-24` | All content |

### 13.4 Reusable components inside the pages

- `SectionLabel` — numbered + tagged section header (`01 — Purpose`)
- `SectionHeading` — large editorial `h2`, `clamp(32px, 4.2vw, 56px)` with `break-words`, `overflow-wrap: break-word`, `hyphens: auto` (prevents long-word overflow into sibling columns — bug fixed earlier)
- `Section` — section wrapper with consistent padding
- `Rule` — hairline divider
- `FadeIn` / `FadeUp` — framer-motion scroll-reveal wrappers

### 13.5 Bug-fix log (this session)

1. **Admin panel showed wrong email** — `AdminDashboard.jsx` had hard-coded `Parth Chauhan` / `chauhanparth165@gmail.com`. Replaced with `useAuth().currentUser`.
2. **`/ascension-project` page created** — full 13-section founder document built from the `.docx` source.
3. **Footer card on `/future`** added → links to `/ascension-project`.
4. **SpaceX font installed** at `public/fonts/SpaceX.ttf` + `@font-face`.
5. **Typography evolution**:
   - Initial: SpaceX everywhere
   - Then: SpaceX + small-caps experiments (`font-variant: all-small-caps`, `font-feature-settings: c2sc smcp`)
   - Final: SpaceX on display headings only (auto-lowercased), Inter on body (natural case)
6. **Theme overhaul**: dropped the purple/cyan gradient look; rebuilt both pages in pure SpaceX.com black/white editorial style.
7. **Rocket SVGs**: replaced playful animated illustrations with static monochrome technical schematics + engineering callouts.
8. **Overflow bug fixed**: long single words (`INTELLIGENCE`, `ASCENSION`) were spilling out of grid columns. Fixed with `min-w-0` on every `md:col-span-*`, `break-words`, `overflow-wrap: break-word`, and reduced heading clamp.
9. **Mono label readability**: bumped sizes (`text-[10px]` → `text-[12px]`, etc.) and trimmed letter-spacing (`tracking-[5px]` → `tracking-[3px]`).
10. **Logo alignment**: navbar and footer logos on `/future` now use the same outer container (`px-6 md:px-16 lg:px-24` + `max-w-7xl mx-auto`) so they sit at identical X-positions on desktop.
11. **Footer subtitle**: removed `SPACE PROGRAM · ` prefix; centered `EXPLORE INFINITE` under `INFINITE YATRA` to mirror navbar.

---

## 14. Where to Look When You Need To…

| Task | File(s) |
|------|---------|
| Add a new page / route | `src/pages/NewPage.jsx` + register in `src/App.jsx` |
| Add an admin tab | Add to `MENU_ITEMS` in `src/config/roles.js` + lazy-import in `AdminDashboard.jsx` |
| Change a payment provider | `src/services/PaymentService.js`, `razorpayService.js`, `paymentGateway.js` |
| Change AI prompt / model | `src/services/gemini.js`, `openai.js`, `groq.js` |
| Edit Firestore security | `firestore.rules` |
| Modify hosting / rewrites | `firebase.json` |
| Update fonts / global styles | `src/index.css` |
| Edit the Space program look | `src/pages/Future.jsx` |
| Edit the Ascension Project | `src/pages/AscensionProject.jsx` |
| Adjust admin role list | `src/components/auth/AdminRoute.jsx` + `src/context/RoleContext.jsx` |
| Add a Cloud Function endpoint | `functions/` |

---

## 15. Conventions

- **Naming**: PascalCase for components, camelCase for services & helpers.
- **Imports**: pages are eager-loaded for critical routes; admin sub-modules use `React.lazy(...)` and live behind `<Suspense>`.
- **State**: per-feature React Context where needed (`AuthContext`, `RoleContext`); local `useState` for component state. No Redux.
- **Animations**: framer-motion with the easing curve `[0.16, 1, 0.3, 1]` for SpaceX-like motion on `/future` and `/ascension-project`; `[0.21, 0.47, 0.32, 0.98]` elsewhere.
- **Forms**: native React state + Tailwind. `react-phone-input-2` for phone fields, `react-datepicker` for dates.
- **SEO**: every public page uses `<Helmet>` with `<title>` + `<meta name="description">` + optional OG tags.

---

## 16. Deployment Checklist

Before running `npm run deploy`:

- [ ] `.env` populated with production keys
- [ ] `firebase use <project-id>` points at the production Firebase project
- [ ] Lint passes: `npm run lint`
- [ ] Build is clean: `npm run build` (no errors)
- [ ] Manual smoke test of: `/`, `/future`, `/ascension-project`, `/admin` (logged in), one booking flow
- [ ] If Firestore rules changed: review them
- [ ] Commit + push the change to `main` first so the deploy is reproducible
- [ ] `npm run deploy`
- [ ] Verify the live site

---

## 17. Useful Commands Reference

```bash
# Run dev
npm run dev

# Build + deploy in one go
npm run deploy

# Deploy only hosting (fastest if you only changed React code)
npm run build && firebase deploy --only hosting

# Tail Cloud Function logs
firebase functions:log

# Open emulator (full stack)
firebase emulators:start

# Push to GitHub
git add -A
git commit -m "your message"
git push origin main
```

---

*Last updated: 2026-06-06 — keep this file alongside the codebase. When you change something architectural, update the relevant section.*
