# Kameng Student Stationary Dues — iOS app

Expo (React Native + TypeScript) implementation of the "Student Dues — iOS app" design canvas (Clear Blue design language).

## Run on an iPhone

```bash
npm install
npx expo start        # scan the QR code with the Camera app → opens in Expo Go
npx expo start --ios  # or the iOS Simulator (macOS)
```

Uses Expo SDK 57 (the version the App Store Expo Go supports). Every dependency ships in Expo Go, so no custom native build is needed.

## Structure

- `App.tsx` – font loading, providers
- `src/store.tsx` – app state, navigation stack, actions (balances, payments, dues, toasts); prefs + ledger persisted with AsyncStorage
- `src/anim.tsx` – the design's `data-anim` keyframes (rise, pop, float, fill, glow, laser, blink, sheet, coin, bar, tick, ring, sheen) on the native-driver Animated API; honours Reduce Motion
- `src/Navigator.tsx` – stack transitions, iOS edge-swipe back, tab bar, Remind sheet, toast
- `src/screens/` – Onboarding (splash → name), Home (overview, students, profile), StudentScreens (profile, edit, add due / receive payment), ScanScreens (scan, found, new student)
- `src/theme.ts`, `src/i18n.ts`, `src/data.ts` – tokens, English/Assamese strings, seed data and money helpers

## Sign-in

- **Apple**: on iPhone, *Continue with Apple* opens the real Sign in with Apple sheet (works in Expo Go). On Android and web it continues as a demo account.
- **Phone**: the code step is a demo; any 6 digits are accepted.
- **Google**: opens Google's real account sign-in (a popup on the web, a sign-in sheet on iPhone/Android), then pre-fills your name and shows your email on Profile. It needs Google OAuth client IDs, and Google doesn't allow sign-in inside Expo Go, so it runs on the **web** and in an **installed build** (`npx expo run:ios` / `run:android` or an EAS build). Until it's set up, the button says so and continues as a demo.

### Setting up Google sign-in

1. Go to <https://console.cloud.google.com>, create a project, then **APIs & Services → OAuth consent screen** and fill in the app name and your email.
2. **APIs & Services → Credentials → Create credentials → OAuth client ID**, and create the ones you need:
   - **Web application**: add `http://localhost:8081` (and your web address) under *Authorised JavaScript origins* and *Authorised redirect URIs*.
   - **iOS**: bundle ID `com.studentdues.app`.
   - **Android**: package `com.studentdues.app` plus your signing key's SHA-1 (`npx eas-cli credentials` shows it).
3. Copy `.env.example` to `.env.local` and paste the client IDs in.
4. Restart with `npx expo start --clear`.

## Android

The same code runs on Android: `npx expo start`, then scan the QR code with the **Expo Go** app from the Play Store. The Android package name is set to `com.studentdues.app` in `app.json`.

## Scanning

On an iPhone the Scan screen uses the real camera (`expo-camera`) and reads the barcode on the student's ID card (Code 128/39/93, Codabar, EAN, UPC, ITF, QR, PDF417, Data Matrix). The digits in the barcode are the student ID:

- a known ID opens **Student found**;
- an unknown ID opens **Not found → Add student**, pre-filled with the scanned ID;
- anything that isn't a 6–12 digit ID shows **Can't read**.

The torch button drives the real flashlight. If camera access is refused, the screen shows **Camera off → Open Settings**. The Demo chips (Success / Unreadable / Not found / No camera) still work for trying the flows without an ID card, and the web preview always uses the illustrated card.

## Checks

```bash
npx tsc --noEmit
npx expo lint
```
