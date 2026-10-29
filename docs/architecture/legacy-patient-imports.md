# Legacy patient demographics import

## Delivery status

This change adds the administrator import workspace, API orchestration, encrypted
staging, mapping/validation, duplicate decisions, transactional confirmation,
provenance, history, error reports and retention cleanup. It preserves the existing
patient model and account-to-patient verification/linking workflow. Only patient
number, name, optional birth date and optional contact number are created.

**This is not a verified production release.** Package installation was attempted
but the environment's package proxy refused connections (`ECONNREFUSED` to the
configured proxy). `csv-parse`, `exceljs`, and `yauzl` are declared dependencies,
but could not be installed or parser-tested here. The existing lockfiles could
not be regenerated; run the dependency installation below in a network-enabled
development environment and review/commit its lockfile changes before CI or deployment.
The secure registry installation was retried during continuation and still failed
at the configured proxy (`ECONNREFUSED 127.0.0.1:9`). TLS verification, registry and
proxy settings were not weakened. Uploads and patient-import confirmation require
`IMPORTS_ENABLED=true` as well as dependencies, encryption and scanner configuration.
The switch defaults off. No database migration was applied and no deployed service
was contacted. The local API `.env` was checked for prerequisite presence only:
no import approval switch, encryption key or scanner settings were present. No
secret values were printed or changed.

## Repository inspection and integration

Inspected `apps/mobile/AGENTS.md` (the discovered repository instructions), all
three existing migrations, `patients`, `patient_verifications`, staff middleware,
Express mounts, PostgreSQL TLS configuration, portal session/role handling and
the Patients module before implementing. Mobile files are unchanged.

Existing `patients.profile_id` is nullable and unique. Historical patients remain
unlinked: import SQL explicitly inserts `profile_id=NULL`. There are no Auth
administration calls, profile promotions, clinical updates, or automatic merges.
All import routes are mounted before the broader staff router and the global
JSON parser. They use the existing JWT middleware plus an intrinsic administrator
guard in the import router. That guard requires an active admin staff membership
and a staff/admin profile; caller-supplied role/uploader fields are never trusted.
Mutation transactions also recheck/lock the active membership and profile. Other
modules' authentication and verification middleware are unchanged. Import metadata
JSON is bounded to 64 KiB and parsed after authorization, with sanitized errors.

## Formats and limits

| Format | Status |
| --- | --- |
| UTF-8 CSV | Parser implemented using `csv-parse`; execution tests blocked by unavailable dependency. Comma delimiter; quoted delimiters/newlines and BOM supported. Consistent column counts required. |
| XLSX | Parser implemented using ExcelJS plus yauzl ZIP inspection; execution tests blocked by unavailable dependencies. Exactly one worksheet; values only. Native date cells become ISO dates. |
| XLS | Not implemented. Convert to values-only XLSX or UTF-8 CSV using the clinic's approved tools. |
| JSON, PDF, scanned PDF/OCR, SQL | Not implemented; rejected. No uploaded SQL is executed and no external AI/OCR service is called. |

Upload maximum: 8 MiB, 10,000 data rows, 50 columns, 1,000 characters per cell,
120 per header, 8 MiB total extracted text. XLSX ZIP maximum: 500 entries and
32 MiB expanded data, checked against both metadata and actual streamed bytes.
Encrypted ZIPs, embedded binary content, external-link relationships, formula,
hyperlink, rich-text and error cells are rejected. Worker parsing is limited to
20 seconds, a 128 MiB old-generation heap and 16 MiB young-generation heap;
these are not a total OS RSS guarantee. Two uploads per API process and three
active jobs per administrator are allowed. Configure aggregate quotas across replicas.

Files should contain a single header row. Blank Excel rows remain reviewable
rows; blank CSV lines are ignored. Keep clinic identifiers and telephone numbers
as text: numeric formatting/leading zeros cannot reliably be recovered. Row
numbers refer to parsed logical rows, not physical CSV lines when cells contain
newlines. Extra columns are ignored by the import but encrypted in staging until
retention cleanup. Upload only the necessary demographics.

## Workflow

1. An administrator chooses/drops a file and supplies a stable, non-patient source
   label. The server creates a job using the JWT identity and an idempotency UUID.
2. Raw bytes enter private, volatile memory. ClamAV must return a clean result
   before the parser runs. Scan failure/unavailability prevents staging.
3. Source bytes and each parsed row are encrypted with AES-256-GCM before being
   persisted. Job/row-specific authenticated context prevents substitution.
4. Column aliases suggest mappings; an administrator explicitly selects required
   name and patient-number columns and optional fields. Mapping must be unique.
5. Validation normalizes Unicode and dates. ISO, DMY and MDY are explicit choices;
   ambiguous day/month dates receive warnings. Invalid dates, missing fields,
   invalid identifiers/contact numbers and repeated identifiers receive row errors.
6. Exact patient numbers (case-insensitive) and source-system/legacy-identifier
   fingerprints block creation. Possible matches use normalized name, or equal
   birth date plus normalized telephone number. Names alone never trigger a merge.
   More than 20 demographic candidates block import for that row. Administrators
   can open existing patient profiles to compare details.
7. Every row requires an explicit `create` or `skip` decision. Invalid/exact-match
   rows must be skipped. Warnings and possible matches require acknowledgement
   before creating a separate patient. Decisions and acknowledgement are audited.
   There is no merge/update/link-to-existing action; resolve those outside import.
8. Confirmation requires `confirm:true` and the current review revision. It locks
   the job, serializes patient writes, rechecks matches, inserts unlinked patients
   and encrypted provenance, audits every created patient and commits atomically.
   Any failure rolls back all patient/provenance/audit changes in that transaction.
   Completed-job retries return the stored counts without inserting again.
9. History and the latest 100 audit events are admin-only. Error downloads contain
   row numbers, decisions and issue codes only; CSV cells are escaped and formula
   prefixes neutralized. Raw source downloads are not exposed.

The UI shows genuine operation states with indeterminate progress, not simulated
percentages. Validation and confirmation are synchronous bounded requests, not
a durable background queue. A lost response can be recovered by opening history
and refreshing/retrying the job. Revalidation resets decisions. Unsaved decisions
apply only to the current page. The UI blocks preview pagination, refresh, error
downloads and opening another import until choices are saved or explicitly
discarded. Changing mapping disables confirmation until revalidation. Failed file
selection clears the previous file; scan/parse errors have specific safe messages.

## Additive migration

`database/migrations/004_legacy_patient_imports.sql` creates:

- `patient_import_jobs`: uploader, idempotency key, source label, file digest,
  encrypted source, mapping, revisions, timestamps and counts.
- `patient_import_rows`: encrypted source/normalized values, validation codes,
  candidate IDs, decisions and imported patient references.
- `patient_import_provenance`: job/row/patient links, encrypted original legacy
  identifier, keyed fingerprint, source-file digest, actor and import timestamp.
- `patient_import_events`: actor, action, row decisions/counts and timestamps.

Foreign keys and uniqueness enforce provenance and job idempotency. RLS is enabled
and privileges are revoked from PUBLIC, `anon` and `authenticated` on all new
tables. There are no direct-client policies. Existing patient columns/data,
verification rows and clinical information are untouched. Source identifier
fingerprints use HMAC with the encryption key, not a reversible plain hash.

**Do not apply automatically.** A database owner must review and explicitly
approve/apply migration 004 after 001–003. Verify backup/restore procedures first.

Static compatibility review: all referenced `profiles.id` and `patients.id`
columns are UUIDs in migration 001; its `pgcrypto` extension supplies the existing
UUID generation convention. Migrations 002/003 retain those columns and the
nullable, unique `patients.profile_id` linkage. Migration 004 adds four new tables
and three non-unique lookup indexes on existing patient columns; it does not alter
the auth trigger, policies or verification columns. Its role revokes assume the
same Supabase `anon`/`authenticated` roles already used by migration 002. No
execution, PostgreSQL-version compatibility or deployed-grant check was performed.
Index creation can block writes while the unapplied migration runs; schedule and
review that before approval. The lookup indexes do not enforce new uniqueness
on historical records.

## API contract

All paths below are relative to `/api/v1/staff/imports` and require active
administrator authorization. Responses use `Cache-Control: no-store`.

| Method / path | Action |
| --- | --- |
| GET `/capabilities` | Deployment approval, formats, limits and security/parser configuration readiness; not scanner health or database readiness. |
| POST `/` | `{filename,source_system,idempotency_key}` creates/replays a job. Uploader/role/profile IDs are rejected. |
| PUT `/:id/file` | Raw `application/octet-stream`; scans, parses and stages once. Identical file-digest retry replays; replacement is refused. |
| POST `/:id/validate` | `{mapping:{full_name,patient_number,...},date_order}`; zero-based column indexes; resets decisions and increments revision. |
| GET `/:id/rows?page=1` | Fifty decrypted preview rows with issues, warnings, candidate patient IDs and decisions; unavailable after expiry. |
| POST `/:id/decisions` | `{revision,decisions:[{row_number,decision}],acknowledge_warnings}`; maximum 100 decisions; increments revision. |
| POST `/:id/confirm` | `{revision,confirm:true}`; requires secure deployment enabled; atomic commit or idempotent completed result. |
| GET `/:id` | Job status, revision, mapping and review/summary counts. |
| GET `/?page=1` | Twenty history entries per page. |
| GET `/:id/events` | Latest 100 metadata/decision audit events. |
| GET `/:id/errors` | Audited JSON `{filename,csv}` error report; client saves a private CSV download. |
| DELETE `/:id` | Cancels an active job and clears encrypted staging/source; retains audit metadata. |

UUIDs and request schemas are validated; SQL values are parameterized. Uploads
are rate-limited before buffering and parser work. Jobs can be reviewed by other
active administrators, not only the uploader. An expired staging job cannot be
confirmed. There is no cross-user account linkage or raw SQL extraction endpoint.

## Deployment and privacy checklist

1. In a network-enabled development environment, run `npm install --workspace=apps/api`
   from the root; review dependency advisories, regenerate the root/workspace
   lockfiles used by your deployment, and run **all parser tests without skips**.
   Do not publish advertised format support until those tests and manual imports pass.
   Run `npm run test:imports:release --workspace=apps/api`: it fails immediately
   if parser libraries are missing, so a development suite with skipped parser
   cases cannot be mistaken for a release pass. Leave `IMPORTS_ENABLED=false`
   until parser tests, relevant PostgreSQL integration checks and security/manual
   verification pass. Only then should an operator explicitly enable imports.
2. After explicit approval, apply migration 004 in a disposable database first,
   then run integration/rollback/concurrency and permission checks before production.
3. Configure `IMPORT_ENCRYPTION_KEY` as 64 random hexadecimal characters in a
   secret manager. Keep it stable across replicas and back it up securely. Key
   rotation requires a planned decrypt/re-encrypt and fingerprint migration; no
   automatic rotation/key-versioning is implemented. Never log the key.
4. Run maintained ClamAV with current signatures on localhost/a trusted private
   network; set `IMPORT_CLAMD_HOST` and `IMPORT_CLAMD_PORT`. Align its stream size
   with the upload limit. The INSTREAM connection is plain private TCP, so use
   localhost or an encrypted private tunnel between hosts. Do not expose ClamAV.
5. Deploy API and portal behind HTTPS. The existing pg pool validates the database
   TLS CA. Provider storage/backup encryption and network isolation must be
   verified by the operator; this repository cannot attest to them. Patient values
   inserted into `patients` rely on existing database at-rest controls; staging
   and original source identifiers receive application-level encryption.
6. Use a dedicated backend database role, not a superuser or broad client key.
   Provision only necessary SELECT/INSERT/UPDATE rights and trusted backend RLS
   policies for the four new tables; no direct mobile/browser policies. The role
   also needs patient SELECT/INSERT, staff/profile SELECT with row-lock rights,
   and audit INSERT rights. Confirmation's `SHARE ROW EXCLUSIVE` table lock needs
   an additional privilege accepted by your PostgreSQL version (for example the
   existing portal role's patient UPDATE privilege, or MAINTAIN on versions that
   support it). See [PostgreSQL LOCK privileges](https://www.postgresql.org/docs/current/sql-lock.html).
   Do not grant DELETE/TRUNCATE or Auth administration for imports. The importer
   issues no patient UPDATE/DELETE. Account for the existing API's other modules
   when changing its shared role. Do not grant broad privileges automatically.
7. Stage/source values expire after 24 hours. API cleanup runs at startup and
   every 15 minutes when `IMPORTS_ENABLED=true` or `IMPORT_RETENTION_ENABLED=true`, clearing row
   ciphertext/source bytes and expiring unfinished jobs. Preview and mutation
   requests refuse expired data immediately. Schedule `purgeExpiredImports` via
   a trusted operator-owned job if the API sleeps or is disabled; monitor failures.
   After the approved migration is applied, set `IMPORT_RETENTION_ENABLED=true`
   to retain cleanup while disabling new uploads/confirmation. Cleanup does not
   depend on scanner availability or parser installation.
   Encrypted source bytes are removed immediately on successful import. Job,
   decision/audit metadata and provenance remain for historical accountability;
   approve their retention and encrypted backup policy separately.
8. Bound reverse-proxy request timeouts, worker/container memory and connection
   quotas; test realistic register sizes and DB latency. Confirmation locks the
   patient table against other writes until commit. Use a maintenance window for
   large batches; a durable background queue, cancel-in-flight support and resumable
   multi-request processing are not implemented. A staging transaction failure
   leaves the job in its prior state; it does not retain a failed raw upload.
9. Keep request-body logging/APM payload capture disabled for these endpoints and
   database bindings. The implementation emits no patient values to logs. Restrict
   and protect administrator devices and downloaded error reports.

## Validation actually performed

API TypeScript checks, portal lint and the production build passed locally.
Vite reported its advisory warning for a main chunk slightly above 500 kB;
the import workspace itself is loaded as a separate chunk. The import suite
reported **20 passed, 0 failed and 3 skipped** after continuation. The local
test suite uses synthetic values only. Domain/encryption tests exercise validation,
duplicates and CSV escaping. Transaction tests use in-memory query doubles to
exercise rollback, audit writes, unlinked creation, stale/invalid reviews, conflict
rechecks, retry idempotency and 1,001-row batch traversal. HTTP tests verify that
all import endpoints reject missing authentication before data/parser access.
Tests now exercise the intrinsic admin guard across every endpoint with controlled
database query doubles for general/patient accounts, all non-admin staff roles,
inactive admins and admins with an ineligible profile. Transaction tests also
verify the active-admin recheck rejects an ineligible actor.

Additional tests verify upload type/size/empty-body rejection, sanitized malformed
JSON errors, quarantine failure before parsing, parser failure rollback and the
disabled confirmation/upload gate. Scanner tests use a synthetic local TCP service
to verify INSTREAM framing, clean/non-clean verdict handling, disconnect rejection
and an absolute deadline despite trickled data. They do not run actual ClamAV or
verify deployed signatures. Worker rejection of empty/oversized/unsupported files
also runs without parser dependencies.

| Check | Continuation result |
| --- | --- |
| API typecheck | Passed. |
| Import development suite | 20 passed, 3 parser cases skipped. |
| Required import release gate | Blocked/fails prerequisite: `csv-parse` unavailable; no parser-release pass. |
| Existing API onboarding tests | 10 passed. |
| Existing API portal tests | 7 passed. |
| Web lint and TypeScript/production build | Passed; 502.07 kB main chunk warning remains, import UI is a separate lazy chunk. |
| Mobile TypeScript | Passed; no mobile source changes. |
| Existing mobile UI/helper tests | 8 passed. |
| Mobile lint | Blocked: no existing ESLint config; Expo attempted setup and the configured proxy refused the dependency request. No generated mobile configuration/source changes remain. |
| Browser interaction/layout | Blocked: Computer Use inventory reported the browser access host unavailable. Existing signed-in browser data was not used for tests. |
| Migration compatibility | Reviewed statically against 001–003; unapplied and unexecuted. |
| Cache exclusions | `git check-ignore` confirmed `.codex/npm-cache/` and API `.test-output/` exclusion. No unrelated prompt files or caches deleted. |

CSV/XLSX parser tests exist but were skipped because packages could not be installed.
Real PostgreSQL SQL execution, RLS/grants, concurrent commits, migration application,
real ClamAV scanning, browser interaction/visual layout and deployed behavior were
**not tested**. No full end-to-end import is claimed. Run `npm run test:imports
--workspace=apps/api`, API typechecks, web lint/build, and the manual checks above
after dependencies and a disposable environment are available. A developer must
complete real SQL constraint/permission, concurrent-confirmation, rollback,
patient-linkage preservation and CSV/XLSX-to-database integration tests against
an approved disposable environment before enabling real patient imports.

## Continuation state and commit scope

Existing implementation was continued in place. No code or migrations were
reset, no prior documentation was duplicated, and no commit was created. The
untracked `PROMPTS/` directory was present at the start of continuation and is
unrelated; leave it out of an import-feature commit unless separately intended.
The earlier permission-blocked cache remains excluded rather than retried for
deletion. Root/workspace lockfiles remain unchanged because installation failed.

## Changed files

Backend: `apps/api/src/imports/*`, `apps/api/src/server.ts`,
`apps/api/package.json`, `apps/api/.env.example`.
Portal: `apps/web/src/pages/patient-imports.tsx`, its CSS,
`apps/web/src/pages/patients.tsx`, `apps/web/src/lib/portal.ts`, `apps/web/src/App.tsx`.
Schema: `database/migrations/004_legacy_patient_imports.sql` (unapplied).
This guide records scope, limitations, security controls and deployment verification.
