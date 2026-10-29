# GYNECAIRE current system-flow audit

Audit date: **29 October 2026 (Asia/Manila)**. Source baseline: Git `1c99a45`.
This is a **documentation-only, static repository audit**. No application was
started, no API request or database connection was made, no migration was applied,
and no deployed Supabase setting or database policy was queried. Earlier project
reports are historical context, not evidence of current deployed behavior.

## 1. Scope, evidence, and status key

The repository was inventoried before tracing it. The only discovered repository
`AGENTS.md` is `apps/mobile/AGENTS.md`; it requires Expo Router and preservation
of the existing stack. No application files were changed for this audit. Actual
source roots are `apps/mobile/src/app`, `apps/web/src`, `apps/api/src`, and
`database/migrations`. Three SQL migrations exist; no Supabase CLI `config.toml`,
seed/provisioning migration, clinical schema, or inventory schema was found.

| Mark | Meaning in this audit and the diagrams |
| --- | --- |
| **E** | Implemented end to end **in source**: a reachable client action is connected to the relevant local behavior or API, validation/authorization, and represented persistence where needed. This is not a runtime/deployment pass. |
| **P** | Partial: a real subset exists but the named overall workflow is incomplete, manually dependent, or disconnected. |
| **UI** | Navigable UI/preview or explicitly scripted behavior without the claimed service/persistence. It is not live AI or real clinical data. |
| **A** | Planned/absent: no implementation path found in the inspected repository. |
| **U** | Unclear without runtime/deployed access: configuration, identity procedures, applied migrations, permissions, external services, or real device behavior. Can accompany E/P. |

Evidence labels such as [M06] and [A08] link directly to source. The evidence
index below gives full paths and line numbers. Negative findings are based on
the complete route/migration inventory and searches of client/API source, not
merely on a missing page name. No clinical mock dataset was found in mounted
screens; placeholders say unavailable and unavailable counts use an em dash.
The education catalog and administrative guide are explicitly static content.

## 2. Main findings

1. **Auth and application data follow different paths.** Both clients call
   Supabase Auth directly. Application data is fetched through Express, which
   uses `pg` over a TLS database connection; it does not proxy Supabase Auth or
   automatically forward the caller's JWT into PostgreSQL. [M12] [M13] [W02]
   [W03] [A01] [A04]
2. **Signup creates a general account, never a patient or staff account.** The
   Auth insert trigger creates `profiles.account_type='general'`, irrespective of
   the mobile onboarding intent. A clinic patient record is a separate entity.
   Staff can create it without creating/linking an Auth account. [M06] [D08]
   [A16] [D02]
3. **Verification is wired across mobile, web, API, and schema**, but identity
   checking itself is a staff procedure outside the app. Approval links an
   existing clinic patient record and changes the existing profile to patient in
   one audited transaction. Rejection has no reason/request-more-information
   workflow. [M15] [W08] [W09] [A08] [A10] [D11]
4. **Patient care currently means read-only appointment access.** There is no
   operational medical-document, pregnancy, monitoring, or patient booking
   service. A verified role alone does not make these placeholders functional.
   [M19] [M20] [M21] [M30] [A05]
5. **Staff operations are functional source paths for demographics, appointments,
   verification, and aggregate reports.** Checkups/records/inventory remain UI
   foundations; staff management is a read-only admin directory. [W05] [W11]
   [W13] [W14] [W15] [W16] [W17] [A14] [A19] [A21] [A22]
6. **The checked local mobile configuration blocks important flows.** The local
   mobile file has only Supabase URL/public key variables; account requests need
   `EXPO_PUBLIC_API_URL`, which has no fallback. Recovery explicitly requires
   `EXPO_PUBLIC_AUTH_REDIRECT_URL`, also absent. This is a concrete local finding,
   not a claim about production configuration. [M08] [M13] [C01]
7. **RLS is enabled, but backend execution under RLS is deployment-dependent.**
   The SQL defines only an own-profile SELECT policy for ordinary authenticated
   clients. The backend database role, grants, ownership/BYPASSRLS behavior, and
   applied policy state cannot be established from a connection URL alone.
   [D07] [D09] [D10] [A04]

## 3. Mobile entry, auth, and account routing

| Workflow | Status | Actual chain and limits | Evidence |
| --- | --- | --- | --- |
| Open app/session restoration | E + U | SessionProvider listens to Supabase events and restores persisted session; native refresh follows app foreground. Root waits before navigation. Native storage is chunked SecureStore; mobile-web uses localStorage. Persistence/device behavior not exercised. | [M01] [M11] [M12] |
| Welcome/guest entry | E | Welcome routes to account choice/sign-in, or replaces the route with `/dashboard` for guests. Guest browsing creates no Auth account and uses no patient API. Existing sessions route to dashboard. | [M03] [M19] |
| General-user onboarding | E + U | Account choice → registration → optional interests → completion → dashboard, when a session is returned or the email callback completes. Interests are server-stored, not medical conditions. Email and local API dependencies remain U. | [M04] [M06] [M17] [M18] [A07] [D10] |
| Clinic-patient onboarding | P + U | Clinic choice → existing/new classification → registration. Intent is Auth metadata only. Immediate-session signup/callback can route through interests with `next=verification`; neither path automatically creates a clinic patient or submits a verification request. | [M04] [M05] [M06] [M09] [M18] |
| Registration | E + U | Client validation and privacy checkbox → `auth.signUp` → Auth user → migration 002 trigger → general profile. No Express signup endpoint. If no session is returned, show email instructions. Email confirmation policy, delivery, redirect allow-list, and password policy are external settings. The privacy checkbox is not persisted as account-consent history. | [M06] [M12] [D08] |
| Normal sign-in | E + U | `signInWithPassword` → `/dashboard` → AccountProvider GET `/account` → server profile/account type/interests/status. Normal login always chooses dashboard; it does not resume a clinic onboarding task automatically. | [M07] [M14] [A06] |
| Confirmation/callback | E + U | Mobile uses PKCE and `exchangeCodeForSession(code)`. `next=recover` opens password reset; otherwise metadata `existing/new` routes to interests then clinic verification, else interests/completion. This depends on a valid same-device verifier and configured redirect. No custom email-OTP screen/resend flow exists. | [M09] [M12] [M17] [M18] |
| Password recovery | P + U locally; E in source chain | Form → `resetPasswordForEmail` with callback `next=recover` → code exchange → `updateUser({password})` → success/Home. Missing local callback stops the send action with an availability message. Supabase email/template/redirect configuration is not represented as checked configuration in Git. | [M08] [M09] [M10] [C01] |
| Account-specific tabs | E + U | Server `account_type==='patient'` selects Home/Records/Appointments/Learn/Profile. Others get Home/Learn/Clinic/Community/Profile. `Tabs.Protected` hides/removes patient routes; this is not backend authorization. A same-user refresh retains the prior account while loading; an error removes it. | [M02] [M14] [M33] |
| Completed-auth history/deep links | E in source | Root `Stack.Protected` excludes signup/login routes after session creation and excludes authenticated utilities for guests. `/home` and `/explore` are compatibility redirects. Gesture/hardware back and exact startup anchor behavior were not tested. | [M01] [M34] |
| Logout/session expiry | E + U | Profile signs out through Supabase; successful sign-out routes to `/`. Draft/library scopes reset on identity changes. Account HTTP 401 performs local sign-out; 403 gives a friendly access error. This is separate from API JWT revocation semantics. | [M22] [M01] [M11] [M13] |

### Routing mismatches and disconnected portions

- Clinic intent survives in metadata, but **normal login does not resume** it:
  login goes to dashboard; only signup-with-session or callback preserves the
  automatic `next=verification` route. Users can still start verification from
  Home/Profile/Clinic. [M06] [M07] [M09] [M19] [M22] [M23]
- Patient tabs are selected from the server profile type, whereas actual care
  access also requires a linked patient row. Out-of-band role edits can therefore
  produce patient navigation followed by a care 403. `GET /account` synthesizes
  status `approved` for any patient-typed profile; it does not confirm an approved
  verification row. [M02] [A05] [A06]
- Staff/admin mobile accounts get general-style tabs and a staff-portal notice.
  They are not redirected into the web portal automatically. Clinic can still
  offer its request entry action for a signed-in staff account, but the
  verification screen and backend reject non-general accounts. [M22] [M23]
  [M15] [A08]
- Auth callback remains reachable without a session because it must establish
  one. Its error action targets login, which is excluded if a session already
  exists; navigation fallback in that case needs runtime verification. [M01] [M09]

## 4. Patient verification and linking

| Step | Status | Actual behavior | Evidence |
| --- | --- | --- | --- |
| Start request | E + U | Authenticated general account; choose existing/new, birth date, contact, explicit consent. Account state is fetched first. Already-pending requests go to status rather than resubmit. | [M15] [A06] |
| Submit/validate | E + U | POST `/account/verification`; JWT `sub` determines profile, not caller-supplied IDs. Strict Zod schema rejects linkage/role fields and requires `consent:true`. General profile is locked. | [M13] [A08] [A24] |
| Pending/deduplication | E + U | If any pending request exists for the profile, return `pending` without another insert. Otherwise insert intake/consent time plus an audit event and commit together. There is no unique pending constraint; pre-existing duplicate pending rows are explicitly retained by migration 003. | [A08] [D11] |
| Pending display | E + U | Mobile reloads account status on status-screen focus, explicit check, or account/app refresh. General users retain public navigation and cannot read `/care`. No realtime subscription, review SLA, automatic phone contact, email, or push job is implemented. | [M16] [M14] [A05] |
| Staff queue | E + U | Patients → Verification requests → GET `/staff/verifications`; oldest 100 pending requests with profile/intake details. Any of the four supported active staff roles can review. No reviewed-history/reason screen is connected. | [W05] [W08] [A09] |
| Staff identity review | P | UI asks staff to perform the clinic's identity procedure outside the app, find a correct unlinked patient record, and attest that identity was checked. A new patient must first be created in Patients. There is no ID-document submission/matching service. | [W09] [W10] [A16] |
| Approval | E + U | POST decision with `approved`, existing `patient_id`, and literal `identity_verified:true`. Transaction locks pending verification/profile/patient, rechecks active staff, requires general account, and rejects conflicting linkage. It updates `patients.profile_id`, profile type to patient, review fields/status, and audit, then commits. | [W09] [A10] [A24] [D02] [D04] |
| Account identity/preferences | E | Approval changes the existing profile; it creates no new Auth account, password, or preference row. Existing preferences stay attached to the same UUID. Submitted DOB/contact do **not** automatically overwrite selected clinic demographics. | [A10] [D10] |
| Rejection | E + U | Decision `rejected` updates status/reviewer/time and audit with null decision `patient_id`; it does not promote the profile or link a patient. No rejection-reason field or `needs_more_information` status exists. | [A10] [A24] [D04] |
| Resubmission | E + U | Rejected status offers edit/try-again → verification form. A still-general account without another pending request can insert a new request. The old rejected row remains; latest `created_at` supplies visible status. Re-submission does not reopen/update the old request. | [M16] [M15] [A06] [A08] |
| After approval | E + U | Account refresh changes visible patient tabs; `/care` uses server role/linkage to read only the user's appointments. No proactive push of the decision or automatic medical-document unlock exists. | [M14] [M02] [A05] |

**Important boundary:** the care endpoint enforces **patient profile type +
linked record**, not a separate approved-verification-row check. Approval is the
represented route that establishes that pair; manual database edits could also
establish it. Staff attestation is a prerequisite asserted by staff, not machine
proof of identity. [A05] [A10]

## 5. Mobile dashboards, education, and patient features

| Feature | Status | Actual supported scope / missing connection | Evidence |
| --- | --- | --- | --- |
| General/guest dashboard | E + U | Public education banner/search/categories and two resource cards; signed-in greeting, preference-based ordering, pending-request entry, and clinic-request CTA depend on account API. No clinic statistics are invented. | [M19] [M14] |
| Verified-patient dashboard | P + U | Own next active future appointment, care actions, and education are connected. Pregnancy details/measurements are an unavailable notice; no recent clinical-record feed or daily-tip service exists. | [M19] [M30] [A05] |
| Patient appointments | E (read) + U; A (self-service writes) | GET own `/account/care`, up to 100 visits with upcoming first; local Upcoming/Past/All filters, refresh, Manila times/status text. Mobile does not call staff POST/PATCH appointments. Booking, cancellations, rescheduling, availability, teleconsultation, and personnel assignment are absent for patients. | [M20] [M30] [A05] [A19] [A20] |
| Patient medical records | UI | Prenatal/Postnatal/Other navigation changes an unavailable-state message. No record query, clinical table, document upload/download/storage policy, or prescription service exists. | [M21] [D01] [D10] |
| Pregnancy/health monitoring | A | No monitoring route, measurement endpoint/table, timeline, gestational-age computation, or pregnancy schema found. Home explicitly says the data is not connected. | [M19] [D01] [D10] |
| Learn/search/categories | E (public link directory) | Four source-coded WHO links with local category/text filtering and external open action. It is not a clinic CMS, cached article library, video feed, or clinical recommendation engine. External availability/content were not checked in this audit. | [M25] [M27] [M31] |
| Bookmarks | E (device-local) + U | Sign-in required to toggle; public resource IDs stored per Auth UUID in SecureStore/native or localStorage/web. Saved view filters locally. No backend sync/table or cross-device persistence is implemented. | [M26] [M31] |
| Optional interests | E + U | Known-topic selection, save or skip; POST preferences upserts own `account_preferences`; existing values populate the editor. Recommendations are simple tag-based ordering, not medical personalization. | [M17] [A07] [A24] [D10] [M19] |
| Clinic details/contact | P + U | Public phone/address come from build-time environment variables; call/Maps buttons appear only where values permit. No clinic configuration API, service/hours store, or actual booking action. Checked local phone/address variables are absent. | [M23] [M28] [C01] |
| Community | UI / A service | Guidelines/unavailable screen only. No posts, replies, moderation, reports, persistence, or community endpoint. | [M24] [A01] [D01] [D10] |
| Profile/settings | P | Own email from Auth and name/type/status from API; interests/bookmarks/verification entry and logout are connected. Settings can change password via Auth. Editable demographics, language, notifications, companion access, and account deletion are absent. | [M22] [M29] [M10] |
| Patient AI chat/messages | A | No mounted mobile chat, message API, provider integration, or notification transport. The staff scripted guide is a different feature. | [M01] [M02] [W19] [A01] |

## 6. Staff/admin web flow and actual permissions

Web entry is `src/main.tsx` → `App.tsx`. Page navigation is a local hash whitelist,
not an independently secured URL router. App mounts the staff shell only after
`GET /staff/session` succeeds. Auth session restore and PASSWORD_RECOVERY events
are handled in App. Ordinary Supabase login alone does not grant portal access.
[W01] [W02] [W03] [W04] [W21] [A12]

### Effective permission matrix

| Caller | Own account/preferences | Own care | Staff patient/appointment/report operations | Verification decisions | Staff directory |
| --- | --- | --- | --- | --- | --- |
| Guest/no valid bearer | No | No | No | No | No |
| General authenticated | Yes | No | No | No | No |
| Patient authenticated, no linked record | Yes | No | No | No | No |
| Patient + own linked record | Yes | Read own appointments only | No | No | No |
| Active staff/admin profile with staff role nurse/midwife/receptionist | Yes | No under staff profile type | Yes, all these operations | Yes | No |
| Active staff/admin profile with staff role admin | Yes | No under staff profile type | Yes | Yes | Yes, read only |
| Inactive staff or mismatched profile type | Own account remains possible if Auth valid | Depends on patient role/linkage only | No | No | No |

`requireStaff` requires an active `staff_members` row **and** profile type
staff/admin, then checks `staff_role`. Web admin visibility uses the returned
`staff_role`, not a local role selector. There is no doctor role in SQL or backend
types, and no differentiated clinician-vs-receptionist patient/report/write scope.
The broad staff router also runs before the verification router because of
mount order; review requests are authenticated/authorized again in that router.
[A01] [A03] [A09] [A11] [A22] [D03] [W01]

| Workflow | Status | Actual chain and limits | Evidence |
| --- | --- | --- | --- |
| Staff login/session/logout | E + U | Supabase password sign-in → backend session role lookup → portal; denied authorization signs out after login attempt. 401/403 from staff API unmounts portal; logout invokes Supabase. Existing tokens are still validated locally by JWT middleware rather than an Auth revocation lookup per request. | [W01] [W02] [W04] [A02] [A12] |
| Web recovery/password change | E + U | Recovery email redirects to web origin `/`; browser client detects recovery session and App renders reset; `updateUser` then staff authorization. Settings also calls `updateUser`. No credential-setting UI is backed by Express. | [W03] [W04] [W18] [W01] |
| Dashboard | E + U; P overall | GET overview and year-to-date reports: patient total, today's appointments, pending verification/appointments, schedule (20), recent audit events (6), visit chart. Low-stock metric is a fixed **unavailable em dash**, not a mock quantity. Today counts/schedule include all appointment statuses for that date. | [W20] [A13] [A21] |
| Patient directory/details | E + U | GET search by name/number, all/linked/unlinked filter, 15-row pages; details return demographics and latest 30 appointments. Last visit means max completed appointment date. Prenatal/risk/archive categories have no working field/filter. | [W05] [W07] [A14] [A15] |
| Patient add/edit | E + U | Form POST/PUT → strict schema → parameterized insert/update plus audit transaction. Clinic patient number is staff-assigned. Does not create Auth user, link profile, or classify pregnancy. No archive/delete endpoint. | [W06] [A16] [A17] [A25] [D02] |
| Appointment listing/create | E + U | Date/status and 15-row pages; PatientPicker selects an existing patient. POST creates pending visit; service enum is code-defined. No capacity/slot availability, conflict detection, staff assignment, or future-date constraint. | [W11] [W12] [A18] [A19] [A25] |
| Appointment status/reschedule | E + U; P history | PATCH can set any supported status and optional datetime while current row is nonfinal. Completed/cancelled rows reject changes. There is no strict pending→confirmed→completed transition sequence, assignment workflow, reason field, or dedicated history table; audit event records action/entity but not before/after values. | [W12] [A20] [A25] [D05] [D06] |
| Verification review | E + U / P identity procedure | Queue, approve/reject, selection and transactions as traced in section 4. Available to all four supported staff roles, not admin-only. | [W08] [W09] [A09] [A10] |
| Medical records/patient clinical tabs | UI | Document category controls and unavailable message. In patient profile only Overview demographics and Appointments load data; records/checkups/documents/notes and pregnancy/risk/allergy content do not. | [W07] [W14] |
| Checkups | UI | Five steps can be navigated. Vital fields, narrative inputs, file selection, and saving are disabled. There is no clinical endpoint or migration. | [W15] [A01] [D01] [D10] |
| Inventory | UI | Category tabs/table shell, disabled add/search, unknown metrics. No items, adjustments, restock history, schema, or endpoint. | [W16] [A01] [D01] [D10] |
| Reports/CSV | E + U; P analytics scope | Date range ≤366 days → completed visits by month (zero months filled), service distribution, new patient record count. Prenatal/postnatal totals are client string matches on service names. CSV is aggregate, browser-generated, quoted with formula guards. No clinical/financial analytics or PDF generation. | [W13] [A21] [A25] |
| Staff management | P | Admin-only GET members with client search/active filter. Invite is disabled; no invite, account provisioning, role edit, deactivation, or bootstrap-admin flow. Schema presence is not a provisioning mechanism. | [W17] [A22] [D03] |
| Messaging/assistant | UI | Messaging unavailable. Administrative guide uses three scripted answers/fallback and in-memory conversation state. No live AI, external provider call, clinical tool, message database, or delivery. | [W19] [A01] |
| Settings/search/notifications | P / UI | Settings displays staff identity and supports Auth password change only. Clinic config/preferences buttons disabled. Topbar search finds page names, not patients/records; notification popover explicitly says live notifications are not connected. | [W18] [W22] |

The old `verifyStaffAccess()` helper and `/staff/dashboard` endpoint remain, but
the mounted App uses `staffApi('/session')`. `/staff/dashboard` returns only an
authorization message; it is **not** the dashboard metrics API. [W23] [W01] [A23]

## 7. HTTP, Supabase, PostgreSQL, and RLS boundaries

### Actual request paths

1. **Auth:** client Supabase SDK → configured Supabase Auth → session/access token.
   Mobile uses PKCE and custom session storage; web retains browser session and
   URL detection. Auth operations do not go through Express. [M12] [W03]
2. **Mobile data:** `request()` retrieves session → sends bearer token to configured
   `/api/v1/account` URL → JWT validation → own-profile query / preference write /
   verification submission / patient-link check for care. No guest authorization
   path exists for these endpoints. [M13] [A01] [A02] [A05] [A06] [A07] [A08]
3. **Web data:** `staffApi()` sends bearer token to `/api/v1/staff` → JWT validation
   → database staff/profile/active-role check → handler. Members adds admin check;
   review also rechecks staff under transaction locks. [W02] [A03] [A10] [A11]
4. **Persistence:** Express `pg.Pool` → `DATABASE_URL` with CA-validated TLS. SQL is
   parameterized. Patient/appointment changes and verification decisions include
   audit writes in the same transaction; preference updates do not. No migration
   runner is called from API startup. [A04] [A01] [A07] [A10] [A16] [A20]
5. **Public education/clinic:** local link/config data → device/browser external
   WHO, phone, or Maps action. The public health check returns API metadata only;
   it is not an education, service availability, or clinic data endpoint. [M27]
   [M28] [A01]

JWT middleware requires bearer prefix, validates signature from configured
Supabase JWKS, issuer, audience `authenticated`, string subject and payload role
`authenticated`, then sets `req.authUserId`. It does not trust frontend role
metadata. It does not call Auth user/session introspection on every request;
immediate token revocation/logout semantics are an unverified runtime dependency.
[A02]

### Migration inventory and modeled state

| Migration | Represented state | Missing/conditional pieces |
| --- | --- | --- |
| `001_initial_schema.sql` | Auth-referenced profiles; unique patient number and optional unique profile linkage; active staff role membership; pending/approved/rejected verifications; four appointment statuses; minimal audit events; indexes; RLS on all six tables. | No clinical, pregnancy, inventory, community, messaging, scheduling, file/document, rejection-reason, appointment-history, staff-provisioning, or notification tables. [D01] [D02] [D03] [D04] [D05] [D06] [D07] |
| `002_authentication.sql` | SECURITY DEFINER signup trigger with fixed empty search path, general-only profile insert, own-profile SELECT policy for authenticated role. | Does not configure email confirmation, passwords, SMTP, redirect allow-lists, staff grants/seed, or client write policies. [D08] [D09] |
| `003_mobile_onboarding.sql` | RLS-enabled account preferences, max 8 interests, verification kind/DOB/contact/consent timestamp, profile/created lookup index. | No client preferences policy; backend access required. Historical pending duplicates remain; no unique pending index. [D10] [D11] |

**RLS qualification:** migration 001 enables RLS and migration 002 adds one
own-profile SELECT policy. Migration 003 enables it on preferences without
adding policies. For roles subject to RLS, tables without an applicable policy
do not expose rows merely because they exist. But actual grants, default
privileges, ownership, and BYPASSRLS state are unknown. The API does **not** set
`request.jwt.claims`, `auth.uid()`, or `SET ROLE` per incoming bearer token. Its
explicit ownership/staff checks must therefore not be described as automatic
database per-user RLS enforcement. Whether `DATABASE_URL` uses a privileged role
that can execute the shown SQL with RLS enabled must be checked in deployment;
this audit neither disabled RLS nor recommended doing so. [A04] [A05] [A03]
[D07] [D09] [D10]

### Local configuration observations (values redacted)

- `apps/mobile/.env.local:1–2` contains Supabase URL and public key only. API URL,
  callback URL, clinic phone and address are absent there. Other shell/build-time
  variables were not asserted absent. The client has no API URL fallback and
  recovery refuses to send without its callback. [M13] [M08] [C01]
- `apps/web/.env.local:1–2` contains Supabase URL and public key; absent web API URL
  uses its code fallback `http://localhost:5000`. API `.env:1–3` has PORT,
  DATABASE_URL and SUPABASE_URL. The configured port matches that fallback.
  Public URL comparisons found both clients and API issuer point at the same
  local-configured Supabase project; no reachability/credentials were tested.
  [W02] [W03] [A01] [A02] [A04]
- No secret values, tokens, passwords, database URL, or publishable key contents
  are included in this document or either diagram.
- No checked-in Supabase project config or migration-application history proves
  which SQL is deployed. In particular GET `/account` joins preferences even for
  users with none: if migration 003 is not applied, that query fails rather than
  simply returning an empty interests array. [A06] [D10]

## 8. Differences from the existing planning flowchart

The discovered inputs are
`C:/Users/reyes/Downloads/GYNECAIRE-complete-system-flowchart.drawio` and its SVG.
They explicitly call themselves an unaudited **planning baseline**. They were
read but not modified; the deliverables replace their uncertain assumptions with
the findings here. Their labels were compared by native `mxCell` IDs and SVG text.

| Existing planning step | Correction in current diagram | Evidence |
| --- | --- | --- |
| `Select interests *` (cell 57; native line 212), positioned before shared signup | Interests editor is authenticated and runs after signup/callback, or from Profile; real save endpoint/table now known. | [M01] [M06] [M17] [A07] [D10] |
| Guest/public path connects to shared API A; public-or-auth decision (cell 205; line 821) | Guest education/clinic browsing uses local catalog/build-time config/external URLs. Express only has a public health check; account/staff data require JWT. | [M27] [M28] [A01] [A02] |
| Verification fields/linkage exact behavior unverified (cells 96, 122, 231) | Known birth date/contact/kind/consent request, pending deduplication, manual staff identity attestation, existing patient selection, atomic link/promotion/audit. | [M15] [A08] [A10] [D11] |
| `Return reason / request details` on rejection (cell 170; line 689) | Only rejected status/reviewer/time/audit; no reason or more-information status. Mobile must resubmit a new request. | [A10] [A24] [D04] [M16] |
| Patient Appointments/Records/Monitoring grouped together | Appointments read path is wired; patient scheduling absent, Records is unavailable UI, Monitoring has no route/storage. | [M19] [M20] [M21] [A05] |
| Inventory/Reports both conditional (cell 148; line 592) | Reports now have aggregate SQL and CSV export. Inventory still has no storage/API. | [W13] [A21] [W16] |
| Staff management action (cell 183; line 740) | Admin read-only list, not invite/edit/deactivation or staff account provisioning. | [W17] [A22] [D03] |
| Broad statement “use database RLS as configured” | Enabled RLS and own-profile policy are documented separately from direct-pg role/claims/grants, all deployment-dependent. | [D07] [D09] [A04] |

The original diagrams do not demonstrate deployed behavior; neither do the new
ones. The SVG contains the same four pages as the editable native diagram,
arranged in a 2×2 atlas: **1 trust boundaries, 2 mobile flow, 3 verification,
4 staff workflows/gaps**. Native pages can be edited individually. Legend codes,
node IDs, and labelled decision branches are shared between formats. Dashed
edges denote manual/conditional progression, not an automatic notification/job.

## 9. Unresolved questions and verification work

1. Are migrations 001–003 applied to the intended project, with their trigger and
   policies intact? What additional deployed tables/policies, if any, exist?
2. What effective database role, grants, ownership and RLS/BYPASSRLS behavior does
   the API connection use? Are browser/public roles constrained as intended?
3. Are mobile API/callback URLs supplied by shell/EAS outside `.env.local`? Do
   devices have a reachable API origin rather than phone-local `localhost`?
4. Are Supabase confirmation, SMTP, Site URL, redirect allow-lists and password
   rules configured to support each client? Do PKCE links work on initiating
   devices and web recovery events reach the reset screen?
5. Who provisions the first administrator and later staff accounts? No in-repo
   seed/invite/role-change flow represents this administrative prerequisite.
6. What real clinic identity-check procedure supports `identity_verified:true`?
   Should receptionists have the same verification/demographic/appointment/report
   privileges as clinical roles? The present backend allows them.
7. Are historical pending duplicates or manual patient-role/link edits present?
   The account display and care gate use different proxies for approved status.
8. Do application writes/audit rollback, linkage conflict handling, and concurrent
   submissions/reviews behave correctly against actual PostgreSQL permissions?
9. Is immediate logout/revocation expected for already-issued access tokens?
   Signature validation alone does not prove this behavior for a deployed setup.
10. Confirm phone navigation/redirect behavior, authenticated back history, account
    switching, refresh after staff review, and no stale patient data on logout.
11. Implement separately reviewed clinical/inventory/scheduling/messaging schemas
    and endpoints before representing the planning baseline's advanced modules
    as functional. No such implementation was performed during this task.

The existing tests exercise Zod schemas and mobile validation/navigation/resource
helpers; they are not HTTP/database/end-to-end proof. `testDatabase.ts` is a
connection script, not a verification-workflow integration test. This audit did
not execute those tests or that script. [T01] [T02] [T03] [T04]

## 10. Artifact validation

The native draw.io file contains four editable pages; the SVG arranges those
same pages in a 2?2 atlas. Both passed XML parsing with DTD processing prohibited.
The shared graph has 78 workflow nodes and 77 edges; source references and line
bounds were checked, along with node geometry and edge endpoints.

Local .NET System.Drawing previews of the shared graph model were visually
inspected on all four pages, including a second inspection of the mobile and
verification detail. A rejection branch was rerouted to avoid the error box.
These previews approximate the vector layout; no draw.io application or SVG
renderer was available, so exact renderer fidelity and interactive editing were
not tested. No application, API, or deployed database runtime testing occurred.
Only the three requested documentation files are delivered.

## Evidence index

Paths and line spans refer to the inspected baseline; source links open at the
first cited line. These sources, not prior implementation summaries, support the
status tables above.

| ID | File and inspected lines |
| --- | --- |
| M01 | `apps/mobile/src/app/_layout.tsx:11–61` |
| M02 | `apps/mobile/src/components/care-tabs.tsx:8–30` |
| M03 | `apps/mobile/src/app/index.tsx:6–23` |
| M04 | `apps/mobile/src/app/account-type.tsx:4–13` |
| M05 | `apps/mobile/src/app/patient-type.tsx:4–14` |
| M06 | `apps/mobile/src/app/register.tsx:24–70` |
| M07 | `apps/mobile/src/app/login.tsx:17–43` |
| M08 | `apps/mobile/src/app/recover.tsx:10–52` |
| M09 | `apps/mobile/src/app/auth-callback.tsx:9–32` |
| M10 | `apps/mobile/src/app/reset-password.tsx:10–45` |
| M11 | `apps/mobile/src/lib/session.tsx:12–44` |
| M12 | `apps/mobile/src/lib/supabase.ts:8–91` |
| M13 | `apps/mobile/src/lib/account.ts:4–16` |
| M14 | `apps/mobile/src/lib/account-context.tsx:17–41` |
| M15 | `apps/mobile/src/app/verification.tsx:19–67` |
| M16 | `apps/mobile/src/app/verification-pending.tsx:8–37` |
| M17 | `apps/mobile/src/app/interests.tsx:8–46` |
| M18 | `apps/mobile/src/app/onboarding-complete.tsx:3–11` |
| M19 | `apps/mobile/src/app/(tabs)/dashboard.tsx:14–60` |
| M20 | `apps/mobile/src/app/(tabs)/appointments.tsx:8–21` |
| M21 | `apps/mobile/src/app/(tabs)/records.tsx:4–11` |
| M22 | `apps/mobile/src/app/(tabs)/profile.tsx:10–53` |
| M23 | `apps/mobile/src/app/(tabs)/clinic.tsx:7–19` |
| M24 | `apps/mobile/src/app/(tabs)/community.tsx:5–15` |
| M25 | `apps/mobile/src/app/(tabs)/learn.tsx:9–32` |
| M26 | `apps/mobile/src/lib/library.tsx:12–54` |
| M27 | `apps/mobile/src/lib/education.ts:1–14` |
| M28 | `apps/mobile/src/components/clinic-info.tsx:4–19` |
| M29 | `apps/mobile/src/app/settings.tsx:5–26` |
| M30 | `apps/mobile/src/hooks/use-care.ts:6–19` |
| M31 | `apps/mobile/src/components/resource-card.tsx:11–43` |
| M33 | `apps/mobile/src/lib/navigation.ts:1–4` |
| M34 | `apps/mobile/src/app/home.tsx:1–4`, `apps/mobile/src/app/explore.tsx:1–4` |
| W01 | `apps/web/src/App.tsx:29–86` |
| W02 | `apps/web/src/lib/portal.ts:14–34` |
| W03 | `apps/web/src/lib/supabase.ts:4–20` |
| W04 | `apps/web/src/components/login.tsx:17–51` |
| W05 | `apps/web/src/pages/patients.tsx:8–21` |
| W06 | `apps/web/src/pages/patients.tsx:25–32` |
| W07 | `apps/web/src/pages/patients.tsx:35–37` |
| W08 | `apps/web/src/pages/verification-requests.tsx:7–9` |
| W09 | `apps/web/src/pages/verification-requests.tsx:12–20` |
| W10 | `apps/web/src/components/patient-picker.tsx:6–11` |
| W11 | `apps/web/src/pages/appointments.tsx:8–12` |
| W12 | `apps/web/src/pages/appointments.tsx:15–28` |
| W13 | `apps/web/src/pages/reports.tsx:8–36` |
| W14 | `apps/web/src/pages/clinical.tsx:6–8` |
| W15 | `apps/web/src/pages/clinical.tsx:11–14` |
| W16 | `apps/web/src/pages/clinical.tsx:17–19` |
| W17 | `apps/web/src/pages/staff.tsx:7–10` |
| W18 | `apps/web/src/pages/settings.tsx:6–15` |
| W19 | `apps/web/src/pages/messages.tsx:5–14` |
| W20 | `apps/web/src/pages/dashboard.tsx:8–41` |
| W21 | `apps/web/src/lib/navigation.ts:3–15` |
| W22 | `apps/web/src/components/shell.tsx:40–44` |
| W23 | `apps/web/src/lib/auth.ts:42–75` |
| A01 | `apps/api/src/server.ts:16–43` |
| A02 | `apps/api/src/middleware/authenticate.ts:5–59` |
| A03 | `apps/api/src/middleware/authorize.ts:12–59` |
| A04 | `apps/api/src/config/database.ts:6–24` |
| A05 | `apps/api/src/routes/account.ts:6–20` |
| A06 | `apps/api/src/routes/account.ts:21–29` |
| A07 | `apps/api/src/routes/account.ts:30–33` |
| A08 | `apps/api/src/routes/account.ts:34–48` |
| A09 | `apps/api/src/routes/verification-review.ts:8–11` |
| A10 | `apps/api/src/routes/verification-review.ts:12–37` |
| A11 | `apps/api/src/routes/portal.ts:8–10` |
| A12 | `apps/api/src/routes/portal.ts:12–19` |
| A13 | `apps/api/src/routes/portal.ts:21–34` |
| A14 | `apps/api/src/routes/portal.ts:36–50` |
| A15 | `apps/api/src/routes/portal.ts:52–60` |
| A16 | `apps/api/src/routes/portal.ts:63–78` |
| A17 | `apps/api/src/routes/portal.ts:80–93` |
| A18 | `apps/api/src/routes/portal.ts:95–105` |
| A19 | `apps/api/src/routes/portal.ts:107–119` |
| A20 | `apps/api/src/routes/portal.ts:121–135` |
| A21 | `apps/api/src/routes/portal.ts:137–151` |
| A22 | `apps/api/src/routes/portal.ts:153–158` |
| A23 | `apps/api/src/routes/staff.ts:8–17` |
| A24 | `apps/api/src/validation/onboarding.ts:1–5` |
| A25 | `apps/api/src/validation/portal.ts:3–30` |
| D01 | `database/migrations/001_initial_schema.sql:8–100` |
| D02 | `database/migrations/001_initial_schema.sql:19–28` |
| D03 | `database/migrations/001_initial_schema.sql:31–39` |
| D04 | `database/migrations/001_initial_schema.sql:42–51` |
| D05 | `database/migrations/001_initial_schema.sql:54–68` |
| D06 | `database/migrations/001_initial_schema.sql:71–79` |
| D07 | `database/migrations/001_initial_schema.sql:95–100` |
| D08 | `database/migrations/002_authentication.sql:10–47` |
| D09 | `database/migrations/002_authentication.sql:53–57` |
| D10 | `database/migrations/003_mobile_onboarding.sql:3–10` |
| D11 | `database/migrations/003_mobile_onboarding.sql:11–19` |
| C01 | `apps/mobile/.env.example:1–11` |
| T01 | `apps/mobile/tests/refinement.test.ts:9–53` |
| T02 | `apps/api/src/validation/onboarding.test.ts:5–14` |
| T03 | `apps/api/src/validation/portal.test.ts:6–34` |
| T04 | `apps/api/src/config/testDatabase.ts:1–21` |

[M01]: ../../apps/mobile/src/app/_layout.tsx#L11
[M02]: ../../apps/mobile/src/components/care-tabs.tsx#L8
[M03]: ../../apps/mobile/src/app/index.tsx#L6
[M04]: ../../apps/mobile/src/app/account-type.tsx#L4
[M05]: ../../apps/mobile/src/app/patient-type.tsx#L4
[M06]: ../../apps/mobile/src/app/register.tsx#L24
[M07]: ../../apps/mobile/src/app/login.tsx#L17
[M08]: ../../apps/mobile/src/app/recover.tsx#L10
[M09]: ../../apps/mobile/src/app/auth-callback.tsx#L9
[M10]: ../../apps/mobile/src/app/reset-password.tsx#L10
[M11]: ../../apps/mobile/src/lib/session.tsx#L12
[M12]: ../../apps/mobile/src/lib/supabase.ts#L8
[M13]: ../../apps/mobile/src/lib/account.ts#L4
[M14]: ../../apps/mobile/src/lib/account-context.tsx#L17
[M15]: ../../apps/mobile/src/app/verification.tsx#L19
[M16]: ../../apps/mobile/src/app/verification-pending.tsx#L8
[M17]: ../../apps/mobile/src/app/interests.tsx#L8
[M18]: ../../apps/mobile/src/app/onboarding-complete.tsx#L3
[M19]: ../../apps/mobile/src/app/(tabs)/dashboard.tsx#L14
[M20]: ../../apps/mobile/src/app/(tabs)/appointments.tsx#L8
[M21]: ../../apps/mobile/src/app/(tabs)/records.tsx#L4
[M22]: ../../apps/mobile/src/app/(tabs)/profile.tsx#L10
[M23]: ../../apps/mobile/src/app/(tabs)/clinic.tsx#L7
[M24]: ../../apps/mobile/src/app/(tabs)/community.tsx#L5
[M25]: ../../apps/mobile/src/app/(tabs)/learn.tsx#L9
[M26]: ../../apps/mobile/src/lib/library.tsx#L12
[M27]: ../../apps/mobile/src/lib/education.ts#L1
[M28]: ../../apps/mobile/src/components/clinic-info.tsx#L4
[M29]: ../../apps/mobile/src/app/settings.tsx#L5
[M30]: ../../apps/mobile/src/hooks/use-care.ts#L6
[M31]: ../../apps/mobile/src/components/resource-card.tsx#L11
[M33]: ../../apps/mobile/src/lib/navigation.ts#L1
[M34]: ../../apps/mobile/src/app/home.tsx#L1
[W01]: ../../apps/web/src/App.tsx#L29
[W02]: ../../apps/web/src/lib/portal.ts#L14
[W03]: ../../apps/web/src/lib/supabase.ts#L4
[W04]: ../../apps/web/src/components/login.tsx#L17
[W05]: ../../apps/web/src/pages/patients.tsx#L8
[W06]: ../../apps/web/src/pages/patients.tsx#L25
[W07]: ../../apps/web/src/pages/patients.tsx#L35
[W08]: ../../apps/web/src/pages/verification-requests.tsx#L7
[W09]: ../../apps/web/src/pages/verification-requests.tsx#L12
[W10]: ../../apps/web/src/components/patient-picker.tsx#L6
[W11]: ../../apps/web/src/pages/appointments.tsx#L8
[W12]: ../../apps/web/src/pages/appointments.tsx#L15
[W13]: ../../apps/web/src/pages/reports.tsx#L8
[W14]: ../../apps/web/src/pages/clinical.tsx#L6
[W15]: ../../apps/web/src/pages/clinical.tsx#L11
[W16]: ../../apps/web/src/pages/clinical.tsx#L17
[W17]: ../../apps/web/src/pages/staff.tsx#L7
[W18]: ../../apps/web/src/pages/settings.tsx#L6
[W19]: ../../apps/web/src/pages/messages.tsx#L5
[W20]: ../../apps/web/src/pages/dashboard.tsx#L8
[W21]: ../../apps/web/src/lib/navigation.ts#L3
[W22]: ../../apps/web/src/components/shell.tsx#L40
[W23]: ../../apps/web/src/lib/auth.ts#L42
[A01]: ../../apps/api/src/server.ts#L16
[A02]: ../../apps/api/src/middleware/authenticate.ts#L5
[A03]: ../../apps/api/src/middleware/authorize.ts#L12
[A04]: ../../apps/api/src/config/database.ts#L6
[A05]: ../../apps/api/src/routes/account.ts#L6
[A06]: ../../apps/api/src/routes/account.ts#L21
[A07]: ../../apps/api/src/routes/account.ts#L30
[A08]: ../../apps/api/src/routes/account.ts#L34
[A09]: ../../apps/api/src/routes/verification-review.ts#L8
[A10]: ../../apps/api/src/routes/verification-review.ts#L12
[A11]: ../../apps/api/src/routes/portal.ts#L8
[A12]: ../../apps/api/src/routes/portal.ts#L12
[A13]: ../../apps/api/src/routes/portal.ts#L21
[A14]: ../../apps/api/src/routes/portal.ts#L36
[A15]: ../../apps/api/src/routes/portal.ts#L52
[A16]: ../../apps/api/src/routes/portal.ts#L63
[A17]: ../../apps/api/src/routes/portal.ts#L80
[A18]: ../../apps/api/src/routes/portal.ts#L95
[A19]: ../../apps/api/src/routes/portal.ts#L107
[A20]: ../../apps/api/src/routes/portal.ts#L121
[A21]: ../../apps/api/src/routes/portal.ts#L137
[A22]: ../../apps/api/src/routes/portal.ts#L153
[A23]: ../../apps/api/src/routes/staff.ts#L8
[A24]: ../../apps/api/src/validation/onboarding.ts#L1
[A25]: ../../apps/api/src/validation/portal.ts#L3
[D01]: ../../database/migrations/001_initial_schema.sql#L8
[D02]: ../../database/migrations/001_initial_schema.sql#L19
[D03]: ../../database/migrations/001_initial_schema.sql#L31
[D04]: ../../database/migrations/001_initial_schema.sql#L42
[D05]: ../../database/migrations/001_initial_schema.sql#L54
[D06]: ../../database/migrations/001_initial_schema.sql#L71
[D07]: ../../database/migrations/001_initial_schema.sql#L95
[D08]: ../../database/migrations/002_authentication.sql#L10
[D09]: ../../database/migrations/002_authentication.sql#L53
[D10]: ../../database/migrations/003_mobile_onboarding.sql#L3
[D11]: ../../database/migrations/003_mobile_onboarding.sql#L11
[C01]: ../../apps/mobile/.env.example#L1
[T01]: ../../apps/mobile/tests/refinement.test.ts#L9
[T02]: ../../apps/api/src/validation/onboarding.test.ts#L5
[T03]: ../../apps/api/src/validation/portal.test.ts#L6
[T04]: ../../apps/api/src/config/testDatabase.ts#L1
