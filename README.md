# ChargeSetu

A peer-to-peer marketplace for sharing home EV chargers in India — Hosts list idle charging
time, Chargees book and pay for it. See [ChargeSetu_Expo_Build_Prompt.md](./ChargeSetu_Expo_Build_Prompt.md)
for the full product spec this app was built from.

**Status:** all 10 build phases are implemented and the app/functions typecheck cleanly, but
nothing has been run against a real Firebase/Razorpay/Google Maps project — you'll need to
wire up your own accounts and keys before it does anything useful. None of those can be
pre-filled for you, so follow the steps below in order.

## Tech stack

Expo (React Native, TypeScript strict) + Expo Router, NativeWind, Zustand, React Query,
`react-hook-form` + `zod`, `react-i18next` (English/Hindi). Backend is Firebase (Auth,
Firestore, Storage, Cloud Messaging, Cloud Functions). Payments are Razorpay (Checkout +
Route for split payouts). Maps are Google Maps via `react-native-maps`.

One deliberate substitution from the original spec: **Auth, Firestore, Storage, and
Messaging use `@react-native-firebase` (the native SDK) instead of the `firebase` JS SDK.**
The JS SDK's phone-OTP flow needs a reCAPTCHA WebView verifier, and the only Expo package for
that (`expo-firebase-recaptcha`) hasn't been updated since 2022 — too stale to trust on this
SDK's New Architecture. `@react-native-firebase` gives native phone auth with no reCAPTCHA
dependency. The cost: this app needs a custom dev client (EAS build or `expo run:ios`/`expo
run:android`) and **cannot run in Expo Go** — true anyway because of `react-native-razorpay`,
which is also a native module.

## 1. Firebase project

1. Create a project at [console.firebase.google.com](https://console.firebase.google.com).
2. Add an **Android app** (package name `com.chargesetu.app` — matches `app.config.ts`) and
   an **iOS app** (bundle ID `com.chargesetu.app`). Download `google-services.json` and
   `GoogleService-Info.plist` and place them at the **project root** (same folder as this
   README) — `app.config.ts` already points at those filenames and they're gitignored.
3. **Authentication** → Sign-in method: enable **Phone**, **Google**, and **Apple**.
   - For Google: note the **Web client ID** from the auto-created "Web client (auto created by
     Google Service)" OAuth client — you'll need it below.
   - For Apple: you'll also need an Apple Developer account with "Sign in with Apple" enabled
     on your App ID (iOS only; the app already hides the Apple button on Android).
4. **Firestore Database**: create it (any region close to your users — `asia-south1` for
   India). Rules and composite indexes are already written in this repo (`firestore.rules`,
   `firestore.indexes.json`) — deploy them once you have the Firebase CLI set up (step 5).
5. **Storage**: create the default bucket (used for charger photos, charge-display photos,
   and profile pictures).
6. **Cloud Messaging**: no setup needed beyond the apps you registered in step 2 — this app
   uses native FCM tokens via `@react-native-firebase/messaging`, not Expo's push service.
7. Install the Firebase CLI and log in, then link this repo to your project:

   ```bash
   npm install -g firebase-tools
   firebase login
   firebase use --add   # pick the project you just created
   ```

8. Deploy Firestore rules/indexes:

   ```bash
   firebase deploy --only firestore:rules,firestore:indexes
   ```

9. For the internal moderation/admin flow (§3 of the build prompt — no separate admin app in
   MVP), replace `REPLACE_WITH_ADMIN_UID_1` in `firestore.rules` with your own Firebase Auth
   UID, or just moderate via the Firebase console instead.

## 2. Google Maps Platform (for `react-native-maps`)

1. In [Google Cloud Console](https://console.cloud.google.com), using the **same project**
   Firebase created, enable **Maps SDK for Android** and **Maps SDK for iOS**.
2. Create an API key restricted to those two APIs.
3. Set it as `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` (see "Environment variables" below).

## 3. Razorpay

1. Create an account at [razorpay.com](https://razorpay.com) and switch to **Test Mode**
   while developing.
2. Dashboard → Settings → API Keys: generate a test **Key ID**/**Key Secret**.
   - `EXPO_PUBLIC_RAZORPAY_KEY_ID` (client env var) and the Cloud Functions secrets
     `RAZORPAY_KEY_ID`/`RAZORPAY_KEY_SECRET` (step 5 below) all come from here.
3. **Route** (split payments to Hosts) needs Route enabled on your account — ask Razorpay
   support to enable it on a test account if it isn't already. `createRazorpayLinkedAccount`
   (`functions/src/payments.ts`) creates a linked account per Host; Razorpay's own hosted KYC
   review decides when that account can receive payouts — this app does not (and per the
   build prompt, should not) reimplement that review process.
4. Dashboard → Settings → Webhooks: add a webhook pointing at your deployed
   `razorpayWebhook` function's URL (shown after `firebase deploy --only functions`), subscribed
   to `payment.captured`, `payment.failed`, `account.activated`, `account.under_review`,
   `account.needs_clarification`, and `account.rejected`. Copy the **webhook secret** Razorpay
   generates — that's `RAZORPAY_WEBHOOK_SECRET` below.
5. Set the three Cloud Functions secrets (these are server-side only, never bundled into the
   client):

   ```bash
   firebase functions:secrets:set RAZORPAY_KEY_ID
   firebase functions:secrets:set RAZORPAY_KEY_SECRET
   firebase functions:secrets:set RAZORPAY_WEBHOOK_SECRET
   ```

## 4. Environment variables (client)

This repo's `.env.example` couldn't be written by the assistant that built it (blocked by a
local tool permission rule on `.env*` files) — create `.env.local` yourself at the project
root with:

```
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=
EXPO_PUBLIC_RAZORPAY_KEY_ID=
EXPO_PUBLIC_GOOGLE_SIGNIN_WEB_CLIENT_ID=
GOOGLE_SIGNIN_IOS_URL_SCHEME=
```

- `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` — from §2 above.
- `EXPO_PUBLIC_RAZORPAY_KEY_ID` — from §3 above (test Key ID).
- `EXPO_PUBLIC_GOOGLE_SIGNIN_WEB_CLIENT_ID` — the Web client ID from §1.3.
- `GOOGLE_SIGNIN_IOS_URL_SCHEME` — only needed for iOS builds: the **reversed client ID** of
  the iOS OAuth client Firebase creates for Google Sign-In (Firebase console → Authentication
  → Sign-in method → Google → expand for the iOS client, or Google Cloud Console →
  Credentials). Looks like `com.googleusercontent.apps.XXXXXXXXXXXX`. Until you set this,
  `app.config.ts` falls back to a placeholder so `expo prebuild`/`expo install` keep working —
  Google Sign-In on iOS just won't work until you replace it.

`google-services.json` and `GoogleService-Info.plist` (from §1.2) are read directly by
`app.config.ts`, not via env vars.

## 5. Running the app

Because of the native modules (`@react-native-firebase/*`, `react-native-razorpay`,
`react-native-maps`, `@react-native-google-signin/google-signin`), this needs a dev client —
Expo Go won't load it.

```bash
npm install
npx expo prebuild        # generates ios/ and android/ from app.config.ts
npx expo run:ios         # or: npx expo run:android
```

(Or build a dev client with EAS instead of `expo run:*` if you prefer cloud builds.) Once a
dev client is installed on your simulator/device, `npx expo start` reconnects to it for fast
refresh on subsequent runs.

## 6. Cloud Functions

```bash
cd functions
npm install
npm run build
cd ..
firebase deploy --only functions
```

`functions/src/index.ts` exports: booking-created/status-change push notifications,
session-ended confirmation push + an hourly auto-confirm scheduler (24h grace window per
§5.3.5), the Razorpay order/linked-account callables, the Razorpay webhook, and the
review-created rating recalculation trigger.

## Project structure

```
app/            Expo Router routes — thin screens, business logic lives in features/
features/       auth, chargers, bookings, sessions, payments, reviews, reports, notifications
components/     shared presentational components (Button, Screen, ErrorView, ...)
services/       firebase.ts, razorpay.ts, notifications.ts, functions.ts, storageUpload.ts
store/          Zustand stores (auth, phone-auth-in-progress, charger search filters)
types/          shared TypeScript types mirroring the Firestore schema
i18n/           en.json / hi.json + react-i18next setup
config/         constants.ts — commission %, GST %, connector types, etc. (single source of truth)
functions/      Firebase Cloud Functions (own package.json/tsconfig, not part of the Expo build)
```

## Known gaps / what to check before you rely on this

- **Nothing has been run against live services.** Typechecking and lint are clean, and a web
  export (before native-only packages were added in phase 4) bundled successfully, but there's
  no simulator/device in this environment to verify Firebase Auth, Firestore rules, Razorpay
  Checkout, or push notifications actually work end-to-end. Test the golden path (sign up →
  list a charger → book → start/stop a session → pay → review) on a real device first.
- Razorpay Route's linked-account creation (`createRazorpayLinkedAccount`) was written against
  Razorpay's REST API shape as documented — it hasn't been exercised against a live Razorpay
  test account, since that requires the account/keys from §3 above.
- The Host "pending payout" / "payout history" split described in the build prompt isn't
  tracked separately from "completed, paid sessions" — Razorpay Route's automatic ~2–3 day
  payout timing isn't reflected back into Firestore (no settlement webhook wired up), so the
  earnings dashboard shows per-session payout amounts rather than an actual payout ledger.
