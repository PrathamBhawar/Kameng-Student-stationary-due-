# Student Dues — iOS app

Expo (React Native + TypeScript) implementation of the "Student Dues — iOS app" design canvas (Clear Blue design language).

## Run on an iPhone

```bash
npm install
npx expo start        # scan the QR code with the Camera app → opens in Expo Go
npx expo start --ios  # or the iOS Simulator (macOS)
```

Every dependency ships in Expo Go, so no custom native build is needed.

## Structure

- `App.tsx` – font loading, providers
- `src/store.tsx` – app state, navigation stack, actions (balances, payments, dues, toasts); prefs + ledger persisted with AsyncStorage
- `src/anim.tsx` – the design's `data-anim` keyframes (rise, pop, float, fill, glow, laser, blink, sheet, coin, bar, tick, ring, sheen) on the native-driver Animated API; honours Reduce Motion
- `src/Navigator.tsx` – stack transitions, iOS edge-swipe back, tab bar, Remind sheet, toast
- `src/screens/` – Onboarding (splash → name), Home (overview, students, profile), StudentScreens (profile, edit, add due / receive payment), ScanScreens (scan, found, new student)
- `src/theme.ts`, `src/i18n.ts`, `src/data.ts` – tokens, English/Assamese strings, seed data and money helpers

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
