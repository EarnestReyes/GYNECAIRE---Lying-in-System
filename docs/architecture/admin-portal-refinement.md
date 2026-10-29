# Admin portal refinement and integration report

Audit baseline: Git `d73d2a8`; implementation review: 30 October 2026, Asia/Manila.
The repository instructions (`apps/mobile/AGENTS.md`), web/API source, shared
components, routing, Auth integration, import implementation and migrations
001–004 were inspected before editing. The local Careline Settings source had
already been inspected for the preceding Settings implementation; those patterns
are retained. No new Patients screenshot accompanied this attachment, so this
refinement follows the written sizing requirements and inspected source, not an
unseen screenshot. No exact visual reproduction is claimed.

## Scope and status definitions

**Implemented** below means connected in repository source and supported by the
listed local tests; it does not certify a deployed service. **Partial** identifies
an operational subset with missing capabilities. **UI only** means presentation
without its own persistence/service. **Blocked** means explicit prerequisites
are missing. **Not implemented** means no underlying feature path was found.
No module is labelled fully functional in deployment: actual PostgreSQL execution,
provider email delivery and rendered browser flows were not verified here.

## Module status matrix

| Module | UI/UX status | Backend status | Database integration in source | Tests performed | Remaining blockers |
| --- | --- | --- | --- | --- | --- |
| Dashboard | Refined typography, spacing, four real operation metrics and completed-visit trends. | Implemented `/overview`, `/reports`. | Reads `patients`, `appointments`, `patient_verifications`, `audit_logs`. | Existing report/date schemas; HTTP report contract with query doubles; web build/lint. | Live queries/rendering unverified; no inventory-alert service. |
| Patients | Refined searchable directory, linkage filters, pagination, overview modal, add/edit and verification tabs; separate import route/history links. | Implemented list/detail/create/update. Case-insensitive identifier guard added for future writes. | Reads/inserts/updates `patients`; audit writes in same transaction. No Auth accounts created or clinical fields overwritten. | HTTP list/detail/create/update, forbidden linkage fields, duplicate rejection and audit rollback with doubles; schemas. | Actual SQL/constraints/RLS and browser CRUD unverified. Archive/delete and clinical filters absent. |
| Appointments | Readable schedule/filter controls, details dialog and patient deep links. | Implemented list/create/status/date update. Finalized records remain read-only. | `appointments` joined to `patients`; transactional audited writes. | HTTP creation, confirmation update, finalized cancellation rejection; date/status/service validation. | No availability engine, personnel assignment or calendar view; live cancellation/browser behavior unverified. |
| Verification | Existing review/identity attestation and record picker preserved; shared dialog sizing and busy-state protection improved. | Implemented pending queue and approval/rejection. | Transaction locks, patient/profile linking, review state and audit remain in existing routes. | Existing onboarding/decision schema tests; compiled unchanged review code. | Approval/rejection/resubmission not exercised end to end against DB/browser. No rejection reason or identity-check automation. |
| Historical import | Dedicated `#patients/import` six-step wizard and separate history view; concise unavailable state with collapsed setup details. | Partial/blocked: existing job/staging/review/confirm/history API preserved; capability probe now checks schema read access. | Requires migration 004; encrypted staging/provenance and atomic unlinked-patient creation remain intact. | 21 import tests passed; 3 parser cases skipped. Wizard guard/navigation tests; schema capability probe with doubles. | Parsers unavailable; encryption/scanner/approval absent locally; 004 reported unapplied; live SQL/parser integration not passed. **Not operational.** |
| Medical Records | Patient context picker and connected overview/appointment dialog; clear document-unavailable state. | Partial: patient APIs work in source; clinical document API not implemented. | Only existing demographics and appointments are read. No clinical tables/file store. | Patient contract tests and TypeScript/build checks; no clinical CRUD claim. | Clinical schema, record categories/permissions, secure files and audit endpoints absent. |
| Checkups | Real completed-appointment history replaces editable-looking vital-sign placeholders. Explicitly labelled consultation history, not clinical assessments. | Partial: reuses `/appointments?status=completed`. Clinical forms not implemented. | Reads actual appointment fields only. No measurements/findings are invented. | Appointment filter/schema/HTTP contracts; build/lint. | Clinical checkup/history schema, clinician permissions and assessment write API absent. |
| Inventory | Clear unavailable state; removed empty tables and unknown-stock metric cards. | Not implemented. | No item/movement/threshold schema or endpoints. | Source audit, build/lint; no stock workflow test claimed. | Inventory storage, movement auditing and stock policies absent. |
| Messages | Honest messaging-unavailable state and direct links to connected workflows. Scripted chat removed. | Not implemented; no live AI or delivery service. | No message tables or endpoints. | Navigation helper tests; build/lint. | Messaging storage, access rules and delivery absent. |
| Reports | Shared readable filters, metrics, charts and aggregate CSV; dark chart text/surfaces corrected. | Implemented date-bounded `/reports`. | Completed appointments by month/service; created patient-record count. | Existing range schema tests and HTTP report contracts; web build/lint. | No financial/clinical report engine. CSV/browser rendering and live aggregations unverified. |
| Staff Management | Existing team directory now has explicit role/status review and confirmation for eligible other members. | New administrator-only `PATCH /members/:id/access`; no invitations/provisioning. | Existing `staff_members` updated transactionally; `profiles` checked, not promoted. Audit events record role transitions/status changes. | Schema, non-admin/self/ineligible/stale refusal, audit rollback and successful update tests with doubles. | No Auth invitations/first-admin bootstrap. Real locking/concurrency, deployed grants/RLS and live role changes unverified. |
| Settings | Previous six-section experience retained with tokenized sizing and busy modal protection. Light/Dark/System persisted locally. | Own profile API and Supabase current-password/nonce/recovery integrations retained; clinic/notification/device features explicitly unavailable. | Existing profile fields/audit; Auth handles credentials. Theme is intentionally browser-local. | 4 API Settings tests and 4 web password/theme tests passed. | Provider enforcement/delivery, live profile persistence and browser rendering unverified. No clinic configuration or notification storage/delivery. |

## Findings and changes by phase

### Shared design and layout

The old shared CSS used many 8–12px sizes, changed sidebar widths between desktop
breakpoints and compressed controls/table rows. Settings and imports had separate
small-size rules. Repeated unavailable cards/tables and a scripted chat made the
portal look more connected than its schemas justified.

`design-tokens.css` now centralizes brand/light/dark/status colors, chart accents,
15px body / 14px secondary / 13px caption text, 28px page / 20px section / 17px
card headings, spacing, control heights, radii, shadow and table padding.
`portal-system.css` applies those tokens across all modules: 248px sidebar, 24–32px
page spacing, 40–44px ordinary controls, padded tables/forms, scroll-contained
tables, consistent dialogs and mobile dropdown placement. Small decorative
eyebrows remain distinct from body text. Dark modal headers, chart centers/text,
form controls and status colors use the theme tokens.

The main sidebar structure remains intact. Patient imports use the Patients
active state/breadcrumb and a nested hash route rather than a new top-level item.
Lazy page loading keeps the shell visible during loading; a page error boundary
provides safe retry/dashboard actions if a page/chunk fails. Settings, clinical,
staff, messages and imports are loaded separately; the final main JavaScript
chunk is below Vite's former 500 kB warning threshold.

### Patients, appointments and imports

- Patient links validate UUIDs and resolve only on the patient route; closing a
  URL-opened profile clears that patient query. Existing local modal interactions
  are preserved. Appointment and consultation-history rows open the same profile.
- Patient creation/editing now checks clinic patient numbers case-insensitively
  under a patient-table write lock, also serializing against import confirmation.
  Existing duplicate records are preserved. No automatic demographic merge occurs.
- The patient-number HTML pattern is escaped for current Unicode pattern parsing.
  Server validation remains authoritative.
- Import screens show one workflow phase at a time: Upload → Map Fields →
  Validate → Review → Confirm → Summary. Review decisions persist through the
  existing API; unsaved choices block internal wizard/history navigation. The
  server's revision, duplicate and explicit-confirmation checks still gate writes.
- Mapping changes prevent jumping directly to review/confirmation until validation.
  Each page of review rows must be saved; all rows must be resolved before Confirm.
  A completed import can show only its summary, not restart its mutation path.
- The unavailable screen hides upload controls until prerequisites are ready.
  Setup details are collapsed and administrator-facing. History can still be
  reviewed when import storage exists even if new imports are disabled.
- The capabilities endpoint uses a `WHERE false` query against required import
  columns: it checks schema/SELECT access without retrieving patient rows. It does
  **not** prove migration history, write privileges, scanner health or successful
  import integration. POST/PUT/confirm retain their existing fail-closed checks.
- Saving dialogs disable close/escape while writes are pending, reducing accidental
  dismissals. No patient delete action was added; retention policy is not assumed.

### Staff access and security

Staff access is based on current active database membership, not frontend role
selection or Auth metadata. Only existing, eligible staff/admin-profile memberships
can be changed. Ordinary staff cannot use the `/members` router or import route.

The new mutation validates `{staff_role,is_active,expected:{staff_role,is_active}}`.
An advisory transaction lock serializes access changes; the administrator is
rechecked **after** it is acquired, then the target is locked and compared with
the reviewed state. Self-demotion/deactivation is prohibited. Consequently, an
eligible active actor remains an administrator; opposing administrator changes
cannot both proceed using stale eligibility through this API. This is a source
invariant tested with doubles, not a verified PostgreSQL concurrency result.

Patient and staff mutations remain parameterized and audited. Staff audit actions
include old/new role enum values and activation/deactivation; no personal field
values or passwords are logged. Profiles/account types are not changed to grant
membership. Inactivation blocks staff API access, not every Supabase session or
ordinary own-account endpoint. No Auth user is deleted or automatically invited.

The general API error handler now returns safe JSON rather than echoing malformed
bodies, raw DB errors or stack traces. Authorization failure logs no longer include
the raw exception. Report CSV escaping also neutralizes formula prefixes after
leading whitespace. Browser source uses only the public Supabase client and
bearer Express requests; no DB/service-role credential was added.

## API and schema inventory

All staff data paths use `/api/v1/staff`:

| Endpoints | Tables / persistence |
| --- | --- |
| GET `/session`, `/overview` | `profiles`, `staff_members`, patients, appointments, verification and audit aggregates |
| GET/POST `/patients`; GET/PUT `/patients/:id` | Patient demographics; transactional audit for writes; no account linking on intake |
| GET/POST `/appointments`; PATCH `/appointments/:id` | Appointments and patient joins; transaction/audit on writes |
| GET `/reports` | SQL-derived monthly/service aggregates and patient creation counts |
| GET `/members`; **new** PATCH `/members/:id/access` | Admin-only membership directory and transactional access updates |
| GET/PATCH `/profile` | Own profile fields and audit; no role/email/status editing |
| GET `/verifications`; POST `/verifications/:id/decision` | Existing identity-reviewed linking/rejection transaction |
| `/imports` job/file/validate/rows/decisions/confirm/events/errors/history/delete endpoints | Existing gated import tables and provenance; capability probe expanded |

`portal.ts` is now a thin production bootstrap for testable `portal-router.ts`.
The same JWT and staff/admin guards are supplied in production. Clinical,
inventory, messages, clinic configuration and notification endpoints were not
invented for schemas that do not exist.

Migrations 001–003 define the existing core/profile/onboarding model. Migration
004 defines the import tables/provenance, but was reported unapplied by the user;
its deployed state was not queried. There is no CLI migration runner/history or
clinical/inventory/message schema in the inspected repository. **No migration
was created, modified or applied for this refinement.** Staff changes use columns
already in 001. No existing production data or deployed service was modified.

Express uses the existing CA-validated TLS `pg.Pool`. It does not propagate user
JWT claims or `SET ROLE` into SQL; deployed DB role grants, RLS/BYPASSRLS and applied
policies must be reviewed separately. New staff writes need suitable backend-only
`staff_members` UPDATE, profile/staff SELECT+row-lock and audit INSERT privileges.
Patient write serialization needs the privileges for `SHARE ROW EXCLUSIVE` locking
already used by the importer; do not grant DELETE/TRUNCATE simply to obtain locks.
Never add broad browser RLS policies to bypass a backend permission failure.

## Verification actually performed

All test data is synthetic. No real patient records, passwords or production
accounts were used for testing. No DB connection or migration was executed.

| Command/check | Result |
| --- | --- |
| API `typecheck` | Passed. |
| API `test:onboarding` | 10 passed. |
| API `test:portal` | 7 passed. |
| API `test:settings` | 4 passed. |
| API `test:portal-http` | 4 passed. Uses actual Express handlers with controlled query doubles; not PostgreSQL integration. |
| API `test:imports` | 21 passed, 3 parser cases skipped. Includes no-row schema probe, gate, Auth-denial, scanner-protocol, crypto, rollback and retry tests. |
| Web `test:settings` | 4 passed. Password provider and browser/theme doubles. |
| Web `test:portal` | 3 passed. Every sidebar/nested route, patient UUID links, wizard phase restrictions. |
| Web lint | Passed. |
| Web TypeScript / production build | Passed; final lazy chunk/main size recorded by the build, no former 500 kB warning. |
| `git diff --check` | Passed. |
| Dedicated database integration configuration | No `PORTAL_TEST_DATABASE_URL` or `IMPORT_TEST_DATABASE_URL` in inspected API env files; no dedicated integration suite/environment was configured. Existing `testDatabase.ts` is a connection probe, not a CRUD/integration suite; it was not run against the production URL. |
| Browser/viewport testing | Blocked: browser host reported unavailable. Previously denied native Chrome access was not bypassed. No rendered desktop/tablet/mobile, light/dark screenshot, click-through or visual-fit pass is claimed. |

Total executed passing tests: **53**. Skipped: **3** parser tests. Passing builds,
schemas and query-double tests are not proof of real PostgreSQL behavior or
complete browser workflows. No unsupported CRUD operation is claimed tested.

The local import switch, encryption key and scanner settings remain absent/off;
parser resolution confirms `csv-parse`, `exceljs`, `yauzl` unavailable. No registry,
TLS, approval or scanning restriction was bypassed. No dependencies or lockfiles
were changed for this task, and no automatic commit was made.

## Remaining release checks

1. In an approved disposable environment with migrations 001–003 already applied,
   verify real staff session/role guards, patient search/detail/create/edit,
   case-insensitive identifier races, appointments/status transitions, reports,
   profile edits and verification approval/rejection/linking. Do not create Auth
   users/patient fixtures in production for testing.
2. Verify membership role/status changes, opposing administrator races, self/last
   administrator protection, stale reviews, audit rollback, RLS and least-privilege
   grants against PostgreSQL. Confirm denied admin access is reflected in clients.
3. Complete the separate importer checklist: install maintained parsers securely,
   regenerate relevant lockfiles, run all parser cases and import integration tests,
   obtain migration 004 approval, configure encryption and a private scanner, then
   explicitly approve/enable imports. Keep real uploads/confirmation disabled until
   these checks pass. SQL/PDF/JSON/XLS imports remain unsupported.
4. Inspect actual pages at 375px, 768px, 1024px and desktop widths in both themes;
   check modal focus/escape, dropdown positioning, internal table scrolling,
   long names, sidebar/dedicated-route navigation, failed/empty/loading states,
   all six wizard stages and unsaved decisions. Unsaved client-only drafts may be
   discarded when leaving a page through the main sidebar; resume persisted import
   jobs through history.
5. Deployed Auth current-password enforcement, OTP/recovery delivery, provider
   session behavior and configured policy documents still need the checks in
   `staff-settings.md`. These were not altered or certified by this refinement.

## Exact file changes

Modified:

- `apps/api/package.json`
- `apps/api/src/imports/router.ts`
- `apps/api/src/middleware/authorize.ts`
- `apps/api/src/routes/portal.ts`
- `apps/api/src/server.ts`
- `apps/web/package.json`
- `apps/web/src/App.css`
- `apps/web/src/App.tsx`
- `apps/web/src/components/shell.tsx`
- `apps/web/src/components/ui.tsx`
- `apps/web/src/index.css`
- `apps/web/src/lib/navigation.ts`
- `apps/web/src/lib/portal.ts`
- `apps/web/src/pages/appointments.tsx`
- `apps/web/src/pages/clinical.tsx`
- `apps/web/src/pages/dashboard.tsx`
- `apps/web/src/pages/messages.tsx`
- `apps/web/src/pages/patient-imports.css`
- `apps/web/src/pages/patient-imports.tsx`
- `apps/web/src/pages/patients.tsx`
- `apps/web/src/pages/reports.tsx`
- `apps/web/src/pages/settings.css`
- `apps/web/src/pages/settings.tsx`
- `apps/web/src/pages/staff.tsx`
- `apps/web/src/pages/verification-requests.tsx`
- `apps/web/src/theme.css`
- `apps/web/tsconfig.settings-tests.json`

Created:

- `apps/api/src/imports/readiness.test.ts`
- `apps/api/src/middleware/error-handler.ts`
- `apps/api/src/routes/portal-router.ts`
- `apps/api/src/routes/portal-router.test.ts`
- `apps/api/src/routes/staff-access.ts`
- `apps/api/src/routes/staff-access.test.ts`
- `apps/api/src/validation/staff-access.ts`
- `apps/web/src/components/page-boundary.tsx`
- `apps/web/src/design-tokens.css`
- `apps/web/src/lib/import-wizard.ts`
- `apps/web/src/pages/patient-import-page.tsx`
- `apps/web/src/portal-system.css`
- `apps/web/tests/portal.test.ts`
- `docs/architecture/admin-portal-refinement.md`

No mobile source, database migration, env secret or deployed service was changed.
