# Admin and staff web portal

## Audit and design source

Before this implementation, `apps/web` was a React/Vite application with one
component for login and a staff-access confirmation screen. There was no routing
library or management UI. The Supabase client provided persistent authentication;
the Express JWT and database-backed staff checks enforced authorization. Existing
tables supported patients, staff, appointments, verification requests, and audit
events. No clinical-record, checkup, inventory, messaging, or clinic-settings
tables were available.

The supplied `Gynecaire Maternity Clinic Dashboard UX Mockup.png` was inspected.
The implementation follows its white navigation rail, burgundy active states,
soft pink backgrounds and filters, compact tables, four dashboard metrics,
schedule/patient-overview arrangement, patient profile tabs, five-step checkup
layout, report charts, and split maternal-illustration login. Artwork and icons
are original SVG. Screenshot sample names, statistics, clinical information, and
illustrations were not used as real clinic data. No doctor role was introduced.

## Stage 1 — theme, authentication, and shell

Replaced starter CSS with shared variables, reusable controls, SVG icons, cards,
badges, table layouts, loading/error/empty states, and modal dialogs. Components
live in `apps/web/src/components`; feature screens live in `src/pages`.

`App.tsx` handles authenticated state and mounts a responsive sidebar/topbar
shell. Hash-based navigation supports reload, browser history, page links,
keyboard access, a skip link, and a mobile drawer. No router dependency was added.
Dialogs use native modal focus containment and restore focus on close. The
mobile drawer supports Escape and keyboard focus cycling. CSS handles narrow
screens, scrollable tables, and reduced motion.

The login screen retains Supabase sign-in and verifies staff access using the
new backend `/session` endpoint before mounting staff content. It includes
password visibility, validation, recovery email, and password-reset UI. Sessions
are persistent as before; no decorative remember-me checkbox or permission-
granting role selector was added. Supported roles are still admin, midwife,
nurse, and receptionist. Supabase sign-out and backend 401/403 responses unmount
staff data. Staff Management requires administrator authorization in the UI and
backend. The original staff `/dashboard` access-check endpoint remains intact.

## Stage 2 — features using existing tables

Implemented protected Express routes in `apps/api/src/routes/portal.ts`:

| Endpoint, under `/api/v1/staff` | Behavior |
| --- | --- |
| `GET /session` | Current authenticated staff name and role |
| `GET /overview` | Real patient/request counts, today's schedule, recent audit activity |
| `GET /patients` | Parameterized search, account-linkage filter, bounded pagination |
| `GET /patients/:id` | Patient demographics and latest 30 appointments |
| `POST /patients` | Validated, audited clinic record creation |
| `PUT /patients/:id` | Validated, audited demographic edits |
| `GET /appointments` | Manila date/status filters and bounded pagination |
| `POST /appointments` | Validated, audited pending appointment creation |
| `PATCH /appointments/:id` | Audited status changes/rescheduling; finalized visits locked |
| `GET /reports` | Completed-visit monthly counts, service mix, new-patient count |
| `GET /members` | Administrator-only read of clinic staff |

Patient and appointment writes use transactions with audit inserts; no UI-only
fake save or local copy of a clinic record is used. Dates of birth are returned
as date strings to avoid timezone shifts. Manila boundaries are explicit for
daily statistics and reports. Monthly reports include zero-count months from
the queried date range rather than compressing gaps in the trend. Protected
portal responses use `Cache-Control: no-store`.

The web portal provides patient add/edit and profile dialogs, appointment
create/details/reschedule/status forms, interactive report ranges/views, charts
with visible underlying counts, and aggregate CSV export. CSV cells are quoted
and guard against spreadsheet formula interpretation. Export contains no patient
identifiers. Consultation totals count completed appointments, not unique people.
Prenatal/postnatal totals use matching stored appointment service names.

Patients → Verification requests connects to the existing Phase 3 review API.
Approval requires selecting an unlinked clinic record and explicitly attesting
that clinic identity checks were completed. A confirmation precedes approval or
rejection. No patient record is linked by name matching. The request list is
limited to the oldest 100 requests and says so in the UI.

All counts are loaded from the API. Unavailable metrics display an em dash;
confirmed empty result sets display meaningful empty states. No production
fixtures or reference-image statistics were added.

## Stage 3 — clearly limited module foundations

| Module | Implemented | Still required |
| --- | --- | --- |
| Medical records | Category navigation, protected-storage notice, document table shell | Clinical tables, document ownership/permissions, storage, upload/read/audit routes |
| Checkups | Five navigable sections matching the reference, vital-sign units, assessment/notes/attachment layouts | Clinical persistence, clinical validation, role-specific access, audit history |
| Inventory | Category tabs, summary card/table layouts, explicit unknown quantities | Item/stock schema, adjustments, threshold calculations, restock history |
| Staff | Admin-only live directory, name/status filtering | Audited invite, role-change, and deactivation workflow |
| Settings | Authenticated account/role display and Supabase password change | Clinic configuration, notification settings, editable profiles |
| Messaging | Unavailable-state UI | Secure conversation/delivery backend and recipient authorization |
| Assistant | In-memory scripted administrative guide and suggested prompts | Approved provider/data-handling design for live AI |

Clinical inputs/uploads and unavailable write actions are disabled and labeled.
Pregnancy metrics, allergies, and risk factors are **unknown**, not reported as
normal or absent. Archive and prenatal/postnatal patient filters are not offered
as working filters because their underlying fields are missing. No diagnosis,
clinical guidance, external AI request, notification delivery, or paid provider
integration was introduced. The workspace guide is labeled scripted and sends
no message content outside the page.

## Setup

1. Preserve the existing API database connection, trusted CA certificate, JWT
   issuer, and Supabase settings. No service-role key belongs in web variables.
2. Set the ignored `apps/web/.env.local` using `.env.example`. Use the API origin
   for `VITE_API_URL`. Start the existing API with `npm run dev:api`.
3. Run `npm run dev:web`. The default origin is localhost:5173; include any
   different web origin in the API's `CORS_ORIGINS` setting.
4. For password recovery, allow-list the web origin's `/` redirect in Supabase
   Auth and configure working recovery email delivery. The existing browser
   client processes recovery sessions; App listens for `PASSWORD_RECOVERY`.
5. The existing Phase 3 migration 003 is needed by the verification workflow.
   No migration was created or applied in this web task. Review any previously
   unapplied migrations separately before using verification review.

Web dev/build/preview scripts now use Vite's native configuration loader. On this
Node 24 Windows environment, the default bundled config loader failed with
`spawn EPERM`; the native loader completed the production build without weakening
security or changing package versions. Dependencies and lockfiles are unchanged.

## Validation and limits

Run from the repository root:

```powershell
npm run lint --workspace=apps/web
npm run build --workspace=apps/web
npx tsc --noEmit -p apps/api/tsconfig.json
npx tsc --noEmit -p apps/mobile/tsconfig.json
npm run test:portal --workspace=apps/api
npm run test:onboarding --workspace=apps/api
```

Portal validation tests cover intake fields, future/invalid birth dates, telephone
digits, privilege injection, bounded pagination, appointment UUID/timezone/status
validation, and report date-range bounds. They use synthetic values and never
connect to the clinic database.

Completed checks: web ESLint, web production build (native configuration loader),
API TypeScript, mobile TypeScript, seven portal validation tests, and the ten
existing onboarding validation tests. `git diff --check` also passed.

Build/type/lint checks do not prove live database CRUD or auth flows. No database
content, schema, RLS policy, staff membership, or mobile source was modified in
this task. No patient data was used for screenshots or development fixtures.

Browser visual review could not run: the browser host was unavailable and the
Computer Use tool did not approve access to Chrome. Desktop/mobile screenshot,
keyboard/screen-reader, live role/session, recovery-email, PostgreSQL transaction,
and concurrency QA remain staging checks. Exact visual fidelity is not claimed.

Next: verify the UI against the supplied reference in a browser with staging
accounts, then implement clinical and inventory schemas/endpoints in separately
reviewed additive migrations. Appointment availability, staff assignment,
rescheduling history beyond audit events, and notification delivery also remain.
