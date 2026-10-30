# Staff avatars: existing Supabase integration

Inspection date: October 30, 2026. Scope confirmed by the user: **avatars only**. Clinic configuration, inventory, clinical documents, messaging, notifications and policy publishing are follow-up work. No application data, Auth accounts, migrations, bucket configuration or policies were modified on Supabase. No commit or deployment was performed.

## Follow-up: decoder installed and live Storage verified

This section supersedes the dependency/configuration blockers in the original repair report below.

- The repository uses npm workspaces and the root `package-lock.json`. Existing nested app lockfiles were not removed or regenerated. Installation with `npm install --workspace=apps/api --offline=false --fetch-retries=0 --fetch-timeout=15000` succeeded against `https://registry.npmjs.org/`; TLS verification remained enabled. The root lockfile already had uncommitted changes at the start of this follow-up; those were preserved. Its API dependency entries match the manifest.
- `sharp` **0.35.5** loads in the API runtime, decodes actual JPEG data and produces the expected 512×512 JPEG output. `test:avatars:release` now passes **7 tests with no skips**.
- The local server credential is present and authorized against the configured project's existing bucket. It successfully inspected, uploaded, signed, retrieved and deleted synthetic objects. No credential or signed URL was printed. `SUPABASE_URL` and `DATABASE_URL` are present. No server credential was copied into frontend configuration.
- `.env` initially contained `AVATARS_ENABLED=true`. It was changed to **false** as requested while checking prerequisites; all other values were preserved. The file is ignored by Git. It remains false for the operator's controlled enablement below.
- API startup on temporary port 5099 succeeded with avatar/import/retention mutation flags disabled in that diagnostic process. Health returned HTTP 200; unauthenticated avatar access returned HTTP 401. The diagnostic server was stopped. The first attempt to spawn an API child process was blocked by local process permissions; direct terminal startup succeeded.
- The new explicit `test:avatars:storage` command used the real private `staff-avatars` bucket with two random, unlinked synthetic JPEG objects. Both images were processed, uploaded and retrieved byte-for-byte through signed URLs. Both were deleted; their previously valid signed URLs then returned missing-object HTTP statuses. Cleanup does not treat a network error, 401/403 or server error as proof of deletion. No profiles, Auth accounts, policies or buckets were changed by this check.
- All API/web regression suites passed: **68 tests, zero skipped** (including the previously skipped CSV/XLSX tests). API TypeScript, web lint, web TypeScript/production build and whitespace checks passed. Parser tests passing does not enable patient imports or establish their deployed integration readiness.

**The complete authenticated profile lifecycle remains unverified against Supabase.** The user authorized testing the currently signed-in account and restoring its avatar. However, the browser automation runtime failed to initialize with “The system cannot find the path specified (os error 3).” Its session could not be accessed. No session credentials were retrieved; the user's account/avatar was not modified. The actual Storage round-trip is verified, while API-mediated replacement, profile persistence and original-avatar restoration require the following signed-in portal check.

### Exact commands and controlled enablement

From the repository root, these checks are now available:

```powershell
npm install --workspace=apps/api --offline=false
npm run typecheck --workspace=apps/api
npm run test:avatars:release --workspace=apps/api
npm run test:avatars:storage --workspace=apps/api
```

The last command intentionally creates/removes only its two random synthetic Storage objects. It never modifies an account avatar. Its source is `apps/api/src/scripts/avatar-storage-smoke.ts`; it compiles with TypeScript before running, avoiding a local non-interactive `tsx` child-process permission problem.

Prerequisites now pass. Stop any existing development API, then enable uploads **only for a controlled API process**, leaving the saved `.env` flag false:

```powershell
$env:AVATARS_ENABLED = 'true'
try { npm start --workspace=apps/api }
finally { Remove-Item Env:AVATARS_ENABLED -ErrorAction SilentlyContinue }
```

In another terminal, if the web portal is not already running:

```powershell
npm run dev:web
```

Keep the existing project URL/credential private and unchanged; no new Supabase Dashboard resource or policy is required. After restarting the API, choose **Check again** in Settings → My Profile. A remaining setup issue should now identify the specific failure rather than referring generically to server storage.

### Signed-in account test and restoration

1. Before replacing anything, save a local copy of the current avatar. If no original photo exists, record that the expected final state is initials.
2. Upload a non-sensitive solid-color JPEG under 3 MiB. Confirm success and matching images in My Profile and the top-right navigation.
3. Reload the portal, then sign out/back in. Confirm the test image persists.
4. Replace it with a different non-sensitive JPEG. Confirm both UI locations update and that it persists after another reload.
5. Remove the test photo and reload. Confirm initials and no saved photo.
6. Restore the saved original photo, or leave initials if there was originally no photo. Reload and confirm both UI locations. Re-uploading the original restores its appearance; the server normalizes it again and generates a new object path, so this is not an exact object-path/byte rollback.
7. Stop the controlled API with Ctrl+C. Its shell enable flag is cleared by `finally`; the saved `.env` remains disabled. Only after this complete check succeeds should an operator deliberately set `AVATARS_ENABLED=true` in the normal API environment and restart it for continued use.

Do not send passwords, access tokens or service credentials in chat. Do not claim these profile-lifecycle steps passed until their outcomes are observed. No automatic deployment or commit occurred.

The remaining sections preserve the original repair findings and historical test counts.

## A–F: findings and implementation plan

**A. Existing functionality.** All five repository migrations and route queries were inspected. Read-only catalog queries against the configured Supabase PostgreSQL database confirmed the exact 12 public tables supplied by the user. The tables support profile identity and onboarding preferences, account-to-patient linkage, verification review, appointments, staff memberships, auditing, staged legacy imports, and avatar references/cleanup. Express validates Supabase JWTs and active staff membership; privileged operations do not use browser database writes. Mobile uses the account/preferences/verification/care endpoints. No mobile changes were made.

Foreign keys, constraints, indexes, table RLS flags, selected policies and client-role grants were inspected through catalogs, without reading patient rows. Existing indexes cover patient linkage/numbers/demographics, appointment patient/date, verification status/profile/date, audit creation, and import identifiers/expiry. `avatar_cleanup` has an object-path primary key. The actual `profiles_avatar_owner` constraint was evaluated using synthetic values in a read-only query: it accepts the generated own-UUID/random-UUID `.jpg` path and rejects another owner.

**B. Missing entities.** No avatar columns or tables are missing. The current live database and repository have no clinic configuration, inventory items/movements, medical document metadata, conversation/participant/message, in-app notification or notification-preference entities. `account_preferences.interests` is onboarding data, not notification preferences. The corresponding unavailable module states remain truthful; they were not changed in this avatar-only phase.

**C. Storage.** Reuse the existing private `staff-avatars` bucket. Verified through `storage.buckets`: `public=false`, `file_size_limit=3145728`, `allowed_mime_types=['image/jpeg']`. The server checks those properties through the Storage API before accepting mutations. Inputs and normalized output are JPEG-only, capped at 3 MiB. A separate clinical-document bucket/scanning design belongs to a later phase.

**D. SQL files.** No new migration is required or created. **Do not rerun `database/migrations/005_staff_avatars.sql`**: its resource-creation statements are historical, and the confirmed resources already exist. Migrations 001–005 are unchanged. The new file `database/checks/avatar-readiness.sql` contains read-only verification queries, not schema changes. Future module migration filenames are intentionally not allocated in this scoped repair.

**E. Dashboard/API configuration.** Keep the existing bucket private, JPEG-only, and limited to 3,145,728 bytes. Configure the API enable flag and server-only credential, install its decoder, and verify the existing schema grants as described below. Do not add public Storage access or frontend service credentials.

**F. Implementation order completed.** Inspect repository and live catalogs → repair diagnostics and upload constraints → fix transactional/cleanup connection usage → test HTTP lifecycle, validation and storage request contract → run regression/TypeScript/lint/build checks → publish manual setup instructions. A real upload against Supabase remains blocked by missing credentials/decoder.

## Exact cause of the setup message

The original frontend initialized `available=false` and rendered the same generic message while loading and for several distinct server failures. The API returned `{available:false,url:null}` when setup checks failed without identifying which prerequisite was missing.

The inspected local `apps/api/.env` has:

| Prerequisite | Observed state |
|---|---|
| `AVATARS_ENABLED=true` | Variable absent |
| `SUPABASE_SERVICE_ROLE_KEY` | Variable absent |
| `SUPABASE_URL` | Present; matching database/bucket metadata inspected |
| `DATABASE_URL` | Present; verified TLS read-only connection succeeded |
| `sharp` native decoder | Not installed |

Environment values were not printed or copied into documentation. These observations concern the local repository configuration, not an independently inspected deployed API process.

The configured HTTPS npm registry was retried using normal TLS and `--offline=false`. Installation failed while resolving existing CSV dependencies because the configured proxy refused `127.0.0.1:9`. No proxy/TLS bypass was attempted. The decoder remains unavailable; lockfiles were not regenerated.

## Repair details

- Authenticated avatar status responses now include safe issue codes for disabled uploads, missing server credentials/URL/decoder, inaccessible schema, incompatible/unreachable bucket, and unavailable saved photos. Settings displays a loading state first, compact expandable setup details, and Check again. Credential **names**, never values, are returned/displayed.
- Both picker and server enforce JPEG-only, nonempty files up to 3,145,728 bytes. The API checks magic bytes and requires real `sharp` decoding, limits input to 16 megapixels, rejects unsupported/multi-frame inputs, rotates orientation and produces a metadata-stripped 512×512 centered JPEG crop. The processed output is size-checked again. There is no header-only fallback.
- The existing `GET/PUT/DELETE /api/v1/staff/profile/avatar` routes remain under JWT and active staff guards. Mutations recheck eligibility with locked profile/staff rows; users cannot supply an alternate profile, role or object path. Unique object names prevent overwriting someone else's file. Per-user mutation rate limiting remains in place.
- Profile reference/audit writes commit atomically **after successful upload**. Removal clears the profile reference and queues deletion atomically; physical deletion follows commit. A failed delete remains queued for retry rather than undoing a successfully saved profile. Failed uploads/audits do not replace the previous reference.
- The original code acquired a second pool connection while holding transaction locks. It now records durable upload-cleanup intent on the same connection in autocommit mode before `BEGIN`, then uses that connection for all transactional work and immediate cleanup acknowledgement. This avoids pool exhaustion deadlocks. Lock and statement timeouts bound SQL waits.
- Cleanup retains its one-hour grace period, 50-object limit, own-path validation and exclusion of currently referenced paths. One failed deletion no longer prevents other objects in the batch from being processed. Failures are retained and logged without patient/object details. Ambiguous COMMIT responses preserve the new object for reconciliation; this crash/network behavior still requires real integration tests.
- Retrieval and removal can work with configured private storage even if the native decoder is missing or new uploads are disabled. Uploads stay gated. Missing/deleted/broken photos use initials; an unavailable saved image does not prevent a valid replacement.
- The existing shared Avatar remains in My Profile, the top-right navigation and the current staff directory row. Mutation events trigger status refreshes; signed URLs last five minutes and refresh every four minutes. Stale responses/unmounts cannot overwrite a newer avatar request. A fresh page/session reload reads the persisted database path. This persistence is covered with query doubles, not a live upload.

## RLS and Storage findings

Verified through read-only live catalogs:

- RLS is enabled on all 12 public tables and `storage.objects`.
- `profiles` has the authenticated own-profile SELECT policy from migration 002.
- No policies were returned for `avatar_cleanup` or `storage.objects`.
- No anon/authenticated table grants were returned for `avatar_cleanup` or the import tables. The server uses its privileged database connection and a separate server-only Storage credential.
- The configured API database role's catalog checks returned true for reading/updating `profiles.avatar_path`, reading/inserting/deleting cleanup entries, and inserting audits. No-row SELECT probes against avatar columns also succeeded. These checks do not execute or prove a write transaction under RLS.

**No missing direct-client Storage policy is required for this architecture.** The server signs, uploads and deletes; clients receive short-lived signed URLs. Adding broad authenticated/public policies would weaken the chosen boundary. The service role bypasses RLS, so Express identity/path authorization remains essential. This follows the [Supabase Storage access-control model](https://supabase.com/docs/guides/storage/security/access-control).

Catalog inspection also found broad anon/authenticated grants, including TRUNCATE/TRIGGER/REFERENCES, on seven original tables (profiles, patients, staff_members, patient_verifications, appointments, audit_logs, account_preferences). Row DML remains subject to RLS; RLS does not protect every table-level operation. This grant configuration merits a separate least-privilege review, including RPC exposure. No unrelated permission changes were made, and catalog inspection is not proof of every deployed client access path.

## Manual Supabase and API setup

1. **Do not recreate tables, columns or buckets.** In Dashboard → Storage → `staff-avatars`, confirm private, JPEG-only, 3,145,728-byte configuration. Inspect Storage policies; this server-mediated design requires no anon/authenticated object policies. Keep existing RLS enabled.
2. Run `database/checks/avatar-readiness.sql` for catalog verification. Check database-role permissions using the **actual API role**; the SQL editor's privileged role can mask missing API grants. The API needs SELECT/UPDATE of the relevant profile columns, active staff reads/locks, INSERT/SELECT/DELETE on `avatar_cleanup`, and audit INSERT. Do not grant these privileged writes to anon/authenticated browser roles.
3. From the same Supabase project, provision `SUPABASE_SERVICE_ROLE_KEY` in the API's secret environment. Never paste it into chat, a `VITE_` variable, a frontend source file or version control. `SUPABASE_URL` is already configured locally. Retain the existing verified-TLS `DATABASE_URL`/CA configuration.
4. Restore approved access to the configured npm registry, then run `npm install --workspace=apps/api --offline=false`. Review/regenerate the relevant lockfile; the previously declared missing parser dependencies also affect installation. Do not disable TLS verification.
5. Run `npm run test:avatars:release --workspace=apps/api`. Unlike the normal suite, this refuses to proceed without `sharp`. Run the checks below. In an isolated test project/account, verify actual JPEG decode/upload/sign/replace/remove/cleanup behavior before enabling production uploads.
6. Set `AVATARS_ENABLED=true` in the API environment only when prerequisites pass, then restart the API. The portal's `VITE_API_URL` must point to that API and its origin must remain in API `CORS_ORIGINS`. No new frontend Storage credential is needed. Use Check again in Settings.
7. With synthetic staff accounts, test a valid JPEG, empty/oversize/corrupt/spoofed/PNG/WebP files, another user's path/identity attempt, revoked membership, refresh/new-session persistence, replace/remove, expired/missing signed objects, concurrent requests, audit failure, storage timeout and cleanup retry. Verify that neither anon nor unrelated authenticated clients can read/write/delete bucket objects directly. Do not create real patient data for these tests.
8. The enabled API runs startup/15-minute cleanup. If the API sleeps, schedule `purgeAvatarObjects` through a trusted backend job. Keep upload candidates queued on uncertain failures until confirmed unreferenced; never bulk-delete the bucket.

## Tests and limits

| Check | Result |
|---|---|
| API avatar validation/configuration/HTTP lifecycle/storage contract/cleanup/bucket gate | 6 passed, 1 real-decoder test skipped |
| Web JPEG limits and setup feedback | 2 passed |
| API onboarding, portal schema, settings, portal/access HTTP, import suites | 10 + 7 + 4 + 4 + 21 passed; 3 parser tests skipped |
| Web settings/password/theme and portal/navigation suites | 4 + 6 passed |
| API TypeScript, web TypeScript/build, ESLint, `git diff --check` | Passed; final lint has no warnings |
| Avatar release gate | Blocked as intended: `sharp` is not installed |
| Supabase catalogs, constraints, bucket configuration | Read-only live verification succeeded |
| Full Supabase photo lifecycle / live RLS-denial requests / rendered browser upload | Not performed |

Automated total: **64 passed, 4 skipped**. HTTP lifecycle/storage tests use synthetic bytes and database/Storage doubles. They do not substitute for real image decoding or live object authorization. **The complete upload workflow has not been tested against Supabase and is not claimed operational.** The normal decoder test remains explicitly skipped; the release script blocks instead of silently accepting that skip.

## Files changed

- `apps/api/src/routes/profile-avatar.ts`
- `apps/api/src/routes/profile-avatar.test.ts`
- `apps/api/src/server.ts` (avatar cleanup reporting only)
- `apps/api/package.json` (release check only)
- `apps/api/.env.example` (existing-resource instructions only)
- `apps/web/src/components/profile-photo.tsx`
- `apps/web/src/hooks/use-avatar.ts`
- `apps/web/src/lib/avatar.ts` (new)
- `apps/web/tests/avatar.test.ts` (new)
- `apps/web/package.json`, `apps/web/tsconfig.settings-tests.json` (avatar tests)
- `database/checks/avatar-readiness.sql` (new, read-only)
- This report; the prior portal report links here for current avatar requirements.

Suggested commit: `fix(avatars): reuse existing Supabase storage and expose setup diagnostics`
