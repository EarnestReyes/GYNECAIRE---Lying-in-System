# Functional requirements

[I/P/B/U definitions](README.md). Source links identify implementation evidence or the inspected area where the feature is absent; they are not runtime proof.

| ID | Module | Status | Current scope | Evidence | Acceptance / verification needed |
|---|---|---|---|---|---|
| FR-001 | Registration | I | General account signup through Supabase Auth; public signup cannot select staff privileges. | [source](../../apps/mobile/src/lib/supabase.ts) | Confirm email/callback on a disposable account; inspect trigger-created profile. |
| FR-002 | Login, session and logout | I | Supabase sessions; web additionally requires active staff membership. | [source](../../apps/web/src/App.tsx) | Test expired session, inactive membership and logout on both clients. |
| FR-003 | Password recovery | P | Recovery/callback screens exist; actual redirect and email delivery depend on Auth configuration. | [source](../../apps/mobile/src/app) | Test allowlisted native/web recovery and expired links. |
| FR-004 | Guest access | I | Guest education and restricted navigation; no protected patient data. | [source](../../apps/mobile/src/app) | Try each protected screen without a session. |
| FR-005 | Account interests | I | Authenticated preferences persistence through account API. | [source](../../apps/api/src/routes/account.ts) | Save/reload with two separate accounts. |
| FR-006 | Verification submission | I | New/existing patient request, consent, pending state and resubmission after rejection. | [source](../../apps/api/src/routes/account.ts) | Submit, reject, resubmit and reload; pending duplicates must not be created. |
| FR-007 | Verification review/linking | I | Staff review links a demographic patient and account transactionally; approval is not automatic. | [source](../../apps/api/src/routes/verification-review.ts) | Check conflict/rollback and two-account isolation. |
| FR-008 | Patient management | I | Staff demographic listing, creation and update; no general archive/delete workflow. | [source](../../apps/api/src/routes/portal-router.ts) | Verify validation, persistence, pagination and unauthorized denial. |
| FR-009 | Staff appointments | P | Staff scheduling/status updates exist; configurable service names conflict with fixed API enum. | [source](../../apps/api/src/validation/portal.ts) | Create supported appointment; test custom clinic service rejection and fix before acceptance. |
| FR-010 | Patient care read | P | Linked patient appointment summary is read-only, bounded; no clinical chart. | [source](../../apps/api/src/routes/account.ts) | Verify own linked account only and unlinked denial. |
| FR-011 | Medical records | U | No clinical records metadata/observations backend; unavailable presentation is not a chart. | [source](../../database/migrations) | Requires approved clinical model and document access rules. |
| FR-012 | Checkups | U | No clinical assessment/vitals persistence; completed appointments are not checkup records. | [source](../../database/migrations) | Requires clinical schema, API and clinician workflow tests. |
| FR-013 | Inventory | U | No inventory or stock movement schema/endpoints. | [source](../../database/migrations) | Requires stock integrity and audited movement design. |
| FR-014 | Messages | U | No conversations/messages persistence or participant authorization. | [source](../../database/migrations) | Requires participant model and isolation tests. |
| FR-015 | Reports | P | Aggregate demographic/appointment reports; no clinical outcomes or inventory analytics. | [source](../../apps/api/src/routes/portal-router.ts) | Reconcile aggregation using synthetic fixtures; historical imports can increase new-record counts. |
| FR-016 | Staff own profile | I | Authenticated own name/contact updates; no arbitrary account editing. | [source](../../apps/api/src/routes/settings-profile.ts) | Save/reload and attempt another profile identifier. |
| FR-017 | Staff avatars | B | Private JPEG 3 MiB upload, normalization, signing, replacement/removal and cleanup; environment gated. | [source](../../apps/api/src/routes/profile-avatar.ts) | Run authorized disposable-account lifecycle and restoration against Storage. |
| FR-018 | Clinic configuration | I | Singleton admin edits with revision/audit; staff read; reduced patient fields only after opt-in. | [source](../../apps/api/src/routes/clinic-settings.ts) | Enter approved facts, conflict two edits, test patient_visible false/true and rollback. |
| FR-019 | Persistent notifications | U | No notification table/event delivery/read-state implementation. | [source](../../database/migrations) | Requires persistence, preferences and event authorization. |
| FR-020 | Privacy and account | P | Supported Auth actions and configured policy links; approved policy publication not established. | [source](../../apps/web/src/pages/settings.tsx) | Verify approved URLs, password recovery and actual supported actions. |
| FR-021 | Historical imports | B | Admin CSV/XLSX mapping, encrypted staging, duplicate review and transactional confirmation; scanner/key gates. | [source](../../apps/api/src/imports/router.ts) | Use synthetic files with scanner; verify rollback, retry, provenance and expiry in isolated DB. |
| FR-022 | Existing staff access | P | Admin changes membership/activation; not a complete Auth invitation lifecycle. | [source](../../apps/api/src/routes/staff-access.ts) | Verify deactivation/self-lockout protections and role refresh. |
| FR-023 | Education bookmarks | I | Device-local bookmarks; no cross-device persistence. | [source](../../apps/mobile/src/lib/education.ts) | Bookmark/reload locally; do not claim server sync. |
| FR-024 | Educational content | I | Four static WHO-linked resources; no editorial CMS. | [source](../../apps/mobile/src/lib/education.ts) | Open external resources and verify safe fallback. |
| FR-025 | Web theme and responsiveness | I | Light/dark/system web themes; visual/device verification remains required. | [source](../../apps/web/src/pages/settings.tsx) | Keyboard, narrow viewport and both theme checks. |
| FR-026 | Health monitoring | U | No longitudinal vitals/health progress backend. | [source](../../database/migrations) | Requires clinical data and ownership model. |
| FR-027 | Community | U | No posts, moderation or community backend. | [source](../../apps/mobile/src/app) | Do not present placeholder navigation as a functioning community. |
| FR-028 | Staff invitation/provisioning | U | No complete invite/create Auth staff workflow. | [source](../../apps/api/src/routes/staff-access.ts) | Requires approved Auth administration and activation workflow. |
| FR-029 | Patient booking | U | Patient care appointments are read-only; no patient booking/reschedule/cancel endpoint. | [source](../../apps/api/src/routes/account.ts) | Requires booking conflict, policy and ownership enforcement. |
| FR-030 | Audit trails | P | Selected mutation metadata and import events persist; no comprehensive audit viewer. | [source](../../database/migrations/001_initial_schema.sql) | Reconcile each supported mutation and rollback; avoid storing patient values in event details. |
