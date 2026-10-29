# Staff Settings workspace

The Settings page now uses a compact section rail, profile summary and consistent
content panels inspired by the locally inspected Careline implementation:
`C:/Users/reyes/Desktop/Record Management System/rms/src/pages/Settings.jsx`
and `src/components/settings/SettingsForm.jsx`. This is an adaptation of its
navigation and form interaction patterns, not an exact visual reproduction.
GYNECAIRE retains its burgundy/blush identity and existing main sidebar.

## Functional scope

| Section | Implemented behavior / limitations |
| --- | --- |
| My Profile | Reads own profile, contact, membership date, role and active status from Express/PostgreSQL; email and last sign-in from Supabase `getUser`. Edit/save/cancel name and optional contact. Successful save updates the shell name and refreshes the profile. Email, role, privileges and status are read-only. No avatar upload; initials fallback. |
| Account Security | Current/new/confirm password, visibility controls, length/reuse/match checks, guidance meter, explicit update confirmation and provider error states. Calls Supabase `updateUser` with `current_password`, optional nonce and new password. Code request uses `reauthenticate`; recovery uses the existing web-origin recovery route. No password is sent to Express, clinic tables or logs. |
| Appearance | Light, Dark and System choices; shared portal colors, panels, navigation, forms/tables, dialogs, authentication surfaces and import workspace overrides. Local browser persistence, system-change subscription, cross-tab storage updates and truthful session-only fallback if storage is blocked. Applies before initial React render. No account/cloud preference sync. |
| Clinic Configuration | Explicitly unavailable. No shared clinic settings endpoint/storage exists. Admins see the required capability; other staff see an administrator-managed explanation. No fabricated clinic information or functional save controls. |
| Notifications | All five categories clearly labelled Not connected. No active delivery toggles, email/push claims or preference saves. |
| Privacy & Account | Account information, unpublished-policy notices, optional configured HTTPS document links, sign-out confirmation through the existing portal logout flow. Device enumeration, session revocation UI and account deletion remain unavailable. |

Profile edits disable Settings section navigation until saved/cancelled; browser
unload is guarded while editing. The main sidebar remains unchanged: navigating
to another portal page can discard an in-progress Settings form. Password fields
are cleared on successful update, explicit Clear fields, or leaving that section.
Passwords are never persisted in preferences. Provider session-revocation behavior
is unchanged; no assurance about other devices being signed out is made.

## Backend and authorization

`GET /api/v1/staff/profile` and `PATCH /api/v1/staff/profile` are mounted behind
the existing JWT and active-staff guards in `routes/portal.ts`. Updates also lock
and recheck the matching staff/profile rows inside the transaction. All existing
admin/midwife/nurse/receptionist roles may update **their own** personal fields.

The body is strictly `{full_name, phone_number}`. The server derives the target
from JWT `sub`; IDs, email, roles, account types and active/verification fields are
rejected. Only `profiles.full_name`, `phone_number` and `updated_at` change.
`profile.updated` audit insertion and the profile update commit together; an audit
failure rolls back the write. No values/passwords are added to audit metadata or
application logs. Responses inherit the portal's `Cache-Control: no-store` policy.

This uses columns already present in migration 001. No migration was added or
applied, no deployed service configuration was changed, and no existing production
data was modified by this work. Existing Auth, patient linkage/verification,
imports and staff access checks remain in place.

## Configuration and deployment verification

- Optional `VITE_PRIVACY_POLICY_URL` and `VITE_TERMS_URL` must point to clinic-approved
  HTTPS documents. Credentials embedded in URLs are refused. Missing/invalid
  values show Not published, without invented legal text.
- Appearance key: `gynecaire.portal.theme` in localStorage, with `light`, `dark`
  or `system`. It contains no account or patient identifiers. Storage-denied
  states apply only for the current visit and are reported as such.
- The installed Supabase Auth types support `current_password`. Implementation
  follows [Supabase password guidance](https://supabase.com/docs/guides/auth/passwords)
  and [updateUser](https://supabase.com/docs/reference/javascript/auth-updateuser).
  Confirm the deployed Auth version rejects an incorrect current password and
  review Secure password change/provider policies before rollout. Frontend
  validation does not replace Supabase enforcement. No fallback retries omit
  current-password verification.
- Verify nonce and recovery email delivery, rate limits and the web-origin redirect
  allow-list on an approved test account. Request acceptance is displayed separately
  from delivery; delivery was not tested here.
- Verify the API database role can select/update the permitted profile columns,
  lock relevant staff/profile rows and insert audit rows under deployed RLS/grants.
  Do not grant direct-client profile updates or role-editing privileges.

## Validation

- API TypeScript compilation and four new API tests passed: Unicode/contact
  validation, forbidden-field rejection, authenticated self-update, inactive-staff
  rejection, audit recording and rollback on synthetic audit failure.
- Four web helper tests passed: password validation before requests; correct Auth
  request fields and failure handling; invalid/blocked preference storage; theme
  restart persistence, system changes and cross-tab synchronization.
- Tests use synthetic data and controlled database/Auth/browser doubles. They do
  not execute PostgreSQL SQL or make real password changes. No deployed update,
  RLS/grant test or actual recovery/OTP delivery is claimed.
- Web lint and production build passed. The existing main-bundle size advisory
  remains; there is no new dependency installation for this change.
- CSS provides a desktop 218px Settings rail and content column; at 1000px it
  becomes one column with scrollable section navigation, and below 600px it stacks
  profile facts, appearance choices and action rows. Native dialogs retain the
  shared focus/keyboard behavior. These responsive rules were inspected in source.
- Live desktop/tablet/mobile screenshots and interactive accessibility checks
  were **not verified**: the browser host was unavailable, and Computer Use did not
  receive approval to access Google Chrome. No reason beyond non-approval was
  returned. No security prompt was bypassed.

Run `npm run test:settings --workspace=apps/api`,
`npm run test:settings --workspace=apps/web`, API typecheck, web lint/build and
the existing onboarding/portal validation suites. Manually inspect the six
sections at 375px, 768px and desktop widths, light/dark/system modes, keyboard
navigation/focus, long names, storage denial and failed API/Auth requests before
release. Confirm actual profile persistence and password policy using synthetic
test accounts in an approved environment.

## Changed implementation files

API: `src/routes/settings-profile.ts`, its test, `src/validation/settings.ts`,
its test, `src/routes/portal.ts` and the settings test script.
Web: `src/pages/settings.tsx`, its stylesheet, `src/lib/settings-security.ts`,
`src/lib/theme.ts`, `src/theme.css`, `src/main.tsx`, `src/App.tsx`,
`tests/settings.test.ts`, test tsconfig/script, `.gitignore` and `.env.example`.
No mobile application files were changed.
