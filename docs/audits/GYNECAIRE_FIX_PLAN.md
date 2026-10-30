# GYNECAIRE prioritized implementation plan

**Date:** October 30, 2026. **Source:** [full-system audit](GYNECAIRE_FULL_SYSTEM_AUDIT.md), findings F01–F33. This document plans future work; it does not authorize implementation or deployment. Only this file was created for this request.

## Baseline, sequencing and approvals

The audit identifies **10 P1, 18 P2 and 5 P3 findings**, with no demonstrated P0. Original severities are preserved below. Phase order reflects the requested priorities and dependencies, not a change in severity. Finding links lead to the audit's exact evidence; its source line numbers must be rechecked against the working tree before editing.

Primary order: **01 appointments → 02 mobile configuration → 03 database/authorization → 04 real integration → 05 clinical records/checkups → 06 existing clinic verification**. Phase 05 design can proceed while security/integration prerequisites are completed. Clinical implementation cannot bypass those gates. Phase 06 is a small acceptance task that may run immediately after 01/02/04 rather than waiting for all clinical development.

Begin P1 dependency triage (07), Auth/privacy decisions (08), and reproducible checks (17) alongside early phases. Relevant P1 risks must be resolved or explicitly dispositioned before clinical/import release. Accessibility and documentation checks apply to every enabled module, not just the later polish phases.

Preserve these facts:

- Latest audit and subsequent documentation checks found **13 application tables, including `clinic_settings`**. No singleton configuration row was observed. Do not recreate the table or replay migration 006.
- Existing `staff-avatars` is private, JPEG-only, **3,145,728 bytes**. Migration 005's 2 MiB bootstrap differs; do not recreate resources or edit historical migrations to conceal drift.
- The 81 passing unit/mock tests are historical evidence, not tests rerun for this plan or proof of live Auth/PostgreSQL/Storage/browser behavior.
- The [documentation delivery](../documentation-manifest.md) already partially addresses F31 and records setup/test procedures. Reuse it; documentation alone does not close operational findings.
- New schema filenames below remain **unallocated**. Inspect concurrent migrations before proposing the next additive migration. Preserve 001–006 and all existing data.

### What requires approval

This request authorizes planning only. A subsequent implementation instruction may authorize the selected source/test changes without repeated confirmation for work already in scope. Explicit approval is required for:

1. Applying SQL, grants/RLS/role/index changes, changing Supabase Auth/Storage settings, or provisioning accounts/projects/credentials.
2. Live test writes, emails, Storage operations and cleanup outside an expressly approved disposable fixture scope. Never default a write suite to production or use real patient data.
3. Clinical fields/ranges, role segregation, amendments, consent/retention, legal documents, published clinic facts and MFA/provisioning policy.
4. Dependency installations/major upgrades, paid infrastructure/CI secrets and enabling imports, uploads or patient booking.
5. Deployment/production rollout. No phase implies automatic migration application, seed execution, commit or deployment.

Phase-specific approval boundaries follow. Relative complexity is **Small / Medium / Large**, not a calendar promise. Each listed slice should be a separate reviewable task when it changes a distinct persistence or authorization boundary. Future module paths are explicitly marked proposed; they are not claims that those files exist.

## 01 — Appointment API compatibility with custom clinic services

- **Findings/evidence:** [F01, P1](GYNECAIRE_FULL_SYSTEM_AUDIT.md#L125).
- **Files:** `apps/api/src/validation/portal.ts`, `portal.test.ts`; `apps/api/src/routes/portal-router.ts`, `portal-router.test.ts`; `apps/api/src/validation/clinic-settings.ts`; `apps/web/src/pages/appointments.tsx`; `apps/web/tests/portal.test.ts`.
- **Root cause/fix:** Four hardcoded appointment types reject configured custom names. Use bounded trimmed service syntax consistent with clinic settings, then validate new visits against the server-read catalog. Proposed compatibility policy: configured row → configured services only; absent row → four legacy defaults; configured empty catalog → no new visits. Missing table/query failure is an unavailable error, not fallback. Preserve historical labels and existing date/status edits when a service is removed. Normalize matching consistently and persist the catalog's spelling.
- **Dependencies:** None for source regression. Live persistence proof depends on 04. Keep catalog-read/create concurrency semantics explicit.
- **Supabase:** No schema change expected: both existing fields support text. Reuse `clinic_settings.services`; no resource recreation or historical data rewrite.
- **Security:** Keep active staff guards, strict fields, parameterized SQL, audit atomicity and finalized-state protections. Browser-supplied catalogs are not authority.
- **Acceptance/tests:** Configured custom service creates a pending visit; unknown/removed/blank/oversized values fail; no-row/empty/failure behavior is distinct; historical reads/edits survive. Add cross-module schema-to-HTTP regression, normalization, unauthorized and audit rollback cases. Run API typecheck, portal/HTTP/clinic suites and affected web tests/lint/build; label live checks NOT RUN until approved.
- **Complexity/approval:** **Medium**, one focused task. Follow-up implementation instruction authorizes code and the documented compatibility policy. No Supabase change expected; isolated live writes require approval.

## 02 — Mobile API/recovery configuration and environment safety

- **Findings/evidence:** [F02, P1](GYNECAIRE_FULL_SYSTEM_AUDIT.md#L131); [F27, P2](GYNECAIRE_FULL_SYSTEM_AUDIT.md#L283).
- **Files:** `apps/mobile/.env.example`, `src/lib/account.ts`, `src/lib/supabase.ts`, `src/app/recover.tsx`, `src/app/auth-callback.tsx`, `app.json`; `apps/api/src/server.ts`, `src/middleware/authenticate.ts`; `apps/web/src/lib/portal.ts`; API/web environment examples; `docs/deployment/environment-variables.md`.
- **Root cause/fix:** Local mobile API/recovery variables were missing; project-specific Auth and localhost web fallbacks can conceal errors. **Slice A:** provision/document environment-specific API and PKCE callback URLs, including physical-device reachability. **Slice B:** centralize safe environment validation and restrict defaults to explicit development mode. Recheck Expo SDK documentation before touching Expo APIs.
- **Dependencies:** Operator-confirmed project/hosts; 04 disposable Auth fixtures for full verification.
- **Supabase:** Review exact confirmation/recovery redirect allowlist, site URL and SMTP. Change only approved URIs; align trusted API CORS origins.
- **Security:** No privileged keys in public variables; no token/callback/password logging or disabled TLS. Missing local settings do not establish missing deployed settings.
- **Acceptance/tests:** Account/preferences/verification/care/clinic reach the intended API; real browser/native confirmation and recovery return correctly; expired links/account switching work. Missing/mismatched production settings fail safely and never silently target loopback. Test configuration branches, actual device/browser callbacks and offline failures separately.
- **Complexity/approval:** **Small setup, Medium cross-platform verification**. Approve target origins, environment/Dashboard changes, account use and email tests. Values stay in private configuration, not chat or documentation.

## 03 — Database grants, RLS and transaction authorization

- **Findings/evidence:** [F03, P1](GYNECAIRE_FULL_SYSTEM_AUDIT.md#L137); [F12, P2](GYNECAIRE_FULL_SYSTEM_AUDIT.md#L193).
- **Files:** `database/migrations/001_initial_schema.sql`, `002_authentication.sql`, `003_mobile_onboarding.sql` **as references only**; `database/schema/rls_authorization.md`; `apps/api/src/config/database.ts`, `src/middleware/authorize.ts`; routes `portal-router.ts`, `verification-review.ts`, `staff-access.ts`, `clinic-settings.ts` and their tests. New privilege checks/additive hardening SQL and a shared transaction guard are **proposed**.
- **Root cause/fix:** Broad client grants coexist with a BYPASSRLS backend; core patient/appointment transactions lack the in-transaction eligibility checks used elsewhere. **Slice A:** read-only inventory of effective/default/function grants, inheritance, exposed RPCs and intended direct profile SELECT. **Slice B:** review minimal additive revocations/backend grants, then prove them in isolation. **Slice C:** standardize eligibility recheck/lock ordering for core mutations.
- **Dependencies:** Role/operation matrix; isolated 04 harness before applying/testing changes. Define revocation linearization semantics: writes ordered after committed revocation must fail; already locked writes follow the agreed serialization policy.
- **Supabase:** Proposed grant/default/function hardening migration only after inventory. Do not blindly alter managed service roles, disable RLS, or rerun schema creation. Verify Auth trigger ownership/execution and intended client reads remain valid.
- **Security:** RLS does not protect SQL executed by a bypassing role. TRUNCATE/TRIGGER/REFERENCES privileges need explicit review. Trigger-function EXECUTE alone is not proof of an exploitable RPC. Avoid inconsistent profile/staff lock ordering.
- **Acceptance/tests:** Real anon/authenticated clients cannot perform unintended operations; approved profile read/signup trigger/backend CRUD still work. Test direct REST/SQL privileges, inactive staff, concurrent revoke/write, deadlocks/timeouts and audit rollback using actual PostgreSQL.
- **Complexity/approval:** **Medium per slice**. Exact SQL, target, recovery plan and test evidence need approval before application; approve role/credential and revocation-policy changes separately.

## 04 — Isolated live Auth/PostgreSQL and browser integration

- **Findings/evidence:** [F04, P1](GYNECAIRE_FULL_SYSTEM_AUDIT.md#L143); supporting delivery prerequisite [F28, P2](GYNECAIRE_FULL_SYSTEM_AUDIT.md#L289).
- **Files:** `apps/api/src/config/testDatabase.ts`, API package/environment examples; existing route tests `portal-router.test.ts`, `clinic-settings.test.ts`, `settings-profile.test.ts`; `src/middleware/authenticate.ts`; routes `account.ts`, `verification-review.ts`, `staff-access.ts`; `apps/web/src/App.tsx`; `docs/testing/integration-checklist.md`. Dedicated integration harness/configuration and browser tests are **proposed**.
- **Root cause/fix:** Injected identities/query doubles do not establish real JWT, SQL, RLS, locking or UI behavior. **Slice A:** opt-in harness with explicit test project identity, owned fixtures and safe cleanup. **Slice B:** real signed-user Auth/account/verification cases. **Slice C:** core staff CRUD, concurrency/rollback and rendered browser routes. Domain import/Storage lifecycle tests remain 09.
- **Dependencies:** Approved disposable Supabase project/accounts; 03 role contract. Test baseline negatives first where safe, then revised privileges. Do not make 03 discovery depend on an already complete integration suite.
- **Supabase:** Provision approved isolated schema/accounts through supported Auth APIs. Never insert seed identities directly into `auth.users`. Reconcile fresh-project avatar 2/3 MiB drift before avatar tests.
- **Security:** Refuse production/unknown targets using an allowlist plus operator confirmation; never default writes to ordinary `DATABASE_URL`. No patient data or credential dumps. Control fault injection to the test environment.
- **Acceptance/tests:** Repeatable real JWT issuer/audience/expiry, two-patient ownership, verification linkage conflicts, inactive staff, actual constraints/commit/rollback and stale-edit races pass. Harness target-refusal/fixture-cleanup tests pass. Record browser/device/DB evidence individually; unrun manual tests stay NOT RUN.
- **Complexity/approval:** **Large overall**, split into the slices above. Approve project costs/configuration, account/email activity, fixture writes/cleanup and new tools. Production mutation tests remain excluded.

## 05 — Medical Records and Checkups foundation

- **Findings/evidence:** [F05, P1](GYNECAIRE_FULL_SYSTEM_AUDIT.md#L149); prerequisites [F08, P1](GYNECAIRE_FULL_SYSTEM_AUDIT.md#L167), [F15, P2](GYNECAIRE_FULL_SYSTEM_AUDIT.md#L211).
- **Files:** `apps/web/src/pages/clinical.tsx`, `patients.tsx`; `apps/mobile/src/app/(tabs)/records.tsx`, `(tabs)/dashboard.tsx`; `apps/api/src/routes/account.ts`, `portal-router.ts`; `docs/requirements/roles-permissions.md`, `SRS.md`. Clinical/document routes, validators, tests and additive migrations are **proposed new modules**.
- **Root cause/fix:** Completed appointment history is not an assessment, and no clinical/document model exists. **05A design:** approve encounters/checkups/measurements, clinical author/signoff/amendments, units/ranges, retention and patient projection. **05B structured-care slice:** schema/API/audit → staff form/history → authorized patient read, each separately testable. **05C document slice:** metadata → private quarantine/scan/publication → authorized retrieval/cleanup. Keep unavailable controls until their actual backend is proven.
- **Dependencies:** 03/04, approved clinical/role/privacy design in 08 and read/download audit conventions in 12. Design can start early; implementations/releases wait for gates. No invented doctor role or generated clinical decision rules.
- **Supabase:** Reviewed additive clinical entities/FKs/indexes/grants/RLS; separate private clinical/quarantine bucket design for documents. Reuse patients/profiles/appointments; do not store medical files in `staff-avatars`. Allocate exact migration filenames after design and inspection, apply only manually with approval.
- **Security:** Per-resource clinical-role and patient ownership checks before all reads/writes/signing; retained amendments rather than silent signed-note replacement; clean scan mandatory; durable reconciliation for Storage/DB failures. No raw PHI/file bodies/signed URLs in logs.
- **Acceptance/tests:** Synthetic checkup saves/reloads, authorized history/patient projection work, unrelated patients and disallowed staff are denied. Signed amendments retain history. Documents cannot be retrieved before scan/authorization; failures leave no accessible orphan. Test real SQL constraints, audit rollback, concurrent amendments, private Storage, malformed/unsafe/oversized files, expired URLs and web/mobile retrieval.
- **Complexity/approval:** **Large**, with independent 05A/05B/05C tasks. Clinical owner must approve model/ranges/roles/signoff/retention; operator approves migrations/buckets/policies/scanner and live fixtures. No automatic medical data migration or production rollout.

## 06 — Verify Clinic Configuration using the existing table

- **Findings/evidence:** [F11, P2](GYNECAIRE_FULL_SYSTEM_AUDIT.md#L187).
- **Files:** `database/migrations/006_clinic_settings.sql` **reference only**; `apps/api/src/routes/clinic-settings.ts`, `src/validation/clinic-settings.ts`, route tests; `apps/web/src/pages/clinic-settings.tsx`, `dashboard.tsx`; `apps/mobile/src/components/clinic-info.tsx`; `docs/deployment/supabase-setup.md`.
- **Root cause/fix:** Latest table exists, but first save/live UI acceptance is unverified. Reconcile operator history and run first-create/reload/version/conflict/publication acceptance; fix only reproduced defects. Do not rebuild the completed settings editor.
- **Dependencies:** 01, 02 and 04; approved clinic facts. Can run before clinical implementation completes.
- **Supabase:** Reuse singleton and existing grants. No new table or replay of 006. Synthetic configuration first in isolation; real approved facts/publication are separate operator actions.
- **Security:** Active administrator writes, staff read-only, server-derived audit actor, locked membership/version check, patient sharing off until approved; whitelist patient projection.
- **Acceptance/tests:** First save persists; version increments correctly; stale edit returns conflict; audit failure rolls back; ordinary/inactive staff denied; browser save/cancel/dirty state and dashboard/mobile off/on projection work. Do not claim booking guidance enforces scheduling.
- **Complexity/approval:** **Small–Medium**. Approve real clinic facts and patient publication before changing them. Live test scope approval required; schema changes only if separately demonstrated and reviewed.

## 07 — Dependency advisory reachability and compatible updates

- **Findings/evidence:** [F09, P1](GYNECAIRE_FULL_SYSTEM_AUDIT.md#L173).
- **Files:** Root/app manifests and lockfiles; `apps/api/src/imports/parse-worker.cjs`, `parser.test.ts`.
- **Root cause/fix:** Advisory matches are unresolved instances, not demonstrated reachable exploits. Map `csv-parse`, older root versus API Zod, `deepmerge` and `uuid` to actual consumers/runtime. Recheck current maintainer advisories, then update compatible parents/versions or document evidence-based non-reachability.
- **Dependencies:** Start review alongside 01–04; finish relevant risk disposition before import/clinical release. Follow SDK guidance for native changes.
- **Supabase:** None expected.
- **Security:** No forced major overrides, `audit fix --force`, disabled TLS or treating tooling exposure as proven patient-data compromise.
- **Acceptance/tests:** Every affected instance has a consumer, reachability decision and tested disposition. Validate immutable install/resolution, adversarial CSV/XLSX, decoder, API/web/mobile typing and affected web/native builds.
- **Complexity/approval:** **Medium**. Approve installations/lockfile changes, breaking upgrades and any residual-risk acceptance. No package operations in this plan.

## 08 — Privileged Auth, mobile password parity and governance

- **Findings/evidence:** [F07, P1](GYNECAIRE_FULL_SYSTEM_AUDIT.md#L161); [F08, P1](GYNECAIRE_FULL_SYSTEM_AUDIT.md#L167); [F26, P2](GYNECAIRE_FULL_SYSTEM_AUDIT.md#L277).
- **Files:** `apps/api/src/middleware/authenticate.ts`, `routes/staff-access.ts`; `apps/web/src/pages/staff.tsx`, `settings.tsx`, `lib/settings-security.ts`; `apps/mobile/src/app/settings.tsx`, `reset-password.tsx`, `register.tsx`; `docs/deployment/security-and-recovery.md`. Provisioning/consent additions are **proposed**.
- **Root cause/fix:** App lacks enforced admin assurance/invitation lifecycle; mobile ordinary password change differs from web; consent is unversioned and privacy/recovery proof is incomplete. Independent slices: **08A** approved MFA/provision/deprovision/first-last-admin recovery; **08B** normal password change versus recovery/nonce UX; **08C** approved policy links/versioned consent and backup/retention/incident runbooks. Dashboard controls are unverified, not presumed absent.
- **Dependencies:** 03/04 and clinic/privacy owners. Policy decisions precede 05 design; no need to finish all optional UX before that signoff.
- **Supabase:** Review Auth assurance/secure-change/session/SMTP settings; approved server-side invitation APIs; consent schema only if approved. Verify backup/PITR and restore in isolation.
- **Security:** No browser-selectable roles, generated legal publication or casual hard deletion of medical data. Protect last-admin recovery; avoid password/token logs and account enumeration.
- **Acceptance/tests:** Approved AAL1/AAL2 privileges, invite/activation/demotion/revocation, current-password/reauth/nonce, recent/stale sessions and expired recovery work against real Auth. Consent/policy version and isolated restore evidence match approved rules.
- **Complexity/approval:** **Medium–Large per slice**. Explicit approval for policy, Auth changes, account/email operations, consent migration, legal publication and restore costs/scope.

## 09 — Finish existing import and avatar release acceptance

- **Findings/evidence:** [F10, P1](GYNECAIRE_FULL_SYSTEM_AUDIT.md#L179); [F24, P2](GYNECAIRE_FULL_SYSTEM_AUDIT.md#L265).
- **Files:** `apps/api/src/imports/{router,scanner,crypto,service}.ts`, associated tests; `src/routes/profile-avatar.ts`, `profile-avatar.test.ts`; `src/scripts/avatar-storage-smoke.ts`; `src/server.ts`; `apps/web/src/pages/patient-imports.tsx`, `patient-import-page.tsx`, `hooks/use-avatar.ts`, `components/profile-photo.tsx`.
- **Root cause/fix:** Imports are correctly gated but not released; avatar lifecycle lacks live proof, aggregate decoder bounds and independent cleanup scheduling. **09A imports:** real synthetic scan/map/review/confirm/history/replay/TTL acceptance plus maintained private scanner/key operations. **09B avatars:** signed-in lifecycle, bounded concurrent decode and trusted cleanup independent of upload flag. Do not duplicate either implementation.
- **Dependencies:** 03/04, relevant 07 remediation, 08 retention/key recovery policy and trusted scheduler.
- **Supabase:** Reuse import tables, `profiles.avatar_path`, `avatar_cleanup` and existing private 3 MiB JPEG bucket. No duplicate resources; review fresh-install drift separately. Configure trusted jobs/secret handling only after approval.
- **Security:** Clean-before-parse, encrypted staging, active admin import access, own-avatar ownership and short-lived signing remain mandatory. No real patient files, automatic Auth linkage or flag bypass. Existing-account tests require explicit use/restoration authorization.
- **Acceptance/tests:** Imports commit once, duplicate races/rollback/retry/expiry and key recovery pass against real SQL/scanner. Avatar upload/read/replace/remove/reload, expired signing, revoke-during-upload, failed/ambiguous commit and cleanup retries pass with non-sensitive images; restore original if applicable. Measure decoder bound behavior.
- **Complexity/approval:** **Medium–Large**, separate 09A and 09B tasks. Approve scanner/key backup/retention/jobs, live account/Storage fixtures and each feature-flag enablement. Keep real imports disabled until prerequisites pass.

## 10 — CRUD retry/conflict protection, then actual scheduling

- **Findings/evidence:** [F06, P1](GYNECAIRE_FULL_SYSTEM_AUDIT.md#L155); [F13, P2](GYNECAIRE_FULL_SYSTEM_AUDIT.md#L199).
- **Files:** `apps/api/src/routes/portal-router.ts`, `account.ts`, `validation/portal.ts`; `apps/web/src/pages/appointments.tsx`, `patients.tsx`; `apps/mobile/src/app/(tabs)/appointments.tsx`. Revision/idempotency and scheduling entities/migrations are **proposed**.
- **Root cause/fix:** Ordinary create/edit lacks consistent retry/version protection; staff-entered visits are not online booking. Independent tasks: **10A** actor-scoped idempotency and optimistic revisions/conflict UX; **10B** approved provider/resource/duration/timezone/capacity rules and staff conflict enforcement; **10C** patient request/approve/cancel/reschedule with ownership.
- **Dependencies:** 01/03/04, clinic scheduling decisions and 18 performance baseline. Existing visits must not be silently rewritten or retroactively canceled by new policies.
- **Supabase:** Reviewed additive revision/idempotency and scheduling schema/constraints only after design; preserve existing appointments.
- **Security:** Payload-matching replay keys, transactional audit, derived patient ownership and server enforcement. Do not expose UI booking until the backend can enforce agreed rules.
- **Acceptance/tests:** Lost-response retry creates one operation/audit; concurrent edits conflict; simultaneous bookings obey capacity; status/timezone/cancellation boundaries pass; unrelated patient actions fail. Test actual SQL races/rollback, web conflict recovery and mobile ownership.
- **Complexity/approval:** **Medium for 10A; Large scheduling workstream**. Approve scheduling semantics, additive migration application and patient-booking enablement separately.

## 11 — Sensitive-access auditing and investigation

- **Findings/evidence:** [F15, P2](GYNECAIRE_FULL_SYSTEM_AUDIT.md#L211).
- **Files:** `apps/api/src/routes/portal-router.ts`; `apps/web/src/pages/reports.tsx`, `dashboard.tsx`; `database/migrations/001_initial_schema.sql` **reference only**. Audit metadata/routes/viewer are **proposed**.
- **Root cause/fix:** Selected write/recent-action logs do not cover sensitive reads/exports or full investigation. First approve minimal event metadata/failure behavior; then add read/export events and paginated admin viewer. Coordinate clinical download auditing with 05C.
- **Dependencies:** 03/04/08 policy; conventions can be designed before clinical implementation.
- **Supabase:** Reuse `audit_logs`; additive metadata/index/retention changes only if approved.
- **Security:** No raw PHI/file bodies/signed URLs; restricted investigation access. Define rather than assume whether an audit failure blocks a care read.
- **Acceptance/tests:** Approved events identify actor/action/resource safely; denied callers learn no foreign IDs; viewer/retention and failure policy work. Test real event persistence, rollback/failure, export, role denial, redaction and pagination.
- **Complexity/approval:** **Medium**. Approve sensitive-read collection, metadata/visibility/retention and any schema changes.

## 12 — Inventory as an audited movement ledger

- **Findings/evidence:** [F20, P2](GYNECAIRE_FULL_SYSTEM_AUDIT.md#L241).
- **Files:** `apps/web/src/pages/clinical.tsx`, `dashboard.tsx`; `apps/api/src/routes/portal-router.ts`. Dedicated inventory UI/routes/validators/tests and migration are **proposed**.
- **Root cause/fix:** No stock model exists. Separate item directory from immutable receive/use/adjust ledger, thresholds and history. Derive stock from reconciled transactions; replace unavailable metrics only when real queries exist.
- **Dependencies:** 03/04, approved units/categories/adjustment/negative-stock policy and 11 audit conventions.
- **Supabase:** Approved additive item/movement schema, constraints/indexes/grants/RLS; no changes to unrelated patient tables.
- **Security:** Role-limited, reasoned adjustments; transaction locking, replay protection and audit.
- **Acceptance/tests:** Synthetic stock persists/reconciles; concurrent use obeys approved stock rules; low-stock metric is real. Test units, receive/use races, replay, rollback, inactive roles and browser history.
- **Complexity/approval:** **Large**, item management and movement posting as separate vertical slices. Approve stock rules/permissions/migration; never fabricate opening stock.

## 13 — Recipient-scoped in-app notifications

- **Findings/evidence:** [F22, P2](GYNECAIRE_FULL_SYSTEM_AUDIT.md#L253).
- **Files:** `apps/web/src/components/shell.tsx`, `pages/settings.tsx`; `apps/mobile/src/app/settings.tsx`; API `verification-review.ts`, `portal-router.ts`. Notification/outbox/preferences persistence, worker and endpoints are **proposed**.
- **Root cause/fix:** No persisted recipient/read/preferences delivery exists. Implement transactional business events and idempotent delivery first, then inbox/read state/preferences; email/push remain separate.
- **Dependencies:** 03/04 and stable event/recipient contracts from relevant modules.
- **Supabase:** Approved additive notification/outbox/preference entities and recipient policies; no bucket needed.
- **Security:** Own recipient checks on every operation, minimal clinical content and no preference bypass.
- **Acceptance/tests:** Retries do not duplicate events; own read/preferences survive reload; foreign identities cannot enumerate/change them. Test real event rollback/worker retry/isolation and web/mobile unread UX.
- **Complexity/approval:** **Medium–Large**, event persistence then inbox/preferences. Approve recipients/content/retention/schema/jobs. SMTP/push require separate configuration and acceptance.

## 14 — Private clinic messaging; Community separately scoped

- **Findings/evidence:** [F21, P2](GYNECAIRE_FULL_SYSTEM_AUDIT.md#L247).
- **Files:** `apps/web/src/pages/messages.tsx`; `apps/mobile/src/app/(tabs)/community.tsx` as scope boundary. Conversation/participant/message API/UI/tests and migration are **proposed**.
- **Root cause/fix:** No communication backend exists. Build membership/history first, then sending, ordering/retry/polling and optional unread notifications. Public Community/moderation is not implicitly delivered by private clinic messaging.
- **Dependencies:** 03/04/08 participant/consent/retention policy; 13 if notifications are included.
- **Supabase:** Approved conversation/participant/message schema and membership policies; attachments need a separate reviewed file design.
- **Security:** Participant authorization for every list/read/send, including revoked membership; prevent enumeration. No unsubstantiated end-to-end encryption promise.
- **Acceptance/tests:** Authorized synthetic participants exchange/reload ordered messages; unrelated/revoked users cannot list/read/send; retry and retention rules hold. Test real multi-conversation isolation, revocation and polling/replay.
- **Complexity/approval:** **Large**, membership/read then send/retry. Approve communication policies/schema and any separate moderation scope before launch.

## 15 — Verification explanations and retained review history

- **Findings/evidence:** [F25, P2](GYNECAIRE_FULL_SYSTEM_AUDIT.md#L271).
- **Files:** API `routes/verification-review.ts`, `account.ts`; web `pages/verification-requests.tsx`; mobile `app/verification-pending.tsx`; migrations 001/003 **reference only**.
- **Root cause/fix:** Status/reviewer/time alone leaves rejection/resubmission opaque. Add approved patient-safe reasons, separate internal notes only if needed, and paginated retained history; preserve current serialized pending/link decisions.
- **Dependencies:** 03/04/08 privacy/reason/retention decisions. Notifications optional after 13.
- **Supabase:** Approved additive reason/history fields or entity; no rewrite of past decisions.
- **Security:** Own-account explanation projection, no internal-note leakage; retain staff recheck and linking conflict rules.
- **Acceptance/tests:** Reject/resubmit/approve has attributable history and useful safe wording; long queues paginate; pending submissions do not duplicate. Test real transitions/link conflicts, two-account projection and note access.
- **Complexity/approval:** **Medium**. Approve reason taxonomy, internal-note access/retention and migration application.

## 16 — Navigation/drafts and operation-specific forbidden errors

- **Findings/evidence:** [F16, P2](GYNECAIRE_FULL_SYSTEM_AUDIT.md#L217); [F17, P2](GYNECAIRE_FULL_SYSTEM_AUDIT.md#L223).
- **Files:** `apps/web/src/lib/navigation.ts`, `lib/portal.ts`, `App.tsx`, `components/shell.tsx`, `pages/clinic-settings.tsx`, `patient-imports.tsx`, `patient-import-page.tsx`, `tests/portal.test.ts`; API `middleware/authorize.ts`, `error-handler.ts` and relevant denial responses.
- **Root cause/fix:** **16A:** unknown hashes fall to Dashboard, local draft/view state diverges from navigation. Add explicit not-found, canonical URL/view synchronization and accessible discard handling. **16B:** every 403 triggers access loss. Use stable error categories and bounded session recheck to distinguish action denial from revoked membership/expired session. Audit did not reproduce the older canonical import redirect; do not claim it did.
- **Dependencies:** 04 browser harness; stable API error contract. No new routing library required.
- **Supabase:** None expected.
- **Security:** Navigation is not authorization; no forbidden mutation auto-retry or recheck loops. Logout/account switching must not reveal another user's draft; no casual sensitive draft persistence.
- **Acceptance/tests:** Import direct URL/refresh/Back/history and dirty sidebar/logout work predictably; invalid hashes show explicit state. Ordinary 403 stays on page, demoted admin keeps valid staff access, inactive/expired user loses it. Test unit parsing/errors and actual browser scenarios separately.
- **Complexity/approval:** **Medium 16A; Small–Medium 16B**, separate tasks. Follow-up code authorization; approve cross-session sensitive draft persistence if proposed.

## 17 — Reproducible delivery and incremental contract cleanup

- **Findings/evidence:** [F28, P2](GYNECAIRE_FULL_SYSTEM_AUDIT.md#L289); [F30, P3](GYNECAIRE_FULL_SYSTEM_AUDIT.md#L303).
- **Files:** Root/app package manifests/lockfiles; `apps/web/eslint.config.js`; `apps/mobile/AGENTS.md`; API/web clinic DTOs, mobile `components/clinic-info.tsx`, API `imports/service.ts`, web `pages/settings.tsx`. Mobile lint config, `.github/workflows/` and shared/generated DTOs are **proposed**.
- **Root cause/fix:** **17A:** generic test placeholders, absent checked-in CI/mobile lint and multiple lockfiles need explicit workspace ownership/aggregate gates. Inventory external CI first. **17B:** duplicated contracts, permissive results and dense JSX need small typed-domain/component extractions under tests, not a rewrite. Start delivery setup early; refactors follow affected-module coverage.
- **Dependencies:** 04 isolated test target and 07 compatible dependency resolution. Preserve app package/compiler boundaries.
- **Supabase:** CI credentials target isolation only; no automatic production migrations/seeds.
- **Security:** Protect CI secrets from untrusted PRs; shared client DTOs must not import server secrets or broaden patient projection.
- **Acceptance/tests:** Clean immutable install executes intended typing/lint/unit/integration/build commands with visible skips; deliberate failure blocks gate. Selected refactors preserve contracts/behavior and reduce targeted unsafe typing. Run affected suites/builds and test target refusal.
- **Complexity/approval:** **Medium per slice**. Approve installations, lint/lockfile/workspace changes, CI secrets/costs and hosted gates. Do not delete legacy lockfiles without identifying consumers.

## 18 — Reliability, measured performance and history completeness

- **Findings/evidence:** [F23, P2](GYNECAIRE_FULL_SYSTEM_AUDIT.md#L259); [F14, P2](GYNECAIRE_FULL_SYSTEM_AUDIT.md#L205); [F33, P3](GYNECAIRE_FULL_SYSTEM_AUDIT.md#L321).
- **Files:** API `server.ts`, `config/database.ts`, routes `portal-router.ts`, `account.ts`, `verification-review.ts`, `profile-avatar.ts`, import `router.ts`, `service.ts`; web `lib/portal.ts`, `pages/verification-requests.tsx`; mobile `lib/account.ts`; migration 001 **reference only**.
- **Root cause/fix:** Independent tasks: **18A** request/SQL deadlines, limits, readiness versus liveness and graceful drain; **18B** synthetic benchmark/query-plan baseline then targeted lock/query/pool optimization; **18C** stable history pagination and proven redundant-index cleanup. Broad locks/sequential queries are confirmed design facts; production slowdown is unmeasured.
- **Dependencies:** 04 failure/load harness, approved host/proxy topology and budgets. Capture baseline before 10; do not remove conservative duplicate locks until equivalent safety is proven.
- **Supabase:** Read-only plans first; reviewed index/pagination schema changes if justified. Dropping redundant `idx_patients_profile` must preserve constraint-backed uniqueness/FKs and needs explicit approval.
- **Security:** Never trust arbitrary forwarded IPs; no blind retry of non-idempotent writes. Load tests use approved synthetic targets, not production; timeouts must roll back safely.
- **Acceptance/tests:** DB outage reports unready; slow/aborted work and shutdown are bounded; ingress limits are fair. Measure 10k-row imports with concurrent staff traffic against agreed budgets; duplicate/retry invariants remain correct. Long histories paginate completely/stably. Test pool/locks, SQL plans, failure injection, shutdown, proxy headers and retained uniqueness.
- **Complexity/approval:** **Medium–Large**, separate 18A/B/C. Approve topology/budgets, load scope, index/schema changes and deployed settings; no production benchmark or index removal by default.

## 19 — Accessible, coherent web/mobile design

- **Findings/evidence:** [F18, P2](GYNECAIRE_FULL_SYSTEM_AUDIT.md#L229); [F19, P2](GYNECAIRE_FULL_SYSTEM_AUDIT.md#L235); [F29, P3](GYNECAIRE_FULL_SYSTEM_AUDIT.md#L297).
- **Files:** `apps/mobile/app.json`, `src/components/care-ui.tsx`, `care-tabs.tsx`, `src/hooks/use-theme.ts`; web `src/components/ui.tsx`, `shell.tsx`, `theme.css`, `design-tokens.css`, `pages/reports.tsx`, `settings.css`.
- **Root cause/fix:** Rendered/assistive coverage is missing; active mobile is light-only; layered web CSS/literal palettes complicate consistency. First reproduce/measure accessibility issues, then fix focus/large text/contrast; consolidate token ownership incrementally. Native dark/system support is a separate approved scope, not global inversion. Preserve intentional artwork/theme-preview colors.
- **Dependencies:** 04 browser/device harness and supported-device/design decisions. Basic accessibility acceptance accompanies every prior UI phase.
- **Supabase:** None.
- **Security:** Clinical statuses/errors cannot rely on color alone; screenshots use synthetic data.
- **Acceptance/tests:** Supported 320px-to-desktop layouts, 200% zoom, VoiceOver/TalkBack, keyboard/focus return, motion and chart alternatives pass. Test computed light/dark/system colors where implemented, hover/focus/disabled/error states and native text scaling. Do not describe untested rendering as a reproduced defect.
- **Complexity/approval:** **Medium per accessibility/web-token/native-theme slice**. Approve native theme scope and device matrix; test tool installations need approval.

## 20 — Honest analytics/content and current release documentation

- **Findings/evidence:** [F32, P3](GYNECAIRE_FULL_SYSTEM_AUDIT.md#L315); [F31, P3](GYNECAIRE_FULL_SYSTEM_AUDIT.md#L309).
- **Files:** API `routes/portal-router.ts`; web `pages/reports.tsx`; mobile `lib/education.ts`, `lib/library.tsx`, `(tabs)/dashboard.tsx`; `docs/architecture/README.md`, existing import/avatar/clinic reports, `docs/deployment/supabase-setup.md`, `docs/testing/test-results.md`, `docs/documentation-manifest.md`.
- **Root cause/fix:** **20A:** service-name regex/record-created-date metrics and four local educational links need precise semantics. First label truthfully, then consider provenance-aware categories, reviewed content or bookmark sync only after core work. Health progress requires 05 clinical data. **20B:** newer docs already qualify old parser/bucket/clinic claims; reconcile operator history and maintain one current evidence checklist rather than recreating the documentation set.
- **Dependencies:** 01 canonical service semantics, 05 for clinical metrics, 08 approved content/policy; operator-confirmed release history.
- **Supabase:** None for labels/docs. Optional categories/content/bookmark schema requires separate design/approval; never backfill invented care dates or measurements. Read-only reconciliation of current resources only.
- **Security:** Patient-safe aggregate definitions/content; no secrets or PHI in docs; no unsupported clinical inference or compliance claim.
- **Acceptance/tests:** Imports are distinguished from new care, custom labels do not silently misclassify, storage/sync claims are accurate. Test synthetic imported/new records, translated services/zeros, resource attribution and any future bookmark isolation. Validate docs links and operator walkthrough; manual tests remain NOT RUN until executed.
- **Complexity/approval:** **Small labels/docs; Medium–Large optional analytics/content**. Approve metrics/content owners and optional schema/sync scope. Operator confirms deployment history; no old CREATE SQL replay.

## Finding-to-phase coverage and closure

Every original finding is mapped below. None is closed by this plan. Assign an owner when selecting a task. Closure evidence must identify the actual change, commands/results, test target, remaining manual checks and operator approvals. Original severities remain unchanged.

| Finding | Audit severity | Phase / slice | Closure boundary |
|---|---|---|---|
| F01 | P1 | 01 | Configured-service regression and creation contract; live SQL separately verified |
| F02 | P1 | 02A | Correct API/callback configuration and actual platform delivery |
| F03 | P1 | 03A/B, 04 | Effective grants/RLS/backend positive and negative tests after approved change |
| F04 | P1 | 04 | Repeatable real Auth/SQL/browser evidence, not injected identities alone |
| F05 | P1 | 05A/B/C | Approved clinical model and authorized encounter/checkup/document vertical slices |
| F06 | P1 | 10B/C | Policy/capacity/ownership enforced server-side before patient booking |
| F07 | P1 | 08A | Approved assurance/provisioning/recovery implemented and tested |
| F08 | P1 | 08C; prerequisite 05A/11 | Approved privacy/retention/backup/restore evidence |
| F09 | P1 | 07 | Each advisory instance has tested remediation or justified risk disposition |
| F10 | P1 | 09A | Real safe full pipeline, key/scanner/retention operations and approved enablement |
| F11 | P2 | 06 | Existing singleton save/read/version/audit/publication acceptance |
| F12 | P2 | 03C, 04 | Agreed revocation/write ordering proven under real concurrency |
| F13 | P2 | 10A | Replay/lost-update protection and usable conflict recovery |
| F14 | P2 | 18B | Measured lock/query improvement without duplicate/retry regression |
| F15 | P2 | 11; document events 05C | Approved sensitive-access/export auditing and restricted investigation |
| F16 | P2 | 16A | Real navigation/history/dirty-discard behavior |
| F17 | P2 | 16B | Action denial distinct from session/membership loss |
| F18 | P2 | 19 native-theme slice | Stakeholder theme decision; implementation/device proof if required |
| F19 | P2 | 19; every UI slice | Actual viewport/keyboard/assistive acceptance |
| F20 | P2 | 12 | Reconciled, authorized stock ledger and real UI persistence |
| F21 | P2 | 14 | Participant-authorized messaging; separate Community disposition |
| F22 | P2 | 13 | Persisted recipient/read/preferences and retry-safe event delivery |
| F23 | P2 | 18A | Failure/readiness/drain/proxy/limit behavior under approved topology |
| F24 | P2 | 09B | Live own-avatar lifecycle, decoder bound and independent cleanup |
| F25 | P2 | 15 | Safe reasons/history and preserved linkage/resubmission protections |
| F26 | P2 | 08B/C | Approved password-change/recovery parity and consent evidence |
| F27 | P2 | 02B | Missing/mismatched deployment values fail safely |
| F28 | P2 | 17A; harness 04 | Clean install/check/CI reproducibility and explicit skips |
| F29 | P3 | 19 web-token slice | Computed/rendered theme regressions pass after incremental cleanup |
| F30 | P3 | 17B | Narrow typed/DTO/component changes preserve behavior |
| F31 | P3 | 20B | Partly addressed by newer docs; operator release history still needs confirmation |
| F32 | P3 | 20A | Accurate measures/content/storage semantics; optional expansion separately scoped |
| F33 | P3 | 18C | Proven index safety and complete stable history pagination |

## Single best first implementation task

**Implement phase 01: F01, appointment compatibility with configured clinic services.** It is a confirmed core defect that the green suites missed, has a bounded cross-module regression, and needs no new table or migration. It unlocks useful Clinic Configuration acceptance while the security/integration workstreams are prepared. A source-level fix is not permission to claim live SQL creation was tested.

### Focused Codex prompt

```text
Implement only audit F01 (P1): appointment API compatibility with configured
clinic services. Read repository instructions and inspect the existing working
tree before editing. Preserve unrelated and uncommitted work.

Inspect:
- docs/audits/GYNECAIRE_FULL_SYSTEM_AUDIT.md, F01
- apps/api/src/validation/portal.ts and portal.test.ts
- apps/api/src/routes/portal-router.ts and portal-router.test.ts
- apps/api/src/validation/clinic-settings.ts
- apps/web/src/pages/appointments.tsx
- apps/web/tests/portal.test.ts
- database/migrations/001_initial_schema.sql and 006_clinic_settings.sql

The clinic editor accepts custom service names, but appointmentSchema rejects
everything outside four hardcoded types. Repair this mismatch using the existing
clinic_settings.services and appointments.appointment_type fields.

Use this bounded compatibility policy:
1. Validate trimmed service names consistently with clinic settings (2-100
   characters), then check new appointments against the server-read catalog.
   Never trust a frontend-provided catalog.
2. When a singleton settings row exists, accept only its configured services.
   Match normalized names consistently and persist the configured spelling.
   An intentionally empty catalog permits no new appointments and returns an
   actionable message.
3. Only when the singleton row is absent, preserve the four existing legacy
   service types as an explicit fallback. A missing/unreadable table or query
   failure is an unavailable error, not a fallback.
4. Preserve all historical appointment_type labels. Removing a configured
   service must not break reads or existing status/date edits; reject that
   removed service for new appointments.
5. Keep parameterized SQL, active staff authorization, strict mutation fields,
   transaction/audit atomicity and finalized-appointment protections. Make
   catalog-read/create behavior explicit for concurrent configuration edits.
6. Align the web input limits and field/error feedback with this server contract.

Add a cross-module regression: a synthetic custom service accepted by the clinic
configuration schema must pass the appointment HTTP creation path when configured.
Cover unknown/removed/blank/oversized values, normalization, absent singleton,
empty configured catalog, failed catalog lookup, historical reads/status edits,
unauthorized requests and audit-failure rollback. Distinguish mock/query-double
tests from actual PostgreSQL integration; do not claim live persistence without
running an approved isolated integration test.

Run these installed-dependency checks from the repository root:
- npm run typecheck --workspace=apps/api
- npm run test:portal --workspace=apps/api
- npm run test:portal-http --workspace=apps/api
- npm run test:clinic --workspace=apps/api
- npm run test:portal --workspace=apps/web
- npm run test:clinic --workspace=apps/web
- npm run lint --workspace=apps/web
- npm run build --workspace=apps/web

Do not install packages without approval. Report exact commands/results and
not-run checks. Do not apply migrations, change Supabase resources/credentials
or environment flags, run cloud write tests, commit or deploy. Do not add a new
service table, redesign scheduling, implement patient booking or refactor F12.
Stop after F01. Provide changed files, remaining limitations and a Conventional
Commit message.
```

## Plan validation

The source audit's 33 finding IDs and severity groups were checked against this
plan. All are mapped; no new audit findings or verified live outcomes are claimed.
No application tests were rerun for this documentation-only planning request.
Existing application, environment, migrations and the audit were left unchanged;
no Supabase operations, installations, commits or deployments were performed.
