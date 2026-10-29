# GYNECAIRE mobile foundation: phases 1–3

## Phase 1 — architecture audit and plan

The repository contains a Vite React staff portal, an Express API, and an Expo
SDK 58 / React Native 0.88 application using Expo Router. Existing changes in the
working tree include Supabase clients, JWT verification, staff authorization, and
migrations 001/002. These were preserved; no database or deployment was changed.

At audit time the mobile routes were still the Expo welcome/explore screens.
The staff API checked active staff membership against PostgreSQL, rather than
trusting frontend roles. Migration 002 creates general profiles on signup and
permits only self-profile reads. Patient, staff, appointment, verification, and
audit tables have RLS enabled and no direct client access policies. Doctor is not
an allowed staff role and has not been introduced.

Only the text prompt was present in the attachment directory. The three design
reference images were unavailable. Colors, hierarchy, and branding follow the
written specification; exact image fidelity cannot be claimed.

Implementation order:

1. Audit existing authentication, schemas, scripts, and local instructions.
2. Introduce mobile brand tokens, reusable controls, safe-area/keyboard layout,
   a custom geometric maternal illustration, and stack navigation.
3. Add signup/login/recovery, optional interests, authenticated intake submission,
   status retrieval, and a backend staff review operation.
4. Next: public educational library and general-user tabs, using attributed
   content and confirmed clinic information.
5. Next: verified patient dashboard, records, scheduling, and monitoring with
   ownership checks and actual clinic data.
6. Next: staff portal modules and staff review UI.
7. Next: honestly labeled educational assistant unless a provider is approved.
8. Complete device QA, integration tests, accessibility and reference-image review.

## Phase 2 — design system and navigation

Created `apps/mobile/src/constants/brand.ts` and
`apps/mobile/src/components/care-ui.tsx`: burgundy/plum/blush tokens, buttons,
password fields, cards/styles, notices, brand lockup, and a code-drawn illustration.
Controls expose accessible labels and busy/disabled states. Forms scroll within a
safe area and use keyboard avoidance on iOS. Layout is constrained to 480px on
wide displays. No animation is introduced, so there is no reduced-motion override.

Replaced the mobile root layout and welcome route; the old explore URL redirects
to Home. Starter tab components/assets remain in source but are no longer mounted.
The splash background and display name are branded. Launcher/favicons still need
approved GYNECAIRE assets. Bottom tabs belong to phases 4/5, not onboarding.

## Phase 3 — authentication and onboarding

Created routes: `account-type`, `patient-type`, `register`, `login`, `recover`,
`auth-callback`, `reset-password`, `interests`, `verification`,
`verification-pending`, and a deliberately limited `home` landing screen.

Created `src/lib/session.tsx` and `src/lib/account.ts`. Session restoration and
logout use Supabase; native token refresh follows app foreground state. Browser
storage uses localStorage, while native storage retains chunked SecureStore with
valid dot-separated keys. Previous colon-separated native keys were invalid;
affected development users may need to log in again. Signup/recovery use PKCE.
Recovery and confirmation links must open on the device/browser that initiated
the request, with its PKCE verifier intact.

Account selection is an onboarding intent only. All new users still receive the
general role from migration 002. Email confirmation returns to optional interests.
After login, applicants use **Become a Clinic Patient** and submit consented intake
details. No patient number or record identifier is accepted from applicants.
Preferences can be saved or skipped. Home retrieves account type from the backend;
it never uses signup metadata to authorize records. Unavailable education,
records, monitoring, and booking are explicitly identified as future phases.

Backend additions:

- `GET /api/v1/account`: own profile, preferences, latest verification status.
- `POST /api/v1/account/preferences`: validated interest vocabulary.
- `POST /api/v1/account/verification`: minimal intake, explicit consent, duplicate
  pending-request handling, and audit entry in a transaction.
- `GET /api/v1/staff/verifications`: protected pending review list, limited to 100.
- `POST /api/v1/staff/verifications/:id/decision`: approve/reject with staff checks,
  locked rows, audit entry, and atomic linkage/role update. Approval requires
  `identity_verified: true` and an existing unclaimed clinic `patient_id`.

The staff member must actually perform identity verification through the clinic's
approved procedure. This backend operation does not itself establish identity.
New clinic patient record creation and the staff review UI are phase 6 work.
There are no push notifications yet; status says the clinic will contact the
submitted phone number. Staff clinical access checks remain unchanged.

Migration `database/migrations/003_mobile_onboarding.sql` adds a preferences table
with RLS and no client policies, intake columns, and a profile/status lookup index.
It does not change roles, disable RLS, reset data, or expose clinical records.
Apply it only to a reviewed development/staging database first. The backend must
use a suitable server-only database connection with the required permissions.

## Setup and run

1. Review/apply migrations 001, 002, then 003 to a development database. Existing
   installations should apply only migrations they have not already applied.
2. Preserve the API's existing `DATABASE_URL`, trusted certificate, and
   `SUPABASE_URL` configuration. No privileged key belongs in frontend variables.
3. Copy values from `apps/mobile/.env.example` into the ignored `.env.local`.
   Set `EXPO_PUBLIC_API_URL` to the API origin; physical phones need the host's
   reachable LAN address. Restart Expo after changing environment variables.
4. Set `EXPO_PUBLIC_AUTH_REDIRECT_URL` to the deployed/mobile-web callback or
   `gynecairemobile://auth-callback` for a native development build. In Supabase
   Auth, allow-list this callback and its `?next=recover` variant; use suitably
   restricted matching for development. Configure Site URL and working email
   delivery. Enable email confirmation and a password minimum of 10 characters.
   Supabase validates signup email/password; browser validation is not sufficient.
5. `CORS_ORIGINS` on the API accepts comma-separated web origins; defaults are
   localhost ports 5173 and 8081. Include the actual mobile-web origin when needed.
6. Run `npm run dev:api`, `npm run dev:mobile`, and `npm run dev:web` in separate
   terminals from the repository root. Open the mobile application for onboarding.

Review example (authorized staff JWT; use a securely managed API client):

```json
{ "status": "approved", "patient_id": "<verified clinic record UUID>", "identity_verified": true }
```

Rejection body: `{ "status": "rejected" }`. Never include patient details in
public logs or use real patient records as test fixtures.

## Verification and known limits

Passed: mobile TypeScript, API TypeScript, and 10 server validation tests covering
invalid/future dates, consent, duplicate/unknown interests, privilege injection,
phone validation, and approval prerequisites. The tests use synthetic inputs.

The final mobile-web export bundled successfully, including confirmation callback
and password reset routes. Staff-web TypeScript completed
but Vite bundling failed with Windows `spawn EPERM`. `expo lint` could not run:
no ESLint config/dependencies exist for mobile, and automatic installation failed
because network access was refused. An additional one-off ESLint check using the
staff web workspace's installed TypeScript parser and recommended rules passed
for the mobile routes, libraries, design controls, and brand tokens; this does not
replace a configured mobile/Expo lint setup. The tsx test runner also hit `spawn EPERM`;
compiling tests with TypeScript and running Node without process isolation worked.

Checks from the repository root:

```powershell
npx tsc --noEmit -p apps/mobile/tsconfig.json
npx tsc --noEmit -p apps/api/tsconfig.json
npm run test:onboarding --workspace=apps/api
npm run lint --workspace=apps/mobile
npm run build --workspace=apps/web
```

Mobile export, from `apps/mobile`: `npx expo export --platform web --output-dir
dist-onboarding`. Generated export and API `.test-output` are ignored.

Not verified: live registration/email delivery/recovery, database transactions,
RLS behavior under production roles, concurrent reviews against PostgreSQL,
native iOS/Android rendering, screen-reader usability, and exact reference-image
matching. Run end-to-end checks against a staging database before rollout.
No migration was applied and no real patient data was accessed during this work.

Next recommended phase: finish reference-image review and staging auth/onboarding
QA, then phase 4's educational library and separate general-user navigation.
