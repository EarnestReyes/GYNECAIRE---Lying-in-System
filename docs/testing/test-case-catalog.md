# Automated test case catalog

All 81 cases below ran and passed on 2026-10-30 with zero skipped. Titles and source locations were extracted from the actual test declarations.

Common preconditions: installed workspace dependencies and current source. Steps: run the containing suite listed in [results](test-results.md); Node test runner executes the named declaration. Expected result: its source assertions succeed. Actual result: PASS. Test-specific fixtures/steps/assertions are in the linked test, which is the authoritative executable procedure. Most API route tests use injected query/Storage doubles; parser and sharp decoding cases exercise real libraries, not a deployed database.

| ID | Module / case (expected assertions) | Source / detailed steps | Actual |
|---|---|---|---|
| TC-API-001 | Unicode names, empty optional cells and aliases are preserved | [apps/api/src/imports/domain.test.ts:6](../../apps/api/src/imports/domain.test.ts#L6) | PASS |
| TC-API-002 | required fields, dates, contact, unknown fields and duplicate mappings are rejected | [apps/api/src/imports/domain.test.ts:10](../../apps/api/src/imports/domain.test.ts#L10) | PASS |
| TC-API-003 | ambiguous dates require review, text order is explicit, impossible dates fail | [apps/api/src/imports/domain.test.ts:16](../../apps/api/src/imports/domain.test.ts#L16) | PASS |
| TC-API-004 | duplicates are flagged without merging names; decisions enforce warnings | [apps/api/src/imports/domain.test.ts:21](../../apps/api/src/imports/domain.test.ts#L21) | PASS |
| TC-API-005 | error CSV escapes quotes, line breaks and formula prefixes | [apps/api/src/imports/domain.test.ts:31](../../apps/api/src/imports/domain.test.ts#L31) | PASS |
| TC-API-006 | staging encryption authenticates ciphertext and row/job context | [apps/api/src/imports/domain.test.ts:35](../../apps/api/src/imports/domain.test.ts#L35) | PASS |
| TC-API-007 | worker rejects empty, oversized and unsupported input without parser dependencies | [apps/api/src/imports/parser.test.ts:7](../../apps/api/src/imports/parser.test.ts#L7) | PASS |
| TC-API-008 | CSV: BOM, quoted Unicode, empty cells and 10,000 rows | [apps/api/src/imports/parser.test.ts:12](../../apps/api/src/imports/parser.test.ts#L12) | PASS |
| TC-API-009 | malformed quotes, invalid UTF-8, unsupported formats and empty files | [apps/api/src/imports/parser.test.ts:16](../../apps/api/src/imports/parser.test.ts#L16) | PASS |
| TC-API-010 | XLSX: dates, formula rejection and multiple worksheet rejection | [apps/api/src/imports/parser.test.ts:19](../../apps/api/src/imports/parser.test.ts#L19) | PASS |
| TC-API-011 | import database capability probe fails closed without schema/permissions and reads no patient rows | [apps/api/src/imports/readiness.test.ts:5](../../apps/api/src/imports/readiness.test.ts#L5) | PASS |
| TC-API-012 | every import endpoint rejects missing authentication before touching data or parser | [apps/api/src/imports/router.test.ts:8](../../apps/api/src/imports/router.test.ts#L8) | PASS |
| TC-API-013 | administrator policy rejects other roles and inactive/ineligible accounts on every endpoint | [apps/api/src/imports/router.test.ts:13](../../apps/api/src/imports/router.test.ts#L13) | PASS |
| TC-API-014 | deployment approval, encryption and scanner prerequisites fail closed | [apps/api/src/imports/scanner.test.ts:7](../../apps/api/src/imports/scanner.test.ts#L7) | PASS |
| TC-API-015 | ClamAV INSTREAM framing sends the complete synthetic file and requires clean verdict | [apps/api/src/imports/scanner.test.ts:28](../../apps/api/src/imports/scanner.test.ts#L28) | PASS |
| TC-API-016 | scanner rejects a non-clean verdict and a lost connection | [apps/api/src/imports/scanner.test.ts:31](../../apps/api/src/imports/scanner.test.ts#L31) | PASS |
| TC-API-017 | scanner deadline is absolute even if the service trickles data | [apps/api/src/imports/scanner.test.ts:34](../../apps/api/src/imports/scanner.test.ts#L34) | PASS |
| TC-API-018 | atomic import is audited, leaves profile_id null and confirmation retry is idempotent | [apps/api/src/imports/service.test.ts:30](../../apps/api/src/imports/service.test.ts#L30) | PASS |
| TC-API-019 | failed provenance write rolls back patients and audit, and retry succeeds | [apps/api/src/imports/service.test.ts:33](../../apps/api/src/imports/service.test.ts#L33) | PASS |
| TC-API-020 | inactive/non-admin, stale review and unresolved/invalid rows never create patients | [apps/api/src/imports/service.test.ts:34](../../apps/api/src/imports/service.test.ts#L34) | PASS |
| TC-API-021 | large synthetic import reads staging in batches of at most 100 | [apps/api/src/imports/service.test.ts:37](../../apps/api/src/imports/service.test.ts#L37) | PASS |
| TC-API-022 | newly conflicting identifiers and changed match lists block confirmation | [apps/api/src/imports/service.test.ts:38](../../apps/api/src/imports/service.test.ts#L38) | PASS |
| TC-API-023 | explicitly skipped invalid records do not create patients | [apps/api/src/imports/service.test.ts:39](../../apps/api/src/imports/service.test.ts#L39) | PASS |
| TC-API-024 | upload transport rejects invalid bodies; quarantine failures roll back without parsing | [apps/api/src/imports/upload.test.ts:10](../../apps/api/src/imports/upload.test.ts#L10) | PASS |
| TC-API-025 | clinic validation rejects role assignment, invalid hours/timezone, duplicate services and unsafe policy values | [apps/api/src/routes/clinic-settings.test.ts:9](../../apps/api/src/routes/clinic-settings.test.ts#L9) | PASS |
| TC-API-026 | patient projection requires publication and omits internal metadata and scheduling fields | [apps/api/src/routes/clinic-settings.test.ts:13](../../apps/api/src/routes/clinic-settings.test.ts#L13) | PASS |
| TC-API-027 | clinic HTTP read/write authorization, persistence, conflicts, failure rollback and patient publication | [apps/api/src/routes/clinic-settings.test.ts:17](../../apps/api/src/routes/clinic-settings.test.ts#L17) | PASS |
| TC-API-028 | existing portal endpoints require authentication before database access | [apps/api/src/routes/portal-router.test.ts:10](../../apps/api/src/routes/portal-router.test.ts#L10) | PASS |
| TC-API-029 | connected patient/appointment/report HTTP routes preserve validation, audit transactions and final-status protection | [apps/api/src/routes/portal-router.test.ts:15](../../apps/api/src/routes/portal-router.test.ts#L15) | PASS |
| TC-API-030 | avatar validation rejects unknown content, empty files, oversized images and foreign paths | [apps/api/src/routes/profile-avatar.test.ts:10](../../apps/api/src/routes/profile-avatar.test.ts#L10) | PASS |
| TC-API-031 | configuration diagnostics name missing prerequisites without returning credential values | [apps/api/src/routes/profile-avatar.test.ts:16](../../apps/api/src/routes/profile-avatar.test.ts#L16) | PASS |
| TC-API-032 | own-avatar HTTP lifecycle checks active staff, isolates object paths, rolls back and queues cleanup | [apps/api/src/routes/profile-avatar.test.ts:21](../../apps/api/src/routes/profile-avatar.test.ts#L21) | PASS |
| TC-API-033 | real decoder validates content and emits a stripped square JPEG when sharp is installed | [apps/api/src/routes/profile-avatar.test.ts:53](../../apps/api/src/routes/profile-avatar.test.ts#L53) | PASS |
| TC-API-034 | private storage adapter uses server credentials, unique object uploads and five-minute signing | [apps/api/src/routes/profile-avatar.test.ts:60](../../apps/api/src/routes/profile-avatar.test.ts#L60) | PASS |
| TC-API-035 | cleanup retries failed objects independently and excludes current references in its bounded query | [apps/api/src/routes/profile-avatar.test.ts:70](../../apps/api/src/routes/profile-avatar.test.ts#L70) | PASS |
| TC-API-036 | bucket privacy/type/limit mismatches fail closed before any mutation | [apps/api/src/routes/profile-avatar.test.ts:77](../../apps/api/src/routes/profile-avatar.test.ts#L77) | PASS |
| TC-API-037 | profile endpoint preserves identity/roles, audits successful changes and rolls back audit failure | [apps/api/src/routes/settings-profile.test.ts:8](../../apps/api/src/routes/settings-profile.test.ts#L8) | PASS |
| TC-API-038 | access schema rejects unknown roles, privilege fields and unreviewed updates | [apps/api/src/routes/staff-access.test.ts:9](../../apps/api/src/routes/staff-access.test.ts#L9) | PASS |
| TC-API-039 | staff access rejects non-admin/self/stale/ineligible changes; successful mutations are atomic and audited | [apps/api/src/routes/staff-access.test.ts:12](../../apps/api/src/routes/staff-access.test.ts#L12) | PASS |
| TC-API-040 | accepts minimal consented intake without record identifiers | [apps/api/src/validation/onboarding.test.ts:5](../../apps/api/src/validation/onboarding.test.ts#L5) | PASS |
| TC-API-041 | requires explicit consent | [apps/api/src/validation/onboarding.test.ts:6](../../apps/api/src/validation/onboarding.test.ts#L6) | PASS |
| TC-API-042 | rejects invalid and future dates | [apps/api/src/validation/onboarding.test.ts:7](../../apps/api/src/validation/onboarding.test.ts#L7) | PASS |
| TC-API-043 | rejects self-assigned patient linkage and privileges | [apps/api/src/validation/onboarding.test.ts:8](../../apps/api/src/validation/onboarding.test.ts#L8) | PASS |
| TC-API-044 | rejects phone numbers without enough digits | [apps/api/src/validation/onboarding.test.ts:9](../../apps/api/src/validation/onboarding.test.ts#L9) | PASS |
| TC-API-045 | accepts empty optional interests | [apps/api/src/validation/onboarding.test.ts:10](../../apps/api/src/validation/onboarding.test.ts#L10) | PASS |
| TC-API-046 | rejects unknown and duplicate interests | [apps/api/src/validation/onboarding.test.ts:11](../../apps/api/src/validation/onboarding.test.ts#L11) | PASS |
| TC-API-047 | approval requires patient id and identity confirmation | [apps/api/src/validation/onboarding.test.ts:12](../../apps/api/src/validation/onboarding.test.ts#L12) | PASS |
| TC-API-048 | accepts explicit staff approval | [apps/api/src/validation/onboarding.test.ts:13](../../apps/api/src/validation/onboarding.test.ts#L13) | PASS |
| TC-API-049 | rejection cannot link a patient | [apps/api/src/validation/onboarding.test.ts:14](../../apps/api/src/validation/onboarding.test.ts#L14) | PASS |
| TC-API-050 | minimal patient intake accepts nullable optional contact details | [apps/api/src/validation/portal.test.ts:6](../../apps/api/src/validation/portal.test.ts#L6) | PASS |
| TC-API-051 | patient intake cannot assign an account or clinical status | [apps/api/src/validation/portal.test.ts:7](../../apps/api/src/validation/portal.test.ts#L7) | PASS |
| TC-API-052 | patient dates and contact numbers are validated | [apps/api/src/validation/portal.test.ts:10](../../apps/api/src/validation/portal.test.ts#L10) | PASS |
| TC-API-053 | patient pagination is bounded and rejects unknown linkage status | [apps/api/src/validation/portal.test.ts:15](../../apps/api/src/validation/portal.test.ts#L15) | PASS |
| TC-API-054 | appointments require an explicit timezone and valid patient UUID | [apps/api/src/validation/portal.test.ts:20](../../apps/api/src/validation/portal.test.ts#L20) | PASS |
| TC-API-055 | appointment updates cannot reassign a patient or create an unsupported status | [apps/api/src/validation/portal.test.ts:26](../../apps/api/src/validation/portal.test.ts#L26) | PASS |
| TC-API-056 | reports enforce ordered bounded date ranges | [apps/api/src/validation/portal.test.ts:30](../../apps/api/src/validation/portal.test.ts#L30) | PASS |
| TC-API-057 | personal profile accepts Unicode names and optional contact | [apps/api/src/validation/settings.test.ts:4](../../apps/api/src/validation/settings.test.ts#L4) | PASS |
| TC-API-058 | personal profile rejects access escalation and editing another account | [apps/api/src/validation/settings.test.ts:5](../../apps/api/src/validation/settings.test.ts#L5) | PASS |
| TC-API-059 | personal profile rejects invalid names and contact numbers | [apps/api/src/validation/settings.test.ts:6](../../apps/api/src/validation/settings.test.ts#L6) | PASS |
| TC-WEB-001 | photo picker permits only nonempty JPEG files within the existing 3 MiB bucket limit | [apps/web/tests/avatar.test.ts:4](../../apps/web/tests/avatar.test.ts#L4) | PASS |
| TC-WEB-002 | photo setup feedback distinguishes missing flags, credentials, decoder, schema and storage | [apps/web/tests/avatar.test.ts:8](../../apps/web/tests/avatar.test.ts#L8) | PASS |
| TC-WEB-003 | clinic editor starts with blank facts and keeps version/actor out of the submitted configuration | [apps/web/tests/clinic-settings.test.ts:4](../../apps/web/tests/clinic-settings.test.ts#L4) | PASS |
| TC-WEB-004 | clinic form catches incomplete hours and duplicate services before submission | [apps/web/tests/clinic-settings.test.ts:7](../../apps/web/tests/clinic-settings.test.ts#L7) | PASS |
| TC-WEB-005 | all sidebar destinations and dedicated import URLs resolve correctly | [apps/web/tests/portal.test.ts:6](../../apps/web/tests/portal.test.ts#L6) | PASS |
| TC-WEB-006 | all quick actions resolve to their intended connected module | [apps/web/tests/portal.test.ts:7](../../apps/web/tests/portal.test.ts#L7) | PASS |
| TC-WEB-007 | shared theme covers nested action surfaces and import stylesheet has no fixed white backgrounds | [apps/web/tests/portal.test.ts:8](../../apps/web/tests/portal.test.ts#L8) | PASS |
| TC-WEB-008 | import navigation serializes and restores canonical and legacy routes without losing the workspace | [apps/web/tests/portal.test.ts:14](../../apps/web/tests/portal.test.ts#L14) | PASS |
| TC-WEB-009 | patient deep links accept only a valid UUID on the patient route | [apps/web/tests/portal.test.ts:19](../../apps/web/tests/portal.test.ts#L19) | PASS |
| TC-WEB-010 | six-step wizard prevents confirmation before reviewed validation and preserves completed-job boundaries | [apps/web/tests/portal.test.ts:20](../../apps/web/tests/portal.test.ts#L20) | PASS |
| TC-WEB-011 | password checks reject short, reused and unmatched passwords before an Auth request | [apps/web/tests/settings.test.ts:5](../../apps/web/tests/settings.test.ts#L5) | PASS |
| TC-WEB-012 | password update sends current verification and nonce only to Auth, and rejects provider errors | [apps/web/tests/settings.test.ts:9](../../apps/web/tests/settings.test.ts#L9) | PASS |
| TC-WEB-013 | theme validation and blocked storage have safe fallbacks | [apps/web/tests/settings.test.ts:14](../../apps/web/tests/settings.test.ts#L14) | PASS |
| TC-WEB-014 | theme persists across restarts, follows system changes and synchronizes other tabs | [apps/web/tests/settings.test.ts:15](../../apps/web/tests/settings.test.ts#L15) | PASS |
| TC-MOB-001 | date validation accepts leap days and rejects rollover, future, and partial dates | [apps/mobile/tests/refinement.test.ts:9](../../apps/mobile/tests/refinement.test.ts#L9) | PASS |
| TC-MOB-002 | email and phone errors reject missing or unusable contact details | [apps/mobile/tests/refinement.test.ts:13](../../apps/mobile/tests/refinement.test.ts#L13) | PASS |
| TC-MOB-003 | password confirmation cannot pass when empty, short, or different | [apps/mobile/tests/refinement.test.ts:19](../../apps/mobile/tests/refinement.test.ts#L19) | PASS |
| TC-MOB-004 | only a backend patient account selects patient navigation | [apps/mobile/tests/refinement.test.ts:25](../../apps/mobile/tests/refinement.test.ts#L25) | PASS |
| TC-MOB-005 | public education can be found by topic and category together | [apps/mobile/tests/refinement.test.ts:33](../../apps/mobile/tests/refinement.test.ts#L33) | PASS |
| TC-MOB-006 | saved resources reject corrupt values, unknown ids, and duplicates | [apps/mobile/tests/refinement.test.ts:38](../../apps/mobile/tests/refinement.test.ts#L38) | PASS |
| TC-MOB-007 | every public resource opens an attributed HTTPS WHO page | [apps/mobile/tests/refinement.test.ts:43](../../apps/mobile/tests/refinement.test.ts#L43) | PASS |
| TC-MOB-008 | body, accent, success, and error text meet normal-text contrast on their backgrounds | [apps/mobile/tests/refinement.test.ts:46](../../apps/mobile/tests/refinement.test.ts#L46) | PASS |
