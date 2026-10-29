# Mobile UI/UX refinement

## Audit and scope

The starting application had working Supabase signup/login/recovery, interests,
verification submission, and a minimal shared home. Its screens were largely
single-column stacks with no account-specific tab navigation. The audit covered
every route and the reusable/legacy components under `apps/mobile/src`.

The general-user and patient mockups in Downloads were inspected. The refinement
keeps their calm blush/burgundy/white direction and screen hierarchy without
copying sample patient data, clinical values, appointment times, or review-time
promises. New artwork adapts the project's existing heart/mother vector mark.

| Problem | Implemented change |
| --- | --- |
| Arbitrary gaps and inconsistent text sizes | Shared spacing, typography, radius, and color tokens |
| All forms vertically centered with generic titles | Top-aligned layouts, purposeful titles, descriptions, and a consistent back control |
| One shared home and no bottom navigation | Guest/general and verified-patient tab sets with distinct home content |
| Forms showed one broad validation message | Required indicators, hints, and field-specific errors |
| Busy controls could be submitted twice rapidly | Ref-based submission lock plus busy/disabled feedback |
| Verification status refresh had unmanaged async callbacks | Central account provider with cancellation and identity scoping |
| Previously saved interests appeared unchecked | Interest selection initializes from backend preferences |
| Returning to onboarding discarded identity/contact details | In-memory draft scoped to the current account; no shared password draft |
| Education was an unavailable placeholder | Searchable, categorized, attributed WHO resource links and device-local bookmarks |
| Patient appointments were unavailable | Read-only, authenticated own-patient endpoint and appointment views |
| Expo artwork remained configured | Branded launcher, adaptive/monochrome, splash, and favicon assets |
| Legacy components retained starter branding and inaccessible controls | Compatibility wrappers, corrected theme overrides, disclosure semantics, and SSR-safe color-scheme subscription |

## Screens and navigation

All existing authentication/onboarding routes were refined: welcome, account
selection, existing/new-patient selection, registration, sign-in, password help,
secure-link callback, password reset, interests, verification intake, and
verification status. Added an onboarding-complete screen and account settings.

New routes under `src/app/(tabs)`:

- `dashboard`: greeting, account feedback, education discovery, clinic request
  status, and verified-patient care information where available.
- `learn`: resource/category search, external WHO links, optional saved-only view.
- `clinic`: configurable public contact/location details and patient-request entry.
- `community`: clear unavailable state and community/privacy guidance; no fake posts.
- `profile`: guest sign-in choices or authenticated account type, interests,
  bookmarks, verification status, settings, and logout.
- `records`: verified-patient category navigation with an explicit unavailable
  digital-documents state, not a claim that no records exist.
- `appointments`: verified-patient actual upcoming/past visits, Manila times,
  status labels, retry/refresh, and clinic contact information.

Guests/general users have Home, Learn, Clinic, Community, Profile. Backend-verified
patients have Home, Records, Appointments, Learn, Profile. Staff accounts get no
patient privileges and are directed to the staff portal for clinic operations.
The longer Appointments tab becomes **Visits** on narrow screens or larger text
settings, with the accessibility label still **Appointments**.

Expo Router `Stack.Protected` removes completed authentication screens from
history. Patient tabs use `Tabs.Protected`; this is a navigation convenience,
not authorization. Backend checks still protect actual patient data. The old
`/home` and `/explore` entries remain compatible through redirects. Tabs use
history-aware back behavior; native stack gestures remain enabled. A missing
back history falls back to Home rather than trapping the user.

Account refresh retains the current user's established navigation while loading,
then applies the server's updated account type. Results are canceled/scoped by
identity so another account cannot inherit cached patient details. A late session
restore cannot reopen an account after logout. Drafts and bookmark view state
are remounted when the authenticated identity changes.

## Shared design and accessibility

`constants/brand.ts` now defines the 4-point spacing scale (4, 8, 12, 16, 24, 32,
40, 48), semantic colors, radii, and typography. Screens use 24px horizontal
padding, consistent 24px section gaps, a maximum 520px content width, and a
well-supported native/system font. Heading sizes are 26/30px, section headings
20px, card titles 17px, body 16px, secondary text 14px, captions 12px.

`components/care-ui.tsx` provides Screen, Heading, Button, TextAction, Field,
Notice, Loading, EmptyState, SelectionCard, Checkbox, Progress, Brand, and CareArt.
Other reusable components are CareIcon, AppTabs, ResourceCard, AppointmentCard,
ClinicInfo, and AccountFeedback. Existing themed components now share the brand
direction rather than requiring duplicated screen-specific fixes.

Inputs/buttons use minimum heights rather than fixed text containers. Body and
form text retain font scaling; long labels wrap. Password visibility and back
controls have accessible labels. Choice controls expose radio/checkbox states;
progress, loading, errors, and save feedback use appropriate status semantics.
Important statuses are written in text and do not rely on color. Contrast tests
check body, primary, success, and error colors against their actual backgrounds.

Navigation labels cap scaling at 1.25 to fit five touch targets; the wordmark
caps at 1.3 to preserve its lettering. These caps do not apply to form/body text.
The tab bar accounts for safe-area and text scaling, hides for the keyboard, and
uses visible active colors/icons. The shared screen handles safe areas, scrolling,
keyboard dismissal, and iOS keyboard avoidance. Native stack transitions follow
the system reduced-motion setting; press feedback does not require motion.

## Data, privacy, and availability

Existing signup, login, PKCE email callback, recovery, preference saving, and
verification endpoints were preserved. Account selection and signup metadata
only influence onboarding destinations; they never assign a patient role.

Added `GET /api/v1/account/care` in `apps/api/src/routes/account.ts`. It requires
the existing JWT middleware, a backend `patient` profile, and a patient record
linked to that authenticated profile. It accepts no patient identifier from the
caller. It returns the patient's own appointment summary, up to 100 records,
prioritizing the next active visits. Protected account responses use `no-store`.
No migration, database content, or RLS policy was changed. No live database was
used for this refinement's tests, and the staff web portal source was untouched.

Education resources are links to verified public WHO pages: maternal health,
family planning, nutrition, and mental health. Source labels and external-link
behavior are visible. The app does not invent reading times, videos, clinical
articles, personalized medical advice, or resource recommendations based on
assumed conditions. A topic match only changes resource ordering.

Authenticated users can bookmark resources on their current device. Native
bookmarks use the existing SecureStore dependency; web uses localStorage. Each
storage key is scoped to the account. These are public-resource IDs only, not
patient records, and they do not sync across devices. Guest bookmark actions lead
to sign-in. Failed reads/writes have visible messages.

Medical records, pregnancy measurements, monitoring, online booking/rescheduling,
push notifications, localization, and community posting remain unavailable.
Screens explain this in everyday language. The app does not display made-up
clinic statistics, care schedules, pregnancy values, or notification badges.

Optional public clinic fields in `.env.example`:

```dotenv
EXPO_PUBLIC_CLINIC_PHONE=
EXPO_PUBLIC_CLINIC_ADDRESS=
```

Only publish clinic-confirmed values. If omitted, the app says the details are
not available. It does not invent a clinic location or contact number.

## Changed files

- Mobile routes: `_layout`, `index`, `account-type`, `patient-type`, `register`,
  `login`, `recover`, `auth-callback`, `reset-password`, `interests`,
  `verification`, `verification-pending`, `home`, and the new `(tabs)` routes,
  `onboarding-complete`, and `settings`.
- Components: `care-ui`, `care-icon`, `care-tabs`, `app-tabs` platform wrappers,
  `resource-card`, `appointment-card`, `clinic-info`, `account-feedback`, plus
  legacy animated/theme/disclosure/badge compatibility components.
- Libraries/hooks: `session`, `account`, `account-context`, `onboarding-draft`,
  `form-validation`, `education`, `library`, `navigation`, `use-submission`,
  `use-care`, `use-now`, and the web color-scheme hook.
- Theme/config: `constants/brand`, `constants/theme`, `global.css`, `styles.d.ts`,
  `app.json`, `.env.example`, `.gitignore`, and the `test:ui` package script.
- Branding: five new `assets/images/gynecaire-*.png` files and a reproducible
  `scripts/generate-brand-assets.ps1` vector renderer using built-in Windows
  drawing APIs. Existing Expo assets are unused but retained for compatibility.
- Backend: the read-only care endpoint and response cache policy in
  `apps/api/src/routes/account.ts`.
- Tests/documentation: `apps/mobile/tests/refinement.test.ts` and this report.

## Verification

Passed automated checks: mobile/API TypeScript, eight refinement tests, the
existing ten onboarding tests and seven staff-portal validation tests, a full
supplemental TypeScript/React Hooks lint pass, and mobile-web export. The normal
iOS/Android export reached native module transformation but could not run the
Hermes bytecode compiler because Windows rejected its subprocess (`spawn EPERM`).
Exports are bundle checks, not device tests.

`npm run lint --workspace=apps/mobile` cannot complete its normal Expo setup:
mobile has no installed ESLint configuration and automatic dependency lookup is
blocked by the environment's network connection. The supplemental lint check
uses the existing web workspace's installed parser, TypeScript recommended rules,
and React Hooks recommended rules against all mobile source and tests. No rules
were disabled and no dependencies were installed.

Reproducible commands:

```powershell
npx tsc --noEmit -p apps/mobile/tsconfig.json
npx tsc --noEmit -p apps/api/tsconfig.json
npm run test:ui --workspace=apps/mobile
npm run test:onboarding --workspace=apps/api
npm run test:portal --workspace=apps/api
```

From `apps/mobile`:

```powershell
npx expo export --platform web --output-dir dist-onboarding
npx expo export --platform ios --platform android --output-dir dist-native-refinement
```

The browser access host was unavailable during visual-QA discovery. No browser
screenshots, iOS simulator tests, Android emulator tests, real device tests, or
live registration/verification/appointment workflows were performed. Configured
icons/splash require a new native build to appear on an installed app.

Manual staging checks before release:

1. At 320px, standard/large phone widths, and 200% text, check wrapping, touch
   targets, progress, tab labels, and the final form action above the keyboard.
2. Use VoiceOver/TalkBack to check heading order, password visibility, required
   fields, checked choices, focus movement, errors, and status announcements.
3. Browse as guest; search/filter resources; verify WHO links and sign-in entry
   from bookmarking; confirm no patient data/routes are available.
4. Register both account intents; go back and confirm name/email are preserved;
   check confirmation/recovery links on the initiating device; complete sign-in.
5. Save/skip/edit interests, including a second visit with saved selections.
6. Submit a clinic request once, retry under poor network conditions, review
   pending/rejected/approved states, and confirm role changes update navigation.
7. With a staging verified patient, compare appointments against clinic records;
   try another account's identifiers against the API and expect no disclosure.
8. Sign out while requests are loading, then sign into a different account;
   confirm no old details or bookmarks flash and completed auth screens stay
   out of authenticated back history. Check Android hardware back/iOS swipe-back.

This is a substantial UI/navigation refinement with explicit remaining service
limits, not a claim that every requested backend capability is production-ready.
