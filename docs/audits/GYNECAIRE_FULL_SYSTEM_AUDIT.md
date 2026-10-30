# GYNECAIRE full-system audit and improvement roadmap

**Date:** October 30, 2026, Asia/Manila. **Scope:** audit only. **Repository baseline:** HEAD `7e8d0c4` plus the existing modified/untracked working tree, including the clinic configuration implementation. Findings concern that working tree, not just HEAD or an assumed deployed release.

Only this report was created by the audit. No application/configuration changes, installations, migrations, deployments, commits, test-account changes, Storage uploads/deletes, or production data writes were performed. Existing uncommitted work was preserved. Tests were compiled/executed in memory to avoid creating test artifacts; the web production bundle was generated in memory with output disabled.

## A. Executive summary

GYNECAIRE is a substantial **administrative and patient-onboarding foundation**, not yet a complete clinical records system. It has real Express/PostgreSQL implementations for patient demographics, staff-entered appointments, verification/linking, staff access management, own-profile updates, guarded demographic imports, avatars, and clinic configuration. The patient app has real account/preferences/verification and linked appointment-read contracts. Clinical assessments, medical documents, inventory, participant messaging, persistent notifications, and health monitoring are absent or explicitly unavailable.

The strongest controls are parameterized SQL, strict mutation schemas, database-derived staff roles, ownership-based patient reads, transactional verification linking, audit-coupled writes, optimistic staff/clinic edits, and the importer's mandatory encryption/scanning/admin gates. The design already has reusable web surfaces, theme preferences, accessible dialogs, and practical mobile touch targets. Preserve these foundations; no stack replacement is justified.

**Important defects and release gaps:**

1. **Confirmed client/API mismatch:** Clinic Configuration accepts arbitrary service names and the appointment form submits them, but `appointmentSchema` accepts only four hardcoded names. Custom configured services fail validation even though all 81 tests pass. Fix and add a cross-module contract test before claiming clinic/service integration is complete (F01).
2. **Confirmed local mobile configuration gap:** `EXPO_PUBLIC_API_URL` and `EXPO_PUBLIC_AUTH_REDIRECT_URL` are absent from inspected environment files and ambient command environment. The account client/recovery screen explicitly stop without them. This does not prove deployed builds lack the values, but the inspected local setup is incomplete (F02).
3. **Confirmed database hardening concern:** original client roles retain broad privileges, and the API SQL role has `BYPASSRLS`. RLS is enabled, but authorization therefore depends heavily on correct Express handlers. No privilege-escalation exploit was demonstrated (F03/F12).
4. **Clinical scope is unfinished:** Records and Checkups must not be mistaken for implemented clinical storage. There are no document/checkup/inventory/message/notification tables or endpoints in the inspected schema (F05/F20–F22).
5. **Production verification is incomplete:** mocks and schema tests are useful but do not prove real JWT/recovery delivery, concurrent PostgreSQL behavior, browser rendering, device behavior, or patient isolation under deployed roles (F04).

**Fresh database evidence changed during the audit.** The first catalog snapshot had the user's 12 tables and no `clinic_settings`; a later read had **13 tables**, adding `clinic_settings`. A targeted refresh confirmed its columns/constraints/RLS match the intended singleton model and that **no configuration row exists**. The auditor issued only read-only transactions; the cause/timing of the changed catalog result was not established and should be reconciled with the operator's target/configuration and migration history. It was not an agent-applied migration. The latest observed state takes precedence over earlier reports saying migration 006 is missing. **Do not recreate or blindly rerun migration 006 against the now-existing table.** Complete first setup/acceptance testing (F11).

**Automated outcome:** 59 API + 14 web + 8 mobile tests = **81 passed, zero skipped**. API/web/mobile TypeScript passed. Web ESLint passed. An in-memory Vite production build passed. Mobile has no ESLint configuration; a supplemental run with the web config reports five Fast Refresh export-rule errors. No rendered browser/device test or live write workflow was performed. The green tests are not a production-readiness certificate.

### Evidence conventions and limitations

- **S:** directly inspected source/configuration/migrations. `path:line` references are relative to this repository and reflect this working tree.
- **T:** a check actually executed in this audit. Test success has its stated unit/mock/in-memory scope.
- **L1:** initial read-only Supabase catalog snapshot: 12 public tables, no clinic settings.
- **L2:** later read-only catalog/clinic refresh: 13 public tables, clinic schema present, no configuration row.
- **U:** requires browser, device, deployed Auth, live authorization/write integration, operational measurement, or clinic-policy verification.

Live queries inspected catalogs, constraints, privileges, policies, indexes, bucket configuration and the existence of the singleton clinic row. No patient rows, Auth user list, clinical records, import contents or secrets were extracted. No destructive security probes were used. Existing architecture reports were treated as historical claims and checked against current code; some are stale.

### Actual stack and architecture

| Layer | Observed architecture |
|---|---|
| Workspace | npm workspaces (`apps/*`), root lockfile plus legacy nested app lockfiles; substantial existing uncommitted changes. Root `test` is a failing placeholder (`package.json:10`). |
| Staff web | React 19.3.1, TypeScript 5.9, Vite 8.3, Supabase JS 2.118; custom hash navigation, lazy pages, React state/context/hooks, fetch-based `staffApi`, CSS semantic tokens. No second React routing library is needed. |
| Patient mobile | Expo SDK 58, React 19.3.0, React Native 0.88, Expo Router 58, TypeScript 6; native SecureStore/session handling, browser localStorage, account-scoped contexts. Active care UI is light-themed. |
| API | Express 5.3, TypeScript 7 CLI/tsx runtime, Zod 4.6.7, jose 6, node-postgres 8.23, Helmet/CORS. Direct PostgreSQL pool, not browser-supplied SQL sessions. |
| Files/imports | Private Supabase avatar bucket, sharp 0.35.5; CSV/XLSX workers, csv-parse/ExcelJS/yauzl, ClamAV INSTREAM, AES-GCM encrypted staging/HMAC identifiers. |
| Database | Supabase PostgreSQL; migrations 001–006 in repository; latest live catalog has 13 public application tables. No Supabase migration ledger was found by `to_regclass('supabase_migrations.schema_migrations')`. Matching schema is not proof of an exact migration execution history. |
| Testing/operations | Node test runner, TypeScript checks, web ESLint; no `.github/workflows` directory or mobile ESLint/EAS configuration was found. Hosted pipelines/backups may exist outside the repository and were not verified. |

## B. Module status matrix

Statuses use the requested meanings: **Working and verified**, **Implemented but unverified**, **Partially implemented**, **UI only**, **Blocked**, **Missing**. “Verified” never means a deployed workflow unless explicitly stated. All visual pages below are source/build inspected; **actual rendering, keyboard interaction and responsive screenshots were not exercised**. Shared route/unit tests cannot establish every button's runtime behavior.

### Staff/admin web portal

| Module | UI status | API status | Database status | Security status | Overall status |
|---|---|---|---|---|---|
| Staff login/recovery | Implemented but unverified: credential/recovery forms, busy/error states | Supabase Auth then staff `/session`; source connected | Profiles/staff tables + profile trigger verified in catalogs | JWT issuer/audience/role and active membership checks exist; real login/email/MFA U | **Implemented but unverified** |
| Dashboard | Implemented but unverified: schedule/trends/activity and linked Quick Actions | `/overview`, `/reports`, clinic settings connected | Real aggregate SQL; no live patient/statistic reads in audit | Active staff guard; recent audit feed shared across staff | **Partially implemented**: inventory metric is explicitly unavailable |
| Patients | Directory/search/link filters, pagination, create/edit/profile modal connected in source | GET list/detail, POST, PUT; no delete/archive | Demographic schema/FKs/indexes exist; mocked CRUD tested | Strict write fields; cannot assign `profile_id`; all supported staff share access | **Implemented but unverified** for demographics; clinical/status tabs incomplete |
| Patient verification | Pending queue, patient picker, identity checkbox, approve/reject | Account submission + staff decision endpoints; transactional link/promotion | Verification + unique patient/profile linkage exist | No self-approval API; staff identity rechecked in transaction; real cross-account/concurrent tests U | **Implemented but unverified**; no reason/history workflow |
| Historical import | Dedicated six-step workspace/history/error export/duplicate review | Full staging/validation/decisions/confirmation/cancellation API | Four encrypted staging/provenance/event tables exist | Intrinsic admin guard, scanner/key/flag gates, atomic confirmation, no automatic account linkage | **Blocked** locally by approval/key/scanner configuration; code substantially implemented |
| Appointments | List/filters/create/status/date edits; configured service suggestions | Staff CRUD subset connected; configured-service enum conflict F01 | Appointments + patient FK; no provider, duration, capacity/availability model | Staff guards, audits, final-status lock; no booking ownership endpoint for mobile | **Partially implemented** |
| Medical Records | Patient context works in source; file area explicitly unavailable | No medical document/clinical-record endpoint | No clinical/document metadata tables/bucket established | No unguarded medical file upload was found; future patient-specific ACL needed | **UI only** for records |
| Checkups | Completed-appointment history, not an assessment form | Reuses appointments API | No vitals/findings/checkup entities | Existing staff read guard; no clinical-assessment authorization model | **Partially implemented** as visit history; assessments **Missing** |
| Inventory | Honest unavailable state and navigation links | Missing item/movement endpoints | Missing item/movement schema | No stock mutation path to audit | **UI only** |
| Messages/assistant | Honest unavailable state + connected workflow links | Missing conversations/participants/messages/assistant backend | Missing messaging schema | No message leakage path demonstrated; participant ACL not implemented | **UI only** |
| Reports & Analytics | Date bounds, report view, charts, CSV aggregate export | Completed appointments/newly created patient records only | Actual aggregate query paths; no financial or medical analytics schema | Staff guard, CSV formula-prefix protection; export audit absent | **Partially implemented** |
| Staff management | Search/status directory + reviewed access modal | Admin-only membership role/status update | Existing staff table; version-like expected role/status checks | Transactional active-admin recheck, self-change refusal and audit | **Partially implemented**: no invitation/bootstrap/provisioning |
| Settings: own profile/password | Name/phone, Auth details, photo controls, password/current-password/optional nonce | Own-profile GET/PATCH + Supabase Auth + avatar GET/PUT/DELETE | Profile/avatar references/cleanup exist | Ownership/path checks and audit; current API role bypasses RLS; full live lifecycle U | **Implemented but unverified** end to end |
| Clinic Configuration | Complete editor/read-only staff form, hours/services/policies/sharing/dirty states | Staff GET/admin PUT/account-safe GET implemented | **L2: table exists, zero config row**, intended constraints/RLS present | Strict schema, optimistic version, locked admin recheck, publication projection | **Implemented but unverified**; first configuration and live integration still needed |
| Theme preferences | Light/Dark/System chooser; persistence/tab/OS synchronization | Local preference, intentionally no API | Browser storage only | No clinical data stored in theme preference | **Working and verified** for preference logic; rendered colors U |
| Notifications | Bell explains lack of live delivery; Settings delivery labels unavailable | No list/unread/preferences/events endpoint | Missing notifications/preferences/outbox | No recipient authorization implemented | **UI only** |
| Privacy & Account | Policy links conditional on approved HTTPS configuration; account details/sign-out/security exist | Auth sign-out/password/recovery exist; device controls absent | No policy-version/acceptance publishing/retention entities | No automatic deletion offered; approved policy URLs absent locally | **Partially implemented** |

Evidence: `apps/web/src/App.tsx:18`, `:87`; `pages/dashboard.tsx:10`; `patients.tsx:16–39`; `verification-requests.tsx:8–20`; `patient-imports.tsx:15–47`; `clinical.tsx:9–20`; `messages.tsx:3`; `reports.tsx:10–25`; `staff.tsx:8–20`; `settings.tsx:46–66`; `clinic-settings.tsx:8–32`; corresponding `apps/api/src/routes/portal-router.ts:14–172`, `account.ts:7–50`, `apps/api/src/routes/verification-review.ts:8–37`, `apps/api/src/routes/profile-avatar.ts:42–94`, `clinic-settings.ts:8–34`.

### Patient mobile application

| Module | UI status | API status | Database status | Security status | Overall status |
|---|---|---|---|---|---|
| Welcome/guest/general-user routing | Welcome, guest education/clinic/community/profile; tabs selected from backend account type | Guest content local; account read requires API URL | No guest record fabricated | Expo protected routes + backend access control; routing logic tested | **Partially implemented**; local backend URL absent |
| Registration/account-type selection | General/clinic and new/existing intent; consent checkbox and confirmation state | Supabase `signUp`; onboarding metadata controls routing, not roles | Auth-to-profile trigger exists; always creates general account in migration | No frontend role promotion; live mail/callback settings U | **Implemented but unverified** |
| Login/logout/session restore | SDK credentials, local busy/error states, account reset/abort handling | Auth SDK + `/account` | Native session SecureStore, web localStorage | No printed credentials; actual device refresh/logout isolation U | **Implemented but unverified**; account load locally blocked |
| Recovery/password change | Recovery screen + PKCE callback + reset form | SDK flow; recovery explicitly requires redirect variable | Auth provider persistence | Recovery URL absent locally; ordinary password-change path does not supply current password/nonce | **Blocked** locally for recovery; policy verification needed |
| Interests/onboarding completion | Select/save/skip; routes to optional verification | `/account/preferences` POST | `account_preferences.interests` exists | Auth identity drives upsert; interests are not clinical measurements | **Blocked** locally by API URL; implementation present |
| Verification submission/status/resubmission | New/existing intake, consent, pending/approved/rejected UI | `/account/verification`, `/account` | Intake/review fields exist; no rejection-reason field | General-only submission and server staff linkage | **Blocked** locally by API URL; source workflow implemented |
| General-user Home | Topic search, category links, interest-ranked resources, clinic request navigation | Backend account context + local resources | Preferences only | General users do not receive patient appointments | **Partially implemented** |
| Verified patient Home | Next recorded appointment + records/visit links | `/account/care` | Reads linked patient's appointments | Backend derives patient from authenticated profile and account type | **Blocked** locally by API URL; no clinical progress data |
| Appointments | Upcoming/past/all filters + refresh, explicit 100-visit cap | Read-only `/account/care`; no patient booking/cancel/reschedule | Existing staff-entered appointments only | Caller cannot choose another patient ID | **Partially implemented**, read path locally blocked |
| Medical history/records | Prenatal/Postnatal/Other empty states clearly say unavailable | Missing | Missing clinical/document schema | No invented health history | **UI only** |
| Health/pregnancy monitoring | Dashboard explicitly says not connected; no measurements route discovered | Missing | Missing pregnancy/measurements/checkup relationships | No clinical inference implemented | **Missing** |
| Education/search/bookmarks | Four WHO resource links; search/category/save actions | Local catalog, external links; no CMS | Bookmarks are per-account/device storage; no cloud bookmark table | Safe resource ID parsing, signed-out users prompted to log in | **Working and verified** for filtering/storage parsing; actual links/device actions U |
| Community | Moderation/readiness explanation and education link | No posting/replies backend | Missing | No public patient posts exposed | **UI only** |
| Profile/settings | Read-only account details, interests, bookmarks, help, password, logout | No mobile personal-profile edit/photo contract; staff profile API is staff-only | Existing profile reads; patient editing absent | Backend roles drive patient navigation; account isolation in contexts | **Partially implemented** |
| Clinic information | Signed-in shared projection + guest environment fallback | `/account/clinic`; no anonymous configuration API | L2 singleton exists but no saved/shared configuration | Publication flag and output whitelist; stale mounted view possible | **Partially implemented**, locally blocked by API URL |
| Notifications/language/theme | Text says push/language unavailable; care UI light-only | Missing delivery/preferences | Missing | No push recipient/device implementation | **Missing** beyond explanatory UI |

Evidence: `apps/mobile/src/app/_layout.tsx:29–49`, `(tabs)/dashboard.tsx:14–60`, `(tabs)/appointments.tsx:8–20`, `(tabs)/records.tsx:4–10`, `(tabs)/profile.tsx:15–46`, `(tabs)/community.tsx:4–12`, `(tabs)/learn.tsx:15–31`, `register.tsx:24–55`, `recover.tsx:18–35`, `verification.tsx:24–54`, `verification-pending.tsx:15–35`, `lib/account.ts:3–17`, `components/clinic-info.tsx:5–30`, `lib/education.ts:1–14`, `lib/library.tsx:12–54`.

### End-to-end traces and exact stopping points

| Workflow | Actual chain | Stop/verification boundary |
|---|---|---|
| Staff login | Login → Supabase password sign-in → JWT → Express `/staff/session` → profiles/staff → Shell | Source connected; valid JWT/provider/recovery/browser flow not executed. `/staff/dashboard` is an older authorization probe, not dashboard statistics. |
| Patient registration | Account selection → SDK sign-up → Auth trigger → general profile → interests/optional clinic verification | Auth trigger exists; local callback/API configuration missing; mail delivery and native deep link U. |
| Verification/linking | Intake POST → profile lock/pending check → verification+audit → staff review → request/staff/profile/patient locks → patient link + account promotion + audit | Transaction source is coherent; no live submission, competing approval, rollback or two-patient isolation test. |
| Patient demographics | Patients form → staff POST/PUT → table lock + case-insensitive duplicate check → patients+audit → refreshed directory | Mock HTTP CRUD passes; real SQL transaction/browser save not executed. No archive/delete policy implemented. |
| Appointment creation/approval | Staff form → POST pending → PATCH status/time → appointments+audit → linked mobile care read | Fixed enum rejects custom configured services. No mobile request endpoint, assignment/conflict engine or policy enforcement. |
| Historical import | File → admin gate → scanner → worker parser → encrypted staging → mapping/duplicate decisions → locked transaction → patients with NULL profile link + provenance/audit | Local approval/key/scanner absent; parser/mock transaction tests pass. Real scanner deployment and database import unverified. |
| Avatar | Photo picker → authenticated raw PUT → decoder → private unique Storage object → own path+audit transaction → signed GET → shared Avatar | All code paths present and unit tests pass. Bucket configuration read in audit; no live upload/replace/remove/session-persistence test performed here. Prior report's smoke check is historical evidence only. |
| Clinic configuration | Staff GET/admin PUT → schema/optimistic revision/admin lock → singleton+audit → Dashboard/services suggestions/mobile-safe projection | Latest table exists but no saved row; no live save. Custom services conflict with appointment enum. Sharing is opt-in; anonymous data is not added. |
| Inventory | UI availability panel → no item/movement API | Stops before API/database. |
| Medical record retrieval | Patient context picker → demographics/appointment profile; Records tabs are unavailable | Stops before medical metadata/file authorization/storage. |
| Messaging | Module explanation/links → no conversation API | Stops before participants/messages persistence/delivery. |
| Notifications | Bell/settings explanatory content → no notification API | Stops before event generation, recipients, unread state and preferences. |

## C. Prioritized findings

Each finding identifies an observed problem/gap and distinguishes unverified consequences. Complexity is relative: Small, Medium or Large. Proposed changes are recommendations only; none were implemented during this audit.

### P0 — Critical

**No P0 exploit, patient-data corruption or cross-patient disclosure was demonstrated.** This is not assurance that none exists: no destructive tests, valid-user penetration test, deployed browser test or production-write integration was performed. Vulnerable-version advisories and broad grants below must be triaged by reachable code path and deployed privilege boundary, not automatically relabeled a proven critical breach.

### P1 — High

#### F01 — Appointments / clinic services: incompatible service contract

**Problem/root cause (confirmed S/T):** the new form accepts/suggests arbitrary clinic services; the API still uses a four-value enum. Evidence: `apps/web/src/pages/appointments.tsx:17–30`; `apps/api/src/validation/portal.ts:10–14`; `apps/api/src/validation/clinic-settings.ts:14`. A synthetic in-memory probe accepted `Prenatal consultation` and rejected `Synthetic custom service`. **Impact:** custom configured services cannot create appointments; current tests miss a core integration failure.

**Recommended fix:** define one server-owned service contract/catalog and preserve historical labels; decide how inactive/custom services behave and validate consistently. **Dependencies:** clinic settings/service model; no need to replace the stack. **Complexity:** Medium. **Verification:** real and mocked creation with configured/custom/removed services; unchanged historical appointment views; invalid-service rejection; cross-module contract regression.

#### F02 — Mobile integration: local API and recovery configuration missing

**Problem/root cause (confirmed configuration/S):** `EXPO_PUBLIC_API_URL` and `EXPO_PUBLIC_AUTH_REDIRECT_URL` are absent from inspected `.env*` development files and ambient environment. `apps/mobile/src/lib/account.ts:3–8` throws before account requests without the API URL; `app/recover.tsx:18–24` stops without the redirect URL. **Impact:** local account/preferences/verification/care/clinic reads and recovery cannot complete from this configuration. Deployed builds may supply different values; that was not verified.

**Recommended fix:** document/provision environment-specific HTTPS API and approved PKCE callback/deep-link URLs, including physical-device network reachability. **Dependencies:** API deployment/CORS and Supabase redirect allowlist. **Complexity:** Small setup, Medium cross-platform verification. **Verification:** actual device/browser registration-confirmation, recovery, general/patient reads and account switching; no secret pasted into client variables.

#### F03 — Database: broad client grants and powerful backend role

**Problem/root cause (confirmed L1/L2):** anon/authenticated have SELECT/INSERT/UPDATE/DELETE/REFERENCES/TRIGGER/TRUNCATE grants on seven original tables; the API role reports `rolbypassrls=true`. RLS is enabled, and only the own-profile SELECT policy was initially present. `handle_new_user` remains executable by anon/authenticated despite the PUBLIC revoke. Evidence: catalog checks in E/F; `database/migrations/001_initial_schema.sql:94–100`, `002_authentication.sql:38–57`, `003_mobile_onboarding.sql:9`; backend pool `apps/api/src/config/database.ts:16–23`.

**Impact:** excessive privilege/blast radius; table-level operations are not all covered by row policies. A trigger-returning function's EXECUTE grant alone is not proof it can be called as an exploitable RPC. **Recommended fix:** inspect default privileges, role inheritance and exposed RPCs; explicitly revoke unneeded client/table/function capabilities and give a backend-only role the minimum required access. **Dependencies:** role inventory and isolated RLS/permission tests. **Complexity:** Medium. **Verification:** negative anon/authenticated tests, every intended client read, backend CRUD and recovery/rollback; never disable RLS or expose service credentials to work around permission failures.

#### F04 — QA/release: missing real Auth/PostgreSQL/browser integration coverage

**Problem/root cause (confirmed S/T):** most HTTP tests inject identities and query doubles, while validation tests only check schemas. `routes/portal-router.test.ts:10–38`, `apps/api/src/routes/clinic-settings.test.ts:17–45`, `apps/api/src/routes/settings-profile.test.ts:10–30`; `config/testDatabase.ts` is only a connection probe. **Impact:** 81 green tests coexist with F01 and do not establish JWT validation, actual SQL semantics, RLS, concurrency, provider emails or rendered routes. No dedicated integration database configuration was found in inspected API env files.

**Recommended fix:** add an isolated Supabase/PostgreSQL test environment, real signed users, two-patient ownership fixtures, transaction/rollback/concurrent-admin tests and browser/device acceptance gates. **Dependencies:** safe test project and approved synthetic accounts/data. **Complexity:** Large. **Verification:** reproducible CI run including wrong issuer/audience/expired JWTs, unauthorized IDs, revoked membership, stale edits and browser imports/avatar flows. Never run write suites against the production URL by default.

#### F05 — Clinical care: medical records and assessments are not implemented

**Problem/root cause (confirmed S/L):** Records and Checkups have no clinical entities/endpoints; the latter shows completed appointments. `apps/web/src/pages/clinical.tsx:9–20`, `patients.tsx:37–39`; mobile `(tabs)/records.tsx:4–10`, `(tabs)/dashboard.tsx:60`. The latest public table inventory has no medical document, encounter, pregnancy or measurement table. **Impact:** the system cannot yet serve as a complete clinical record/monitoring system.

**Recommended fix:** design clinic-approved encounter/checkup/measurement/document models, patient/staff access rules, amendment/retention policy and private scanned/quarantined document storage. **Dependencies:** F03/F04/F08 and a signed-off clinical scope/role matrix. **Complexity:** Large. **Verification:** patient-specific access, unrelated staff denial where required, immutable history/amendment auditing, malicious-file handling and actual authorized retrieval. Keep unavailable labels until backend/storage controls are proven.

#### F06 — Scheduling: staff visit records are not online booking

**Problem/root cause (confirmed S):** only staff create/update endpoints exist; `/account/care` reads visits. There is no provider/resource assignment, duration/capacity model, collision prevention, patient request/cancel/reschedule API or enforced cancellation policy. `apps/api/src/routes/portal-router.ts:121–148`, `account.ts:10–21`; web `appointments.tsx:14–30`; mobile `(tabs)/appointments.tsx:19`. **Impact:** duplicate/conflicting or past appointments are not prevented by a booking engine; configured rules are guidance only, as the UI states.

**Recommended fix:** agree scheduling rules and model appointment lifecycle/capacity before exposing patient booking. **Dependencies:** F01, clinic policy decisions, staff/provider permissions and F04. **Complexity:** Large. **Verification:** simultaneous booking, invalid/past/timezone cases, request approval, ownership, cancellations, idempotent retry and preservation of existing appointments.

#### F07 — Privileged access: MFA/provisioning lifecycle not enforced in app

**Problem/root cause (confirmed source, deployment U):** JWT middleware checks issuer/audience/role but not assurance level; there is no administrator MFA challenge/enforcement flow. Staff management cannot invite/provision a first/new staff account (`apps/api/src/middleware/authenticate.ts:40–55`; `apps/web/src/pages/staff.tsx:13–20`). **Impact:** administrative security/onboarding relies on external manual procedures; whether clinic policy already enforces provider controls is unknown.

**Recommended fix:** approve a role matrix and provisioning/deprovisioning runbook, add server-enforced MFA assurance for privileged operations when required, and audited staff invitations/provisioning. **Dependencies:** Supabase Auth capabilities/policy, F03/F04. **Complexity:** Medium–Large. **Verification:** first-admin recovery, last-admin protections, demotion/inactivation, AAL1 versus AAL2 behavior and absence of browser-selectable roles. Do not treat the existing generic Auth registration helper as staff invitation support.

#### F08 — Privacy/operations: approved policies and recovery/retention proof absent

**Problem/root cause (confirmed local gaps; operational U):** approved policy URLs are absent locally; mobile registration records a checkbox state but no policy-version acceptance artifact. Devices/session management and account deletion remain unavailable. `apps/web/src/pages/settings.tsx:49–58`; mobile `register.tsx:25–32,65–69`, `settings.tsx:12–21`. Backup/PITR/restore, retention and incident-response settings were not verified in Supabase Dashboard. **Impact:** no demonstrated production privacy/retention/recovery acceptance baseline.

**Recommended fix:** have authorized clinic/legal owners approve documents and retention/access procedures; retain versioned consent where required; verify backups/restore drills and revocation behavior. **Dependencies:** clinic governance, Auth/email configuration, F03/F04. **Complexity:** Medium policy work plus implementation. **Verification:** actual published links, consent versions, restore exercise in isolation and documented data subject/medical retention handling. This audit is not legal compliance certification; do not auto-publish generated legal text or add hard deletion casually.

#### F09 — Dependencies: advisory matches require reachability review

**Problem (confirmed registry/lock metadata, exploit U):** current npm bulk advisory results match locked `csv-parse` 6.2.1, `deepmerge` 4.3.1, `uuid` 8.3.2 and root `zod` 3.25.76. Evidence: `package-lock.json:7660,7740,13172,13586`; details in F. API's directly resolved Zod is 4.6.7, not the older root copy. **Impact:** unresolved dependency risk; package presence does not establish a reachable clinic exploit. In particular the CSV advisory concerns the `columns` path, while this parser produces arrays.

**Recommended fix:** map each instance to its consumer/runtime, consult maintainer guidance, update compatible parents/versions and rerun parser/native/build checks. **Dependencies:** an approved dependency maintenance change; no packages were installed here. **Complexity:** Medium. **Verification:** lockfile resolution, importer CSV/XLSX adversarial fixtures and native/web build compatibility; do not force a breaking major override without tests or label dev-only exposure a proven production breach.

#### F10 — Historical import: secure implementation is not an enabled release

**Problem/root cause (confirmed local S/env):** import approval/retention switches, encryption key and ClamAV host/port are absent locally. Readiness fails closed (`apps/api/src/imports/router.ts:15,35,40,54,77`; `crypto.ts:2–10`; `scanner.ts:3–12`). **Impact:** real patient uploads/confirmation remain blocked by design, despite all parser tests now passing. Historical documentation still says dependencies were unavailable.

**Recommended fix:** finish isolated full-pipeline integration, private maintained scanner deployment, key management and explicitly approved enablement/retention scheduling. **Dependencies:** F03/F04/F09, key backup/retention policy. **Complexity:** Medium–Large operational integration. **Verification:** real scanner verdicts, SQL duplicate races, rollback, completed-job replay, encryption recovery and TTL cleanup with synthetic data. Do not bypass security gates or upload real patient files as a smoke test.

### P2 — Medium

#### F11 — Clinic configuration: latest schema exists, first setup unverified

**Problem/root cause (confirmed L2):** the table appeared externally during the audit and has no singleton configuration row. Its schema/RLS were refreshed, but no API save or UI session was tested. `database/migrations/006_clinic_settings.sql:4–35`; `apps/api/src/routes/clinic-settings.ts:15–34`; web editor `clinic-settings.tsx:23`. **Impact:** no actual clinic facts can yet be displayed from this configuration; older “migration missing” reports are stale.

**Recommended fix:** reconcile the operator's applied SQL history; verify grants and perform a real first-admin save/refresh/stale-edit/rollback acceptance test. **Dependencies:** F01/F04 and approved actual clinic details. **Complexity:** Small–Medium. **Verification:** version increments, audit actor, read-only staff view, publication off/on and safe mobile projection. Do not rerun resource-creation SQL against the existing table merely because no migration ledger exists.

#### F12 — Core mutations: in-transaction staff revocation recheck is inconsistent

**Problem/root cause (confirmed S; race effect U):** patient create/update and appointment create/update check staff access in outer middleware but do not lock/recheck that eligibility inside their transactions. Other sensitive modules do. Evidence: `apps/api/src/routes/portal-router.ts:71–105,121–148` versus `apps/api/src/routes/verification-review.ts:21–23`, `apps/api/src/routes/staff-access.ts:18–20`, `clinic-settings.ts:23`. **Impact:** an already authorized in-flight mutation can race account inactivation; this is not an unauthenticated endpoint.

**Recommended fix:** adopt a common transaction authorization/lock order for sensitive writes. **Dependencies:** F04 and privilege policy. **Complexity:** Medium. **Verification:** revoke during an in-flight write, competing admin updates/deadlocks, valid staff writes and audit rollback under actual PostgreSQL.

#### F13 — CRUD: retry safety and lost-update protection are uneven

**Problem/root cause (confirmed S):** normal patient/appointment creation has no idempotency key; patient edits and appointment reschedules lack expected-version checks. `apps/api/src/routes/portal-router.ts:71–105,121–147`; compare imports and clinic settings. **Impact:** lost responses can create duplicate appointments, and concurrent valid edits can overwrite changes; actual occurrence was not tested.

**Recommended fix:** add operation idempotency and optimistic revisions where workflow warrants, with user-facing conflict recovery. **Dependencies:** F04/F06; likely additive schema design. **Complexity:** Medium. **Verification:** duplicate submission after timeout, concurrent edits, successful retries and non-replay of audit actions.

#### F14 — Scalability: broad table locks and per-row import queries need measurement

**Problem/root cause (confirmed design; performance U):** patient writes/import confirmation lock the patients table; import validation/confirmation performs several sequential queries per row. List search uses leading-wildcard ILIKE. `apps/api/src/routes/portal-router.ts:48–55,79,99`; `imports/service.ts:28–64`. **Impact:** large imports may hold locks/occupy the five-connection pool and delay staff operations. Mock batching tests prove memory behavior, not production throughput.

**Recommended fix:** benchmark approved synthetic datasets, inspect query plans, bound transaction/request work and optimize identity/index strategy before replacing conservative safety locks. **Dependencies:** F04 and duplicate semantics. **Complexity:** Medium–Large. **Verification:** 10,000-row benchmark, concurrent staff reads/writes, lock/connection limits and identical duplicate/retry correctness.

#### F15 — Auditability: sensitive reads and usable audit review are incomplete

**Problem/root cause (confirmed S):** demographics reads and aggregate report exports lack access/export audit events, and the web exposes only six recent actions rather than an audit investigation interface. Audit rows have no structured change metadata. `apps/api/src/routes/portal-router.ts:39,60–66,151–163`; web `reports.tsx:18–22`; schema `001_initial_schema.sql:71–78`. **Impact:** limited investigation/reconstruction of who accessed or changed relevant information.

**Recommended fix:** define sensitive-read/export auditing, minimal non-PHI change metadata, retention and an administrator audit viewer. **Dependencies:** privacy policy, F03/F04, clinical/document design. **Complexity:** Medium. **Verification:** authorized access creates appropriate events, denied requests do not leak identifiers, failures are handled consistently and logs avoid raw medical/file data.

#### F16 — Navigation/state: unknown-route fallback and draft loss

**Problem/root cause (confirmed source):** unknown hashes silently become Dashboard; Settings/import drafts are component-local while main sidebar hash navigation unmounts pages without a complete dirty-route guard. Import `view` is initialized from the URL but later tab changes are local state. `lib/navigation.ts:12–25`; `App.tsx:52,94`; `components/shell.tsx:46`; `pages/clinic-settings.tsx:10–15`; `patient-imports.tsx:17,44–47`; `patient-import-page.tsx:5–8`. **Impact:** lost unsaved work/confusing refresh/history behavior. Canonical import aliases pass tests; the formerly reported canonical redirect was not reproduced here.

**Recommended fix:** explicit unknown-route state, one URL/view contract, and accessible draft-discard navigation handling. **Dependencies:** existing hash architecture, no new router required. **Complexity:** Medium. **Verification:** import button/direct URL/refresh/Back, history-to-wizard query changes, invalid hashes and dirty navigation/refresh/logout scenarios.

#### F17 — Auth UX: any forbidden operation is treated as whole-portal access loss

**Problem/root cause (confirmed source):** `staffApi` dispatches `portal-access-lost` for every 403, and App switches to login. `apps/web/src/lib/portal.ts:25–28`; `App.tsx:51`. **Impact:** a still-authorized staff member receiving an operation-specific denial may be pushed out rather than shown a forbidden action. Backend authorization remains essential and is not bypassed.

**Recommended fix:** distinguish expired/revoked staff sessions from operation-specific forbidden responses using stable API codes and a session recheck. **Dependencies:** response/error contract. **Complexity:** Small–Medium. **Verification:** demoted administrator, inactive account, ordinary forbidden operation and expired JWT produce the appropriate separate outcomes.

#### F18 — Mobile theme: active care experience is light-only

**Problem/root cause (confirmed S):** `apps/mobile/app.json:10` specifies light mode, and active `care-ui.tsx:164–184`, `care-tabs.tsx:19` use the light brand palette. A generic dark palette/useTheme exists but is not wired into the active care system. **Impact:** the native app does not implement the portal's Light/Dark/System experience. This is a known implementation gap, not evidence of white blocks accidentally appearing in an intended active dark theme.

**Recommended fix:** agree whether native dark mode is required; if so, adapt shared semantic colors and OS/user preference across active components. **Dependencies:** visual regression/device accessibility work. **Complexity:** Medium. **Verification:** both themes, native/web targets, large text, keyboard/error states and contrast rather than global inversion.

#### F19 — UI/UX accessibility: rendered and assistive-technology coverage is missing

**Problem (coverage gap, not a claimed reproduced rendering defect):** static accessibility attributes and contrast tests do not establish focus, screen-reader semantics, touch/large-text layouts or real CSS cascade. Tab labels cap font scaling (`mobile/components/care-tabs.tsx:18–19`); web dialogs/drawer have explicit focus code (`components/ui.tsx:22–31`, `shell.tsx:25–41`). **Impact:** possible clipped navigation, focus traps or inadequate contrast remain unverified.

**Recommended fix:** create a viewport/keyboard/screen-reader/large-text acceptance matrix and fix reproduced issues while preserving branding. **Dependencies:** browser/device harness F04. **Complexity:** Medium. **Verification:** 320 px through desktop, 200% zoom, VoiceOver/TalkBack, reduced motion, modal/drawer focus return, status/error announcements and accessible table/chart alternatives.

#### F20 — Inventory: no stock model or movement workflow

**Problem/root cause (confirmed S/L):** only an unavailable panel exists (`web/pages/clinical.tsx:19`); no item/movement tables/endpoints exist. **Impact:** stock, thresholds, receipt/usage/adjustment and low-stock metrics cannot be produced. The Dashboard correctly shows no stock value.

**Recommended fix:** clinic-approved units/categories, immutable movement ledger, item lifecycle, reasoned adjustments and transactional stock validation. **Dependencies:** F03/F04, approved inventory workflow; notifications later. **Complexity:** Large. **Verification:** concurrent receive/use, negative stock rules, adjustments, audit, thresholds, search and actual UI persistence with synthetic stock only.

#### F21 — Messaging/Community: no secure communication implementation

**Problem/root cause (confirmed S/L):** messages and community are explanations/links; no conversation/participant/message/moderation model exists (`web/pages/messages.tsx:3`; mobile `(tabs)/community.tsx:4–12`). **Impact:** clinic communications are not delivered through the system.

**Recommended fix:** participant-authorized clinic messaging with retention, unread state, pagination and polling; treat public community moderation as a separate scope. **Dependencies:** F03/F04/F08, recipient identity and clinic consent policy. **Complexity:** Large. **Verification:** unrelated-account denial on every list/read/send endpoint, stale membership, delivery/retry ordering and safe notifications. Do not claim end-to-end encryption without an implemented and verified design.

#### F22 — Notifications: no persistence, recipients or preferences

**Problem/root cause (confirmed S/L):** Settings and bell explain unavailability (`web/settings.tsx:47`; `components/shell.tsx:47`; mobile `settings.tsx:17–18`). No notification/preference/outbox schema exists. **Impact:** users must manually refresh verification/appointments and cannot rely on system alerts.

**Recommended fix:** recipient-scoped in-app events/read state/preferences and transactional event production before email/push. **Dependencies:** stable event contracts, F03/F04 and relevant modules. **Complexity:** Medium–Large. **Verification:** no cross-user delivery, idempotent event generation, unread/read persistence, preference behavior and minimal patient content in notifications. SMTP/push remain unavailable until separately configured/tested.

#### F23 — Reliability: incomplete global resource/readiness controls

**Problem/root cause (confirmed S; production topology U):** only imports/avatars use rate limiting; most clients have no request deadline and several transactions no local statement/lock timeout. Health returns static OK; server has no explicit readiness/graceful-shutdown lifecycle or trusted-proxy configuration. `server.ts:20–64`; `lib/portal.ts:20–24`; `apps/api/src/routes/portal-router.ts:77–106,127–148`; `imports/router.ts:33`; `apps/api/src/routes/profile-avatar.ts:44`. **Impact:** stalled operations, shared-proxy throttling or misleading health signals are possible.

**Recommended fix:** bounded request/SQL budgets, conservative per-user limits, separate readiness/health, graceful drain and deployment-specific trusted proxy settings. **Dependencies:** hosting topology and load tests. **Complexity:** Medium. **Verification:** disconnected DB, network loss, slow scanner/Storage, client abort, shutdown during transactions and real ingress IP handling. Do not blindly trust forwarded headers.

#### F24 — Avatar operations: end-to-end proof, cleanup scheduling and aggregate limits

**Problem/root cause (confirmed S; failure incidence U):** profile lifecycle is only mock-tested in this audit; image decoding precedes pool acquisition and lacks a global concurrency gate; scheduled cleanup starts only when `AVATARS_ENABLED=true`, although removal can run while uploads are disabled. `apps/api/src/routes/profile-avatar.ts:33–40,58–83,89–94`; `server.ts:58–60`. **Impact:** many authorized image requests can pressure memory; failed deletions may wait indefinitely if upload enablement is turned off without an external cleanup job.

**Recommended fix:** complete signed-in save/retrieve/replace/remove/persistence acceptance, independently schedule retention and bound aggregate decoder work. **Dependencies:** F04, trusted job infrastructure. **Complexity:** Medium. **Verification:** full lifecycle with non-sensitive images, revoke during upload, pool exhaustion, failed/ambiguous commit, expired URL, cleanup retries and unchanged initial avatar restoration. Never use the live smoke script during a no-write audit.

#### F25 — Verification workflow: no rejection explanation/history UX

**Problem/root cause (confirmed S/schema):** rejection records status/reviewer/time but no reason; staff UI only lists pending requests and patients receive a generic message. `apps/api/src/routes/verification-review.ts:9–10,34`; `verification-requests.tsx:14–20`; mobile `verification-pending.tsx:29–32`; migrations 001/003. **Impact:** resubmission can repeat the same issue, and staff lack a complete review history interface.

**Recommended fix:** approve safe reason codes/internal notes/patient wording and retained history, with pagination rather than a fixed 100-row queue. **Dependencies:** privacy/retention policy and real integration tests. **Complexity:** Medium. **Verification:** rejection/resubmission, repeated pending requests, correct recipient explanation, historical access and no sensitive notes leaked to patients.

#### F26 — Mobile/profile security parity and consent evidence

**Problem/root cause (confirmed source, provider policy U):** mobile Settings links ordinary signed-in users directly to reset-password; `updateUser({password})` does not supply the web flow's current password/nonce. Signup consent is not versioned/persisted in application fields. `mobile/app/settings.tsx:10`, `reset-password.tsx:19–26`, `register.tsx:25–32`; compare `web/lib/settings-security.ts:11–16`. **Impact:** security behavior depends on unverified deployed Supabase secure-change policy; no evidence of accepted policy version.

**Recommended fix:** align mobile normal-change versus recovery flows with approved provider policy, and implement appropriate consent records after clinic review. **Dependencies:** F08 and Auth settings. **Complexity:** Medium. **Verification:** current-password/reauth requirements, recent versus stale sessions, expired recovery, OTP/nonce, no account enumeration and no token/password logging. Do not infer a proven takeover solely from SDK calls.

#### F27 — Configuration safety: development defaults can conceal deployment errors

**Problem/root cause (confirmed S/env):** API JWT verification has a project-specific fallback URL; web API calls silently default to localhost when `VITE_API_URL` is absent locally. Mobile has no API fallback. `apps/api/src/middleware/authenticate.ts:5–12`; `web/lib/portal.ts:20`; `mobile/lib/account.ts:3–6`. **Impact:** different environments can target the wrong issuer/API, and development may appear configured when production is not.

**Recommended fix:** fail-fast environment validation with explicit development-only defaults and matching project identity checks. **Dependencies:** deployment inventory. **Complexity:** Small–Medium. **Verification:** missing/mismatched variables fail safely; production web/mobile never calls loopback; no secrets included in frontend validation messages.

#### F28 — Delivery engineering: CI, lint and lockfile ownership are incomplete

**Problem/root cause (confirmed repository):** root/API default tests fail by design, no checked-in CI workflows were found, mobile has no lint config, and four lockfiles can confuse package ownership. `package.json:10`, `apps/api/package.json:8`, app manifests/lockfiles; test results G. **Impact:** fixes can regress across apps without an aggregate release gate; ad hoc scripts/build reports are difficult to reproduce.

**Recommended fix:** explicitly choose the root workspace lockfile, document runtime/package versions, add approved mobile lint config and a CI matrix with immutable install/type/lint/unit/integration/build gates. **Dependencies:** approved package/config changes and F04. **Complexity:** Medium. **Verification:** clean checkout produces the same resolution/check results without implicitly installing lint dependencies or relying on stale compiled test files. Hosted CI outside the repo remains unknown.

### P3 — Low

#### F29 — Web design system: layered overrides and literal palettes

**Problem/root cause (confirmed S; final visual effect U):** CSS is spread across App/theme/portal-system/page files, with many overrides and remaining literal colors. Charts use inline colors; dark overrides duplicate semantic token values. `web/src/theme.css:1–20`, `design-tokens.css:1–28`, `pages/reports.tsx:7,31–36`, `pages/settings.css:49–57`. **Impact:** future pages may drift and contrast/hover behavior is difficult to reason about. Light/dark preview thumbnails intentionally contain light/dark colors and are not automatically defects.

**Recommended fix:** consolidate semantic component ownership incrementally and allow explicit artwork/chart-preview exceptions. **Dependencies:** rendered regression coverage. **Complexity:** Medium. **Verification:** computed light/dark/system styles, control hover/focus/disabled states and contrast at real sizes; do not “fix” previews or use global inversion.

#### F30 — Maintainability: duplicated contracts, dense components and permissive internals

**Problem/root cause (confirmed S):** clinic and role contracts are repeated across clients/server; lengthy one-line JSX and `Record<string,any>` importer jobs make review harder. F01 is a real result of contract drift. `web/lib/clinic-settings.ts:1–9`, `api/validation/clinic-settings.ts:1–23`, `mobile/components/clinic-info.tsx:7`; `api/imports/service.ts:36`; large render lines in `web/pages/settings.tsx:35–66`. **Impact:** expensive changes and missed cross-module mismatches.

**Recommended fix:** introduce small shared/generated API DTOs and typed database/domain results, split coherent components, format consistently. **Dependencies:** preserve working boundaries and tests; avoid an unnecessary rewrite. **Complexity:** Medium, incremental. **Verification:** unchanged contracts/behavior, compiler checks and targeted cross-module tests.

#### F31 — Documentation: historical claims conflict with current evidence

**Problem/root cause (confirmed S/L/T):** older import docs say parser dependencies/tests are blocked, older avatar sections refer to a 2 MiB bucket, and clinic docs say the table is absent. Latest audit finds installed parsers/green tests, a 3 MiB bucket, and the table newly present. `docs/architecture/legacy-patient-imports.md:10–26`; `database/migrations/005_staff_avatars.sql:14`; `docs/architecture/clinic-configuration.md:7`; later avatar report has a superseding section. **Impact:** operators could rerun old CREATE SQL or misjudge readiness.

**Recommended fix:** one versioned deployment state/checklist with historical reports clearly scoped and current configuration evidence. **Dependencies:** operator-confirmed history, not edited historical migrations. **Complexity:** Small. **Verification:** fresh operator follows the current guide without duplicate resource creation, missing prerequisites or claims of unperformed live tests.

#### F32 — Education/analytics: useful initial scope needs clear semantics

**Problem/gap (confirmed S):** education is four public resource links with device-only bookmarks; reports classify prenatal/postnatal using service-name regex and count patients by record creation date. `mobile/lib/education.ts:1–14`, `library.tsx:22–43`; `web/pages/reports.tsx:16–25`; `api/routes/portal-router.ts:156–163`. **Impact:** no clinic CMS/cloud bookmark sync; imported historical patients may be counted as newly created records rather than newly receiving care. Current footnotes partly disclose this.

**Recommended fix:** retain transparent labels; consider canonical service categories, provenance-aware measures and clinic-reviewed content only after core priorities. **Dependencies:** F01/F05/F08. **Complexity:** Small labeling, Medium–Large content/analytics. **Verification:** imported versus genuinely new patients, translated service labels, zero counts and no fabricated health statistics.

#### F33 — Schema/query polish: redundant indexes and fixed result caps

**Problem (confirmed S/L):** both the unique patient profile index and `idx_patients_profile` index the same key; several views cap data at 15/30/100 rows. `001_initial_schema.sql:22,82–83`; `apps/api/src/routes/portal-router.ts:55,65`; `account.ts:19`; `apps/api/src/routes/verification-review.ts:10`. **Impact:** modest write overhead or incomplete history visibility at scale. Current UI discloses many caps, so this is not evidence of silently missing all records.

**Recommended fix:** use query plans and realistic workloads to remove redundant indexing safely and add intentional cursor/history pagination. **Dependencies:** F04/F14. **Complexity:** Small–Medium. **Verification:** retained uniqueness/FK behavior, complete navigation through long histories, stable order and no performance regressions.

## D. UI/UX findings and design recommendations

### Strengths supported by source/tests

- Web `design-tokens.css:1–28` centralizes burgundy/blush/plum, surfaces, text/status colors, type sizes, spacing and control heights. `lib/theme.ts:3–17` handles Light/Dark/System, blocked storage, OS changes and other tabs; preference tests passed.
- `components/ui.tsx:22–31` uses native dialogs with accessible titles, Escape handling, busy close prevention and focus restoration. `shell.tsx:25–46` includes drawer focus handling, inert background and a skip link.
- Quick Actions are full native buttons with shared destinations and semantic backgrounds (`pages/dashboard.tsx:37–39`; `portal-system.css:3–7`); route helper tests passed. No current source evidence proves the canonical Import Records button redirects to Dashboard.
- Tables use horizontal scrolling and shared pagination; records do not invent clinical risk/allergy/stock data. Mobile core controls generally have 44–56 px minimum targets (`care-ui.tsx:164–184`) and readable 15 px body typography.
- Loading, explicit unavailable states and content disclaimers usually distinguish “unknown/not connected” from “patient has none,” especially medical records.

### Concrete improvements to verify in rendered sessions

| Area/component | Finding / recommended review |
|---|---|
| Dashboard | Remove or reduce the unavailable stock metric's prominence until Inventory exists; preserve real values for connected metrics. Check chart accessibility and wide/narrow card hierarchy (`dashboard.tsx:13–18`). |
| PatientProfile | Several tabs lead only to unavailable states; emphasize actual demographics/appointments and stage clinical tabs by implemented capability (`patients.tsx:39`). |
| Medical Records/Inventory/Messages | Large shared unavailable panels may dominate a working portal; use compact capability summaries until actual backends exist (`clinical.tsx:20`, `messages.tsx:3`). Do not replace them with fake controls/data. |
| Verification Review | Uses native `window.confirm` inside a custom modal; standardize the irreversible decision interaction and provide approved reason/history UX (`verification-requests.tsx:15`). |
| ClinicSettings | The form is long; test fieldset grouping, narrow hours grid, service removal focus, read-only contrast, inline server error associations and conflict recovery (`clinic-settings.tsx:24–32`, `.css:1–8`). |
| ImportRecords | Test step labels, selected rows, busy feedback, large tables and internal URL/history synchronization. Source guards some internal steps but not main navigation (`patient-imports.tsx:42–47`). |
| Web CSS/theme | Consolidate overlapping selectors carefully; literal chart/art colors and appearance examples need explicit exceptions rather than blanket replacement (F29). No persistent white-in-dark defect is claimed without computed/rendered evidence. |
| Mobile tabs | Native dark mode is absent by configuration; 12 px tab labels cap scaling. Test small screens with large font settings rather than treating numeric target sizes as sufficient (F18/F19). |
| Settings/Privacy | Distinguish enabled account security, approved published policies, local preferences and unavailable device/notification features. Existing labels mostly do this; avoid a polished but inert control surface. |
| Errors/feedback | Generic API errors and global 403 logout hide operation context. Define stable error codes, validation associations, retry outcomes and conflict messages without revealing database internals. |

No screen-reader, keyboard, actual contrast-cascade, device notch/keyboard, or responsive screenshot results are claimed. The mobile palette contrast unit test checks selected color pairs, not every state/layout. No external mockup was treated as proof of implemented functionality.

## E. Backend and database gaps

### Latest verified schema and relationships

L2 has 13 public tables: the 12 named in the request plus `clinic_settings`. RLS is enabled on all 13 and on `storage.objects`. These observations are catalog evidence, not proof of deployed CRUD behavior.

| Area | Observed relationships/constraints/indexes | Gaps / limitations |
|---|---|---|
| Identity | `profiles.id → auth.users.id` cascade; account type check; Auth profile-creation trigger exists. Own-profile SELECT policy exists. | No approved policy-version consent/device-session management model. Native password flow/provider security policy needs verification. |
| Patients/staff | Nullable unique `patients.profile_id → profiles`; unique patient number; unique `staff_members.profile_id`; staff role/status checks. | Patient numbers' database uniqueness is case-sensitive; API case-insensitive behavior depends on its locking/check logic. No pregnancy, clinical status/archive/retention model. Duplicate profile lookup index. |
| Appointments | Patient FK, timestamp/status/type, notes; patient/date index. | No service FK/catalog, provider/resource/duration/conflict constraint, idempotency/revision columns or clinical encounter linkage. `notes` is not an exposed clinical documentation workflow. |
| Verification | Profile/patient/reviewer FKs, status, intake birth/contact/kind/consent, profile/date and status indexes. | No rejection reason/decision-note/versioned verification evidence/history API. Pending duplicates serialized in application rather than removed by a destructive constraint migration. |
| Imports | Jobs/rows/provenance/events, uploader+idempotency uniqueness, source-system identifier HMAC uniqueness, composite row provenance FK, expiry and lookup indexes. | No key-version/rotation architecture; scanner/retention operation unverified. Extra source metadata has deliberate retention needs. |
| Avatars | `profiles.avatar_path` nullable with own-prefix constraint; cleanup object-path PK. Private JPEG-only bucket has 3,145,728-byte limit. | Migration 005 bootstrap SQL still specifies 2 MiB; latest real bucket is 3 MiB. Cleanup cadence and full signed-in lifecycle U. Do not recreate it. |
| Clinic | Singleton PK, fields/JSON/arrays, version/time/admin FK, deny-client policy; L2 no saved row. | No migration ledger found; initial-save integration unverified; API validates richer semantics than DB base checks. Policies are guidance, not scheduling enforcement. |
| Audit | Actor FK, action/entity/type/date, creation-date index. | No read/export access history viewer or structured change/event correlation; retention and investigation procedures U. |

The catalog does **not** establish medical document metadata, encounters/checkups/vitals, inventory items/movements, conversations/participants/messages, persistent notifications/preferences/outbox or health-monitoring entities. Education is intentionally a source catalog; it does not require a database just to function as four attributed links.

### Missing API capabilities and disconnected code

- Missing: patient booking/cancel/reschedule, clinical documents/checkups, inventory ledger, messaging, notifications, audit review, staff invitation/bootstrap and patient profile editing. No frontend feature should be marked enabled until these have authorized persistence and acceptance tests.
- `/api/v1/staff/dashboard` (`routes/staff.ts:8–17`) is a legacy access probe returning a message, while real dashboard data comes from `/overview`. `web/lib/auth.ts:42–75` still exports a helper for the old probe; current App uses `/session`. This is maintenance debt, not a broken current dashboard connection.
- Web `signUp`/`getCurrentUser` helpers remain exported but are not a staff registration workflow. Avoid wiring generic signup into staff provisioning without server-owned role assignment.
- Clinical placeholders reuse patient context/completed appointments without a medical record store. The schema column `appointments.notes` alone is not proof of clinical records support.
- No automatic migrations were found. Manual SQL and matching schema need an operator-owned applied-version ledger; never infer that an absent ledger means all CREATE files should be replayed.

### Index and transaction review

Existing FKs, uniqueness and narrow row locks preserve important relationships. Verification linking/promotions and audited imports are multi-statement transactions. Imports recheck duplicates under a patient-table lock, with completed-job replay. Staff management and clinic configuration serialize conflicting writes and reject stale state. Avatar Storage/database coordination uses durable cleanup intent rather than claiming a cross-system transaction.

Remaining concerns: F12/F13 mutation consistency, rollback failure handling differences, statement/request budgets, long import transactions, missing real concurrency tests, weak observability of uncertain outcomes, and redundant/insufficiently workload-validated indexes. No patient-level constraint violations or orphaned real records were counted or extracted in this audit.

## F. Security and privacy findings

### Controls confirmed in source

- JWT verification checks configured issuer, authenticated audience and token role before using the subject (`apps/api/src/middleware/authenticate.ts:40–55`). No frontend-provided role controls staff access.
- Staff membership/account type/status are loaded from PostgreSQL. Imports and admin settings have additional internal transaction checks. Ordinary staff cannot use admin-only import/member/configuration mutation routes by omitting UI controls.
- Patient care selects the linked patient from authenticated profile/account type (`account.ts:13–19`), not a caller-supplied patient ID. Direct patient mutation schemas reject account-link fields; clinical linkage is a separate staff-reviewed transaction.
- SQL values are parameterized; dynamic import INSERT placeholders come from bounded indexes, not uploaded SQL. Unsupported SQL/PDF/XLS/JSON uploads are rejected.
- Import parsing follows mandatory clean scanner verdicts; staging uses AES-256-GCM with job/row AAD and HMAC identifiers. XLSX size/entry/text/cell constraints and worker limits are real source controls. They still need operational integration/throughput verification.
- Avatars are JPEG-decoded/re-encoded, bounded, random-named, own-prefixed, privately stored and signed for five minutes. Existing retrieval/removal can work independently of upload enablement; aggregate work/cleanup scheduling remains F24.
- API errors generally avoid echoing request bodies/SQL/credentials. Exact configured service-credential matching found **no occurrence** in inspected web/mobile source or existing web build output. This is a narrow current-value scan, not a full secret-history or mobile-binary attestation. Selected `.env` paths are Git-ignored.
- `AVATARS_ENABLED=true` was observed in the local API environment at inspection; it was not changed. The running/deployed process can have a different environment. Enabled configuration alone does not prove the signed-in avatar lifecycle passed.

### Live privilege observations

1. Original seven tables (`account_preferences`, `appointments`, `audit_logs`, `patient_verifications`, `patients`, `profiles`, `staff_members`) grant broad table capabilities to anon/authenticated. Row DML still requires an allowing RLS policy, so this is **not** evidence that anonymous REST SELECT reveals all patients. Table-level privilege/default-grant hardening remains necessary.
2. Import tables and `avatar_cleanup` had no client grants/policies returned. `storage.objects` had no policies returned; the avatar bucket was private. No new client Storage policy is required merely to enable the server-mediated avatar implementation.
3. L2 clinic table has the explicit false client policy and no client table grants returned. Its privileged service role has more capabilities than just the explicit SELECT/INSERT/UPDATE grant, consistent with default privilege inheritance. Review actual grants rather than assuming a GRANT statement removes old/default rights.
4. `handle_new_user` is SECURITY DEFINER, uses a restricted search path in repository SQL, and remains executable by both client roles in the live catalog. It returns trigger; no callable privilege-escalation RPC was demonstrated. Review specific grants/defaults instead of assuming the PUBLIC revoke removed all inherited/default role rights.
5. The API database role bypasses RLS. Its Express checks must therefore be tested directly; enabled RLS flags do not constrain that connection as if each browser's JWT had been mapped into SQL roles.

### Dependency advisories checked without installing packages

A read-only HTTPS request to the configured official npm registry's bulk advisory endpoint was made with the lockfile's public dependency names/versions. Advisory pages were checked. No update or exploit was attempted; reachability and patched-version choices still require maintainer review.

| Locked instance | Advisory metadata | Application-specific interpretation |
|---|---|---|
| `node_modules/csv-parse` 6.2.1 | Moderate, prototype replacement via `columns`; affected range below 7.0.2. [Advisory](https://github.com/advisories/GHSA-8cw4-87c7-c6xx) | Importer uses array parsing without `columns` (`parse-worker.cjs:31`). Vulnerable package is present; this particular exploit path is not established as reachable. |
| Root Zod 3.25.76 | High, memory exhaustion with oversized constrained collections; registry returned a below-4.6.6 range. [Advisory](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5) | API resolves its own 4.6.7. Identify older transitive/tooling consumers and exact applicable API/version range before calling this an exposed API defect. |
| `deepmerge` 4.3.1 | Low, prototype poisoning in returned objects; affected 4.2.0–4.3.1. [Advisory](https://github.com/advisories/GHSA-gcqx-w48m-w2h4) | Transitive instance; consumer/untrusted input reachability needs mapping. |
| `uuid` 8.3.2 | Moderate, caller-buffer bounds issue in selected UUID versions/APIs. [Advisory](https://github.com/advisories/GHSA-w5hq-g745-h8pq) | Application mutations use Node `randomUUID`; transitive consumer/buffer API use must be examined. It is not proof avatar UUID generation is vulnerable. |

### Not established by this audit

No confirmed SQL injection, cross-patient IDOR, public clinical bucket, frontend service-key exposure or successful privilege escalation was demonstrated. Conversely, real MFA/SMTP/redirect settings, token revocation latency, deployed CSP/HTTPS ingress, restore/PITR, scanner signature upkeep, clinical-role requirements, legal policy approval, full secret history and native-binary security are **unverified**, not presumed safe or unsafe.

## G. Testing results

### Checks actually executed

| Command/method | Result / evidence boundary |
|---|---|
| `npm run typecheck --workspace=apps/api` | Passed using installed native TypeScript 7 CLI, `--noEmit`. |
| Web `tsc --noEmit --incremental false --project apps/web/tsconfig.app.json` and `tsconfig.node.json` | Passed; no emitted build/cache artifacts requested. |
| Mobile `tsc --noEmit --incremental false --project apps/mobile/tsconfig.json` | Passed; no export/native build. |
| `apps/web/node_modules/.bin/eslint.cmd --no-cache .` from `apps/web` | Passed, no warnings. Initial repository-root invocation failed because there is no root ESLint config; corrected web invocation passed. |
| Supplemental `apps/web/node_modules/.bin/eslint.cmd --config apps/web/eslint.config.js --no-cache apps/mobile/src` | Five errors, all `react-refresh/only-export-components`: `care-ui.tsx:164`, `account-context.tsx:41`, `library.tsx:56`, `onboarding-draft.tsx:19`, `session.tsx:46`. This is the web ruleset, **not a configured canonical Expo lint run**. Do not treat these as five proven mobile runtime failures. |
| API tests via Node stdin/in-memory compiler/loader | **59 passed, 0 skipped.** Includes 24 importer, 10 onboarding, 7 portal validation, 4 own-settings, 4 portal/staff HTTP, 7 avatar and 3 clinic tests. |
| Web tests via Node stdin/in-memory compiler/loader | **14 passed, 0 skipped.** Settings/password/theme, navigation/import wizard, avatar feedback/limits, clinic form helpers. |
| Mobile refinement tests via in-memory CommonJS loader | **8 passed, 0 skipped.** Validation/navigation, resource filtering/bookmark parsing and selected palette contrast. |
| Synthetic appointment contract probe | Known four-value service accepted; custom clinic service rejected. Confirms F01 without a database write. |
| `vite.build({configLoader:'native',build:{write:false,emptyOutDir:false,reportCompressedSize:false}})` from web | Passed: 98 modules transformed, 11 in-memory outputs, no files emitted. This plus no-emit TypeScript checks verifies the production build path, not browser behavior. |
| Live SQL catalog queries inside `BEGIN READ ONLY` / `ROLLBACK` | Succeeded; latest 13-table/clinic refresh and privileges/policies/bucket evidence recorded above. No patient data/write integration run. |
| Exact current server credential scan against client source/existing web output | No matches. Values not printed. `.env` ignore checks passed. |
| `git diff --check` | Passed for existing changes; line-ending conversion warnings are not test failures. |

**Total automated tests: 81 passed, zero skipped.** No earlier report's test result was substituted for these runs.

### Why the normal npm test/build wrappers were adapted

The user permits only this report to be created. Normal test scripts compile to `.test-output`, normal Vite build writes `dist`, and `expo lint` with no config can attempt configuration/package installation. Therefore:

- Current API sources were compiled into an in-memory map using the installed TypeScript 6 compiler API; API production typing was separately checked by its own TypeScript 7 CLI. Web tests used its TypeScript compiler; mobile refinement used its installed compiler. Node `registerHooks` resolved/loaded the generated current JS from memory.
- Parser workers require a physical file in a worker process. The **already-existing** compiled `parse-worker.cjs` was byte-compared to source before reuse; it matched. No stale unverified parser source was silently substituted.
- No files were emitted by these harnesses. Tests use local synthetic input, mocked DB/Storage objects and ephemeral local sockets, not deployed mutations.
- The initial guessed API local `.bin/tsc.cmd` path did not exist; the workspace's actual `npm run typecheck` command succeeded. This invocation correction is not an application type error.
- Official `expo lint` was **not run** in this audit because no config exists and its known setup path may install/create files. No lint config/package was created. Native/mobile export was not run because it would create artifacts/cache and may require additional tools; no existing device/EAS integration was exercised.

The in-memory harness was an audit execution method, not a new source/test file. API mocks validate application control flow and SQL parameters but do not execute the SQL against real tables. Unit tests do not prove display correctness, mail delivery, native deep links or production data isolation.

### Tests still required before production claims

Real signed-user Auth/JWKS/refresh/recovery; two-patient and unrelated-staff isolation; actual PostgreSQL constraints/rollback/locking; concurrent administrator/revocation operations; clinic first-save/publication and custom services; browser import aliases/history/dirty navigation; signed-in avatar save/replace/remove/refresh; full private scanner/import release; mobile device confirmation/recovery/care reads; accessibility/screenshots/themes; restore drills. Do not run existing `test:avatars:storage` during an audit-only/no-write task: it intentionally creates/deletes synthetic cloud objects.

## H. Recommended development roadmap

These are proposed future phases, not authorization to implement/deploy them now. Estimates are relative and should be revised after clinic decisions and isolated integration measurements.

| Phase | Goal/modules | Prerequisites | Expected deliverables | Tests required | Acceptance criteria | Effort |
|---|---|---|---|---|---|---|
| R0 — Reproducible baseline and urgent contract/config closure | All apps; clinic/services/mobile configuration | This audit, operator-confirmed environment/migration state | Fix F01; establish root lockfile/runtime ownership; explicit environment validation; approved mobile API/redirect URLs; clarify current deployment state; canonical lint/CI entry points | Existing 81 tests + cross-module service test, clean-checkout checks, physical-device URL checks | Custom configured service either creates a valid appointment or is explicitly rejected at configuration time; local account/recovery no longer blocked; no accidental resource recreation | Medium |
| R1 — Security and integration release gate | Auth, roles, database, verification, avatars/imports | Isolated test project/accounts, clinic privilege policy | Least-privilege/default-grant/RPC review, admin assurance/provisioning plan, transaction auth consistency, real isolation/concurrency suite, read/audit policy and retention/restore checklist | Valid/invalid JWT, two-patient IDOR negatives, revoked staff races, RLS/client-denial, rollback, backup restore | No unsupported data access under intended roles; audited writes stay atomic; approved recovery/MFA behavior demonstrated; relevant advisories triaged | Large |
| R2 — Finish existing clinic/avatar/import releases | Clinic settings, own profile, import workflow | R0/R1; approved clinic facts; private scanner/key/job operations | First clinic save/publication acceptance; actual signed-in avatar lifecycle; independent cleanup scheduling; guarded full import release and updated deployment docs | SQL/browser persistence, optimistic conflicts, signed objects, scanner rejection, duplicate/rollback/replay/retention, scale benchmark | Every enabled claim has live synthetic acceptance evidence; no unsafe gate bypass; existing resources/data preserved | Medium–Large |
| R3 — Scheduling and patient appointment workflow | Staff/mobile appointments | Canonical services, clinic scheduling decisions, R1 | Provider/resource/duration/availability model where needed; booking request/approval/cancel/reschedule; version/idempotency; server policy enforcement | Simultaneous capacity, timezone/DST policy, retries/status transitions, ownership, final-state rules | No double booking under agreed rules; patient sees only own requests; existing visits unchanged; policy text matches enforcement | Large |
| R4 — Clinical record/checkup foundation | Web/mobile records, assessments, private documents | Clinical owner approval, retention/amendment rules, clinical-role decisions, R1 | Encounters/checkups/vitals/doc metadata; private file quarantine/scanning; access logs and patient projections | Unauthorized patient/staff access, malformed files, scan/timeouts, amendments/audit, authorized retrieval | No fabricated clinical data; medical retrieval has per-resource authorization and retained audit; clinic signs off clinical workflow | Large |
| R5 — Inventory ledger | Inventory, dashboard stock summary | Clinic units/categories/stock policy, R1 | Item directory, receiving/usage/adjustment ledger, thresholds, history/search and validated stock math | Concurrency, negative stock, reasoned adjustments, retry/audit, real persistence | Displayed stock reconciles to ledger; every movement is authorized/audited; no mock totals | Large |
| R6 — Persistent in-app events/preferences | Notifications plus existing business events | Stable recipient/event contracts from prior phases | Notification recipient/read/preference persistence and reliable event/outbox processing; UI unread states | Duplicate event/retry, recipient isolation, preference updates, transactional production | Events persist once and reach only intended users; email/push remain separately labeled until configured/tested | Medium–Large |
| R7 — Secure clinic messaging | Staff/patient conversations | Consent/retention/participant policy, R1/R6 | Conversations/participants/messages, paging, unread state, safe polling; public Community kept separate | Every list/read/send membership check, revoked members, ordering/retry and privacy | Unrelated accounts cannot enumerate/read/send; messages persist truthfully; no unsubstantiated encryption promise | Large |
| R8 — Patient progress, content and analytic quality | Monitoring/education/reports | Real clinical model, clinician-approved metrics/content | Patient-safe health history/progress; reviewed content lifecycle; accurate service/provenance analytics; optional bookmark sync | Clinical/source correctness, historical imports vs new care, ownership, stale data and accessibility | No invented measurements or clinical inference; measures reflect defined denominators/timeframes; content has owners/review dates | Large |
| R9 — Cross-cutting UX and operational acceptance | All enabled modules | Render/device harness and approved designs; iterates alongside every earlier phase | Token/CSS simplification, optional native dark mode, route/draft consistency, responsive/accessibility tests, monitoring/readiness/drain and runbooks | Browser/device matrix, screen readers/large text, load/failure/restore and rollout/rollback drills | No known high-risk release gaps; feature status accurately reflects enabled deployment; automated and manual evidence is repeatable | Medium–Large |

## I. Top 10 fixes, ranked by impact and dependency

1. **Fix the clinic-service/appointment enum mismatch and add a cross-module regression** (F01). This is a confirmed defect that existing green tests missed.
2. **Complete mobile API/PKCE environment setup and real Auth/device acceptance** (F02/F27). Keep secrets server-side; verify redirect allowlists and physical-device reachability.
3. **Harden actual database/default grants and privileged access, backed by isolation tests** (F03/F07/F12). Do not confuse enabled RLS with protection of the BYPASSRLS API role.
4. **Establish an isolated real Auth/PostgreSQL/browser CI gate** (F04/F28). Reproduce current cross-module flows before expanding scope.
5. **Finish current clinic/avatar/import acceptance and release operations** (F10/F11/F24). The clinic table now exists; configure/test it rather than recreating it. Keep imports gated until scanner/key/retention proof passes.
6. **Resolve dependency advisory reachability and compatible updates** (F09). Separate API, importer, native and tooling consumers; do not apply untested major overrides.
7. **Define/enforce scheduling and retry/concurrency contracts** (F06/F13/F14). Only then expose real patient booking/cancellation.
8. **Build clinically approved records/checkups/private document access with audit/retention** (F05/F08/F15). This is the largest gap between current software and a complete clinical system.
9. **Implement inventory through a transactional movement ledger, then recipient-scoped notifications** (F20/F22). These foundations should precede stock totals/alerts in UI.
10. **Close user workflow/UX gaps and then secure messaging/content expansion** (F16–F19/F21/F25/F29–F33). Use verified responsive/accessibility evidence; do not prioritize cosmetic placeholder removal over authorized persistence.

## J. Supabase action checklist

### Confirmed current resources — preserve, do not recreate

- The original 12 public tables exist. Latest read also confirms **`clinic_settings` exists**, with its expected singleton fields, RLS and deny-client policy. Its configuration row was absent at last observation. Do not rerun migrations 001–006 blindly or infer execution history solely from table count.
- `profiles.avatar_path`, its owner-prefix check, and `avatar_cleanup` exist. Keep them and their data.
- `staff-avatars` is **private**, JPEG-only, **3,145,728 bytes**. Migration 005's original 2 MiB bootstrap value is not the current bucket configuration; do not recreate the bucket to match historical SQL.
- RLS is enabled on the latest 13 tables and `storage.objects`. No Storage object policies were returned. The server-mediated avatar flow does not need new public/ordinary-client Storage policies.
- The actual API role can read/insert/update the new clinic table according to catalog privilege checks; this is not a real write/rollback acceptance result. The role also bypasses RLS, which must be considered in endpoint tests.

### Confirmed requirements / operator tasks before enabled production claims

1. Reconcile applied SQL/history with the responsible operator. No Supabase migration ledger was found. Record the existing migration 006 application rather than replaying CREATE statements.
2. Enter only approved actual clinic details using an active administrator, then perform save/read/stale-edit/audit/publication acceptance in a safe environment. Keep patient sharing off until approved. Avoid unapproved real data in tests.
3. Review seven original tables' client grants, default privileges, service/backend role grants and `handle_new_user` execute grants. Prepare least-privilege SQL only as a separate approved change with negative/client/backend tests. No grant changes are supplied or executed by this audit.
4. Configure environment-specific mobile API and Auth redirect URLs; review web API URL before a production build. Existing local web calls use a localhost fallback. No service-role credential belongs in `VITE_`/`EXPO_PUBLIC_` variables.
5. For imports, provision approved encryption key storage/backup/rotation, private ClamAV/signature updates and retention jobs, then run real synthetic release tests. Approval/key/scanner/retention variables are absent locally. Do not turn on imports just because parser tests pass.
6. Review actual avatar cleanup scheduling if uploads are disabled or the API sleeps. Reuse the current private bucket and server credential; validate the full signed-in flow without exposing tokens/URLs in logs.
7. Publish clinic-approved privacy/terms URLs only after governance review. Local web URL variables are absent. Decide policy-version consent, access/audit retention and amendment/deletion procedures before additional clinical features.

### Needs further Dashboard/runtime inspection — not established as missing

- Auth site URL and exact native/web recovery/confirmation redirect allowlist; secure password-change/reauthentication policy; signup/confirmation/rate controls; MFA assurance; production email/SMTP deliverability. No recovery email or password mutation was triggered.
- Signed-user PostgREST/Storage denial behavior, exposed RPCs/default privileges/role inheritance, live API host/issuer matching, TLS/CORS/trusted proxy/CSP and JWT revocation behavior. Catalog reads alone cannot verify all of these.
- Backup/PITR availability, restore success, hosting isolation/network policy, logs/alerting, scanner signature upkeep, externally scheduled retention, data residency and clinic retention approval. No claim is made that backups or policies do not exist outside the repository.
- Whether production build/runtime variables differ from the inspected local `.env*` files; a local missing variable is not proof of a deployed missing variable.
- Future medical file Storage buckets and patient-specific ACL/scanning/quarantine design, inventory/messaging/notification schema and recipient/participant policies. These are **not present requirements to create during this audit**; design and approve them in their roadmap phases.

## Evidence freshness and audit preservation

Source paths/line numbers refer to this working tree and will change after future edits. The live database changed between read-only snapshots, so its latest observations are explicitly distinguished from the initial state and from historical implementation reports. The agent did not cause the schema change.

Final SHA-256 comparison matched **241 tracked/nonignored regular files** outside this report, with no changed/removed files in that captured set. One nonstandard Git-quoted path could not be resolved by the initial literal-path snapshot and was excluded; ignored environment/build/dependency files are not covered by that hash comparison. Environment files were read without printing values; no environment flags were changed. No live avatar smoke command, API server with cleanup scheduling, migration runner, email delivery or data-mutating workflow was started. This report is a prioritized evidence baseline, not a deployment approval or an assertion that the entire system is production-ready.
