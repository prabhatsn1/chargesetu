# Build Prompt: "ChargeSetu" — Community EV Charger Sharing App for India

> Copy everything below into Claude Code (or another AI coding agent) in an empty project folder to scaffold the full app. Replace `ChargeSetu` with your real app name if you want something different — it's used throughout, so a find-and-replace is enough.

---

## 1. What we're building

A peer-to-peer marketplace app, inspired by the UK's Co Charger, adapted for India: people who own a home EV charger ("**Hosts**") rent out idle charging time to nearby EV owners without home charging access ("**Chargees**"). Think Airbnb, but for EV chargers, India-first.

**Core value prop:** India has fast-growing EV adoption but very few public chargers and most apartment/urban dwellers have no off-street parking to install their own. Meanwhile many bungalow/independent-house owners have a 7kW/11kW home charger sitting idle 90%+ of the time. ChargeSetu connects the two, with in-app booking, timer-based billing, and UPI-native payments.

**Scope for this build: MVP only** — Host and Chargee roles. No fleet/taxi operator accounts, no business car park accounts, no council/planner dashboards in v1 (design the data model so these can be added later, but don't build the screens).

---

## 2. Tech stack (use exactly this unless a package is deprecated/broken, in which case pick the closest actively-maintained equivalent and note the substitution)

- **Framework:** Expo (SDK 51+), **Expo Router** for file-based navigation, TypeScript in strict mode throughout
- **Backend:** Firebase — Firestore (data), Firebase Auth (phone OTP + Google + Apple sign-in), Cloud Functions (Node/TypeScript, for payment webhooks, payout triggers, notifications), Firebase Storage (charger photos, verification docs), Firebase Cloud Messaging (push notifications)
- **Payments:** Razorpay — Razorpay Checkout for Chargee payments, **Razorpay Route** for split payments (platform commission + host payout), Razorpay's KYC/linked-account flow for Host payouts
- **Maps:** `react-native-maps` with the Google Maps provider (Google Maps Platform API key) — Mapbox coverage/pricing is worse for India, don't use it
- **State management:** Zustand (simple, no boilerplate) for client state; React Query (`@tanstack/react-query`) for all Firestore/Firebase reads so caching/loading/error states are consistent
- **Forms/validation:** `react-hook-form` + `zod`
- **Styling:** NativeWind (Tailwind for React Native) — define a small design-token file (colors, spacing) once, don't hardcode hex values in components
- **i18n:** `react-i18next`, English + Hindi at minimum, structure string files so more Indian languages can be added later
- **Notifications:** `expo-notifications` wired to FCM
- **Other:** `expo-image-picker` (photos), `expo-location` (map search/geofencing), `date-fns` (all date/time handling — India timezone IST only, no multi-timezone logic needed)

---

## 3. User roles (MVP)

1. **Chargee** — an EV owner looking to charge. Default role on first signup.
2. **Host** — someone who lists a home charger. A Chargee can *also* become a Host from the same account (one account, two capabilities, not two separate account types) — this matches how Co Charger works and avoids forcing people to juggle two logins.

No separate Admin app for MVP — handle moderation/disputes via a simple Firestore-backed internal screen gated behind a hardcoded admin UID list, or just via the Firebase console. Don't over-build this.

---

## 4. India-specific adaptations (important — don't default to the UK original's assumptions)

- **Currency:** INR only, formatted as `₹1,234`. Tax: show **GST** (not VAT) in the commission breakdown — assume 18% GST applies to the platform commission fee, not to the full transaction. Make the tax rate a constant/config value, not hardcoded inline, so it can be corrected without hunting through the codebase.
- **Billing model — read this carefully, it's the single biggest adaptation:** Most home chargers in India are **not smart/IoT-connected** (no OCPP, no remote metering). Co Charger's UK model likely leans on smart-plug metering for exact kWh billing. For this MVP, use **time-based billing** instead: Host sets an hourly rate (₹/hour), the Chargee starts a session in-app when they plug in, stops it when done, and billing = hourly rate × elapsed minutes. To build trust without hardware, require the Chargee to take a photo of their car's charge display (or the charger's display, whichever is visible) at start and end of session — stored in Firestore Storage, visible to the Host for dispute resolution. Make this explicit in the UI copy so both sides understand it's time-based, not energy-based.
- **Connector types:** Let Hosts specify connector type(s) their charger supports from this enum: `Type 2 AC`, `CCS2`, `Bharat AC-001`, `Bharat DC-001`, `GB/T` (used by some Chinese-origin EVs sold in India). Let Chargees filter search by the connector type their vehicle uses.
- **Identity verification:** Use Firebase Auth phone OTP as the baseline identity signal (Indian users trust OTP). For Host verification (since money/property is at stake), add a lightweight KYC step collecting Aadhaar-last-4-digits + a selfie, stored for manual review — don't build a full DigiLocker/UIDAI integration in MVP, just collect the data in a shape that makes adding real verification later straightforward.
- **Payouts:** Hosts link a bank account or UPI VPA via Razorpay's linked-account onboarding; payouts run through Razorpay Route automatically ~2-3 days after a session, with Razorpay's own KYC gate before first payout (don't try to replicate KYC logic yourself — let Razorpay's hosted flow handle it).
- **Language:** English + Hindi toggle in Settings, driven by `react-i18next`. Don't hardcode any user-facing string directly in a component — always go through the translation function, even for the English-only launch.

---

## 5. Core user flows to implement

### 5.1 Onboarding & Auth
- Splash → phone number entry → OTP verification (Firebase Auth) → optional Google/Apple sign-in as an alternative on the same screen → profile setup (name, photo, email optional) → role is implicit (every account can act as both; no "pick a role" gate)

### 5.2 Chargee flow
1. **Home/Map screen** — map centered on user's current location (via `expo-location`), pins for nearby active chargers, bottom sheet list view toggle, filters: connector type, max distance, price range, availability right now vs. later
2. **Charger detail screen** — photos, hourly rate, connector type(s), power rating (kW), host name/rating/verification badge, availability calendar, "Request to book" button
3. **Booking request** — pick a time slot (now or scheduled), see estimated cost (rate × estimated duration, clearly labeled as an estimate since real cost depends on actual session length), confirm
4. **Host accepts/declines** (push notification to Host; Host has a "Requests" tab)
5. **Active session screen** — once Chargee arrives and plugs in, they tap "Start charging," take the required photo, see a live running timer + live running estimated cost; tap "Stop charging" when done, take the end photo
6. **Payment screen** — Razorpay Checkout for the final amount, UPI/card/wallet options
7. **Rate & review** the Host after payment

### 5.3 Host flow
1. **"List my charger" wizard** — location (map pin, confirm/adjust), connector type(s), power rating, photos, hourly rate (show a **Rate Calculator** that suggests a rate based on a default 20% margin over a configurable baseline cost-per-kWh estimate, same spirit as Co Charger's calculator, but let the Host override it), availability schedule (recurring weekly hours, plus manual block-out dates), minimum session charge
2. **"My charger" management screen** — edit listing, pause/unpause availability, view upcoming bookings
3. **Incoming requests screen** — accept/decline with push notification round-trip
4. **Earnings dashboard** — list of completed sessions, amount earned per session (after commission), pending payout, payout history
5. **Session confirmation** — after a Chargee ends a session, Host gets a notification to review the reported duration/photos within a grace window; if they don't respond, auto-confirm after 24 hours (mirror Co Charger's "query" dispute pattern, but keep the MVP version to: confirm, or flag a dispute that goes to a simple admin review queue — don't build a full dispute-resolution UI beyond that)

### 5.4 Shared
- **Profile screen** — edit info, language toggle, linked payout account (Hosts), saved vehicle details (Chargees: EV model + connector type, prefilled into filters)
- **Ratings & reviews** — both directions (Host rates Chargee, Chargee rates Host), simple 1–5 stars + optional comment
- **Notifications center** — booking requests, approvals, session reminders, payment receipts, payout confirmations
- **Report/block user** — minimal flow, writes to a `reports` collection for manual review

---

## 6. Data model (Firestore — use this as the starting schema, adjust field names/types as needed but keep the collection structure)

```
users/{uid}
  - name, phone, email, photoUrl, languagePref
  - isHostVerified: boolean, hostVerificationDocUrl, hostVerificationStatus
  - vehicleModel, vehicleConnectorType (for Chargee use)
  - razorpayLinkedAccountId (for Hosts)
  - avgRatingAsHost, avgRatingAsChargee, createdAt

chargers/{chargerId}
  - hostId (ref users), location (GeoPoint), address
  - connectorTypes: string[], powerKw: number
  - hourlyRate: number, minSessionCharge: number
  - photos: string[], availabilitySchedule, isPaused: boolean
  - createdAt, updatedAt

bookings/{bookingId}
  - chargerId, hostId, chargeeId
  - requestedStart, requestedEnd (estimate), status: 'pending'|'accepted'|'declined'|'cancelled'|'completed'
  - createdAt

sessions/{sessionId}
  - bookingId, chargerId, hostId, chargeeId
  - startedAt, endedAt, startPhotoUrl, endPhotoUrl
  - durationMinutes, hourlyRateAtBooking, totalAmount, commissionAmount, gstAmount, hostPayoutAmount
  - paymentStatus: 'pending'|'paid'|'failed', razorpayPaymentId
  - hostConfirmationStatus: 'auto_confirmed'|'confirmed'|'disputed'
  - createdAt

reviews/{reviewId}
  - sessionId, fromUid, toUid, rating, comment, direction: 'host_to_chargee'|'chargee_to_host'
  - createdAt

reports/{reportId}
  - reportedBy, reportedUser, sessionId (optional), reason, status: 'open'|'reviewed'
  - createdAt
```

---

## 7. Project structure

```
app/                      # Expo Router routes only — thin screens, no business logic
  (auth)/
  (tabs)/
    index.tsx             # Chargee map/home
    host.tsx              # Host dashboard
    bookings.tsx
    profile.tsx
  charger/[id].tsx
  booking/[id].tsx
  session/[id].tsx
features/
  auth/
  chargers/
  bookings/
  sessions/
  payments/
  reviews/
components/                # shared presentational components
services/
  firebase.ts
  razorpay.ts
  notifications.ts
store/                     # Zustand stores
types/
i18n/
  en.json
  hi.json
config/
  constants.ts             # commission %, GST %, default margin %, etc. — single source of truth
```

---

## 8. Build order (build and get each phase working/testable before moving to the next — don't try to generate everything in one shot)

1. Expo project scaffold, TypeScript config, NativeWind setup, folder structure, navigation skeleton with placeholder screens
2. Firebase project wiring (config, Auth phone OTP + Google/Apple sign-in, Firestore rules skeleton)
3. Profile/onboarding flow end to end
4. Host: list-a-charger wizard + charger CRUD + map pin creation
5. Chargee: map search, filters, charger detail screen
6. Booking request/accept/decline flow with push notifications
7. Active session flow (start/stop, photos, live timer/cost)
8. Razorpay integration: checkout for Chargee payment, Route split payout setup for Hosts, Cloud Function webhook to update `sessions` on payment success/failure
9. Ratings/reviews, earnings dashboard, notifications center
10. Hindi translations, polish, empty states, error states, loading skeletons

For each phase, also write basic Firestore security rules covering the collections touched in that phase — don't leave rules wide open and fix them at the end.

---

## 9. Explicit non-goals for this build (to keep scope sane)

- No fleet/taxi/business/council accounts or dashboards
- No real IoT/smart-meter integration — time-based billing only, as described in §4
- No in-app chat beyond what's needed for booking coordination (a simple text thread per booking is fine if you want one, but don't build a full messaging product)
- No multi-currency, no multi-timezone handling
- No web version — Expo app (iOS + Android) only

---

## 10. What to deliver

A working Expo project that runs via `npx expo start`, with the phases in §8 implemented in order, Firestore security rules for every collection in §6, a `.env.example` listing every required API key (Firebase config, Google Maps API key, Razorpay key), and a `README.md` explaining setup steps (Firebase project creation, Razorpay test account, Google Maps API key) since none of those can be pre-filled for me.
