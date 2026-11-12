# Student Dues — app prompt and change history

Part 1 is a complete prompt that describes the app as it is today. Paste it into an AI coding tool, or give it to a developer, to rebuild or extend the app.
Part 2 lists every change made since the first build, in order.

---

## Part 1 — The prompt

> Build **Student Dues**, an iPhone and Android app for a stationery and general shop inside a hostel at **IIT Guwahati**. The shopkeeper uses it to record what students (and off-campus visitors) owe, collect payments, and send reminders.
>
> ### Tech
> - **Expo SDK 57** with React Native and TypeScript, so it opens in the App Store and Play Store builds of **Expo Go**. Use only modules that ship in Expo Go.
> - No backend yet. Store everything on the device with AsyncStorage: settings, the signed-in account, the shop's hostel, added hostels, and the ledger of students, dues and payments.
> - Fonts: **Inter Tight** for headings and numbers, **Inter** for text, **Noto Sans Bengali** for Assamese.
> - It must also run in a web browser (used for a shareable preview inside an iPhone 16 frame).
>
> ### Design language: "Clear Blue"
> - **Colours (light):** primary #2B4CFF, primary soft #E8ECFF, paid green #11803A, pending amber #9A5B00 on #FFF0D6, overdue red #C2261B on #FDE6E3, text #0B0F19, secondary text #566070, ground #F2F4F7, surfaces #FFFFFF.
> - **Colours (dark):** primary #3D57FF, ground #0A0C10, surface #151922, text #F3F5F9, paid #4ACB7C, pending #F3B353, overdue #FF8076.
> - **Meaning:** blue is for actions, green only for money received or something done, amber for pending, red for overdue (more than 14 days) or errors.
> - **Words:** titles are at most 2 words, supporting text at most 4–5 words, and each screen leads with one big number.
> - **Onboarding screens:** a deep navy-to-black radial background, glass (frosted) panels, uppercase heavy headings.
> - **Home:** a blue gradient.
> - **Shape:** rounded cards (22–24 px corners), 56 px pill buttons, at least 44 px touch targets, no visible scrollbars.
> - **Settings:** a theme setting (Light, Dark, System) and a text-size slider with three steps (1.00×, 1.12×, 1.25×) that scales every label.
> - **Languages:** English and Assamese (অসমীয়া).
>
> ### Animations
> All animations run on the native animation thread and turn off when the phone's Reduce Motion setting is on.
> - **Entrances:** content rises in, numbers pop in, cards float gently.
> - **Glows:** pulse slowly behind key elements.
> - **Scanner:** a laser line sweeps across the scan frame.
> - **Inputs and sheets:** the caret blinks in amount fields, and sheets slide up.
> - **Navigation:** screens slide in from the side they came from (300 ms), with an iOS-style swipe from the left edge to go back.
> - **Controls:** buttons shrink slightly with a spring when pressed; tab and segmented-control highlights slide between options.
> - **Feedback:** toasts spring up from the bottom; haptics on key presses, saves and warnings.
>
> ### Screens and flows
> 1. **Splash.**
>    - **Background:** black, with a soft deep-navy radial glow.
>    - **The coin:** a chrome coin flips in. The flip is drawn flat, by squashing and mirroring the coin horizontally, not as a 3D rotation.
>    - **The logo:** inside the coin, a barcode-and-tick logo builds itself: the bars grow, a green dot pops, then a tick draws.
>    - **Supporting effects:** the coin's glow and shadow stay still under it and fade in; a light sheen sweeps across the coin; two radar rings pulse once as it lands, then stop.
>    - **Text:** "Student Dues / Student dues, organised."
>    - **Slide to start:** at the bottom, a frosted navy pill with a white knob holding a blue arrow, and a "Slide to start ›››" label.
>      - **Hints:** the three arrows light up in a ripple, and the knob nudges right every couple of seconds.
>      - **Dragging:** the pill fills with the blue gradient and the label fades.
>      - **Finishing:** past 75% (or a fast flick past 40%) the knob snaps to the end, turns green with a tick, the phone buzzes, and the app starts. Release earlier and it springs back.
>      - **Screen readers:** it works as a button.
> 2. **Intro 1 "Scan & find"** and **Intro 2 "Remind & collect".** Story-style progress bars, a mini phone mock-up, a floating card, Continue/Get started, Log in, and Skip.
> 3. **Choose language.** English or অসমীয়া.
> 4. **Sign up / Log in** (one screen with a toggle).
>    - **Sign up:** full name, email, password and confirm password, with a show/hide eye and inline errors ("Enter your name", "Enter a valid email, like name@gmail.com", "Use at least 8 characters", "Passwords don't match").
>    - **Log in:** email and password ("No account with this email", "Wrong password. Try again.").
>    - **Account storage:** accounts live on the device. Passwords are stored only as a salted SHA-256 hash.
>    - **Other sign-in methods:** a row of buttons below, "or continue with" **Apple · Google · Phone**, showing the real Apple and Google logos.
>      - **Apple:** opens the native Sign in with Apple sheet on iPhone.
>      - **Google:** runs real Google OAuth (a popup on the web, a sign-in sheet on iPhone and Android) using client IDs from `.env.local`. Without IDs, or inside Expo Go (which Google blocks), it says why and continues as a demo.
>      - **Phone:** goes to a mobile number screen, then a 6-digit code screen with its own keypad and a 24-second resend countdown. The code is a demo, so any 6 digits are accepted.
>    - **Try demo:** skips sign-in.
>    - **Where sign-in leads:** logging in by any method never asks for a name. Signing up asks for a name only if the method didn't provide one.
> 5. **Your name.** Large initials avatar and a name field. Shown only when sign-up needs it.
> 6. **Choose hostel.** Shown after every sign-up and log-in.
>    - **Hostel list:** the 13 IIT Guwahati hostels (Barak, Brahmaputra, Dhansiri, Dibang, Dihing, Disang, Kameng, Kapili, Lohit, Manas, Siang, Subansiri, Umiam), with search.
>    - **Add new hostel:** tidies capitalisation, blocks duplicates, and marks the hostel "Added by you".
>    - **Profile → Hostel:** opens the same screen to switch hostel.
>    - **Where it's used:** "*Hostel* Hostel Shop", reminder messages, and the student hostel picker.
> 7. **Overview tab.**
>    - **Greeting and total:** "Good morning *Name* 👋", then Total outstanding as a big number that counts up.
>    - **Glass card:** "N students owe", plus Pending and Overdue rows. Each opens the filtered Students list.
> 8. **Students tab.** Search by name, ID, room, city or phone; filter chips All, Pending, Overdue and Settled with counts; rows show avatar, name, "Hostel · Room" (or "Visitor · City"), amount and a status chip; an empty "No match" state.
> 9. **Profile tab.**
>    - **Header:** the owner, their shop's hostel, and how they signed in (for example "Email · name@gmail.com").
>    - **Display settings:** theme, a text-size slider with a live preview, and language.
>    - **Account and data:** the Hostel row, Reset demo, and Sign out.
> 10. **Floating tab bar** (Overview, Students, Profile) with a separate round **Scan** button.
> 11. **Scan.**
>     - **The scanner:** the live camera reads the barcode on the ID card. The barcode contains **only the student ID**. There is also a torch button.
>     - **A saved ID** opens that student's **profile directly**, with a "Name · ₹X due" toast.
>     - **A new ID** opens **New student** with the ID filled in.
>     - **An unreadable barcode** shows "Can't read", with Try again and **Enter ID manually**.
>     - **Camera refused:** "Camera off" with Open Settings.
>     - **Demo chips:** Saved student, New ID, Unreadable and No camera.
>     - **Bottom buttons:** **Search** and **Visitor**.
> 12. **New student.**
>     - **Student ID:** always editable, 6–12 digits. If the ID is already saved, it shows "Already saved" and the main button becomes **Open *Name*'s profile**.
>     - **Other fields:** full name, hostel chips, room and phone.
>     - **Saving:** "Save & add due".
> 13. **Visitor.** For someone from off campus with no ID card.
>     - **Fields:** only full name, phone (+91, 10 digits) and city.
>     - **Duplicates:** a phone number that's already saved offers that person's profile instead of creating a duplicate.
>     - **After saving:** goes to Add due. Visitors appear as "Visitor · City" and can have their name, phone and city edited.
> 14. **Student profile.**
>     - **Header:** a blue gradient header with the balance as the big number and a status chip.
>     - **Actions:** Add due, Receive Payment (disabled when nothing is owed) and Remind.
>     - **Totals:** Total dues and Total paid.
>     - **History:** each entry shows the balance left after it, and a new entry is highlighted.
>     - **Edit details:** for a student, name, ID and phone are locked and only hostel and room can change; for a visitor, name, phone and city are editable.
> 15. **Add due / Receive Payment.**
>     - **Amount entry:** a big amount with a blinking caret, its own keypad (including 00 and delete), quick amounts (₹20/50/100/200, or Full/Half/₹100), and UPI or Cash for payments.
>     - **Note:** an optional note on dues.
>     - **Summary:** what is owed now, the change, and the result.
>     - **Rules:** a payment can't exceed the balance; a due is capped at ₹10,000. The amount bumps on each key and shakes, with a warning buzz, when over the limit.
>     - **After saving:** you return to the profile with a toast.
> 16. **Remind sheet.** A bottom sheet with **WhatsApp** (opens with a pre-filled message containing the balance) and **Call**. Drag down or tap outside to close. The toast says "opened", never "sent".
>
> ### Small rules
> - Tapping outside a text field closes the keyboard on every form, and the Next key moves between fields.
> - Balances are always calculated from the entries.
> - Sample data: 12 Kameng students, with Ankur Bora (ID 230101015, ₹380 owed) as the demo student.

---

## Part 2 — Every change, in order

1. **First build.** Built all 20 screens from the "Student Dues — iOS app" design canvas in Expo and React Native, with every design animation ported. Included dark mode, three text sizes and Assamese.
2. **Real barcode scanning.** Added expo-camera, torch control and camera permission handling, keeping the demo chips for testing.
3. **Code quality.** Set up the linter and fixed all 96 errors it found (mostly how animations were wired); behaviour was unchanged.
4. **GitHub.** Connected the project to `PrathamBhawar/Kameng-Student-stationary-due-` and merged that repository's first commit.
5. **Expo SDK 58 → 57.** The App Store version of Expo Go only supports SDK 57, so every package was moved down to match.
6. **Web preview.** Built a browser version and published it as a preview page, later shown inside a scalable iPhone 16 frame.
7. **Coin and colours match the design on every platform.** Redrew the chrome coin as a single SVG and fixed the elliptical gradients, which browsers and iPhone drew differently.
8. **Real Apple and Google sign-in.** Apple uses the native sheet; Google uses OAuth once client IDs are added. The signed-in account shows on Profile, and error toasts use a warning icon. Set the Android package name.
9. **Email sign-up and log-in.**
   - **The forms:** sign up with name, email, password and confirm; log in with email and password. Passwords are stored as hashes.
   - **Other methods:** Apple, Google and Phone moved into a row with their logos.
   - **Fewer steps:** logging in skips the name screen.
10. **Splash fixes.** Removed a blue patch in the top-left corner. The radar rings now pulse twice and stop instead of looping.
11. **Keyboard.** Tapping outside a text field closes the keyboard on every form.
12. **Choose hostel.** Added the screen after sign-in, with the 13 IIT Guwahati hostels and Add new hostel, plus switching from Profile.
13. **Unreadable barcode.** Added "Enter ID manually", with a check for IDs that are already saved.
14. **Splash glow and coin flip.**
    - **The glow:** now fades the way the design's CSS shadow does: softer and deeper navy, without a muddy midpoint.
    - **The coin flip:** drawn flat instead of in 3D, which stops iPhone covering half the coin in blue.
15. **Student ID always editable** on New student.
16. **Slide to start.** Replaced "Tap to start" on the splash screen with an animated slide-to-start control.
17. **Scan opens the profile.** A saved ID goes straight to the student's profile; a new ID opens the New student form with the ID filled in.
18. **Visitors.** Added visitors from off campus (name, phone, city) with duplicate-phone detection and editing, and made search match city and phone.

## Still to do
- **A backend** (for example Firebase or Supabase), so accounts and the ledger sync across devices.
- **Google client IDs.** Create them in Google Cloud and put them in `.env.local`; see README → "Google sign-in".
- **A proper installed build** (EAS), so Google sign-in works and the app can go to the App Store and Play Store.
