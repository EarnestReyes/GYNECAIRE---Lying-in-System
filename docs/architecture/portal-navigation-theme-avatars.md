# Portal navigation, themes and profile photos

Avatar requirements and current live-schema findings are superseded by [the existing-schema avatar repair](staff-avatar-existing-schema.md), including the JPEG-only 3 MiB limit. The remaining sections below describe the original delivery.

Source inspection and local checks: October 30, 2026. No deployed services or patient data were used. No migrations were applied and no commit was created. The existing untracked `BuildingScripts/` directory was left untouched.

## Findings and changes

### Import navigation

The inspected baseline already registered `patient-imports` in `App.tsx`, lazy-loaded the dedicated page inside `Shell`, and generated `#patients/import` from the Patients button. That canonical path resolved correctly in source. Consequently, the reported click-to-Dashboard behavior was **not reproduced**, and an exact deployed root cause cannot be asserted.

A demonstrated fallback defect was that `#patient-imports` (the internal page identifier), slash-prefixed hashes and trailing-slash import URLs were unrecognized and fell through to Dashboard. The parser now accepts these variants. `pageHash()` is the canonical serializer used by navigation and the Patients Import Records link. The page remains inside the existing hash-router architecture; there is no second router. Sidebar selection recognizes the nested import route as Patients.

Administrator access is checked using `canAccessPage()` in the renderer. Other staff see an explicit access-required state at that URL; the existing Express import router independently enforces active administrator access. Missing import configuration remains a capability/unavailable state inside the import page. The importer flags, encryption, scanner, parser and confirmation controls were not relaxed. Back to Patients generates `#patients`; native browser history still uses hash changes.

If the deployed canonical button still redirects, compare the served build/hash to this source and inspect hash-change/session events in the browser. This change does not establish which version was previously deployed. Tests cover serialization/parser/guard behavior, not a real browser click, refresh or history stack.

### Theme and Quick Actions

The confirmed styling cause was `.quick-actions button { background: white }` in `App.css`, together with unthemed patient picker and import step surfaces. Shared semantic tokens now cover application/sidebar/card/elevated/input/table backgrounds, text, muted text, borders, hover/selection, buttons, focus and statuses. Legacy flat control/surface colors were converted to variables; shared rules cover clinical views, tables, pickers, dialogs, status cards, search and dropdowns. Decorative branded gradients and explicit Light/Dark appearance thumbnails retain intentional colors.

Quick Actions now have muted nested surfaces, equal icon containers, consistent padding and row heights, aligned arrows, and visible keyboard focus. Their destination data is shared and tested: Patients, Appointments, completed consultation history (Checkups), and Reports. Entire rows are native keyboard-operable buttons. Existing light/dark/system persistence and OS/tab synchronization remain and their tests pass. An embedded BOM before the base `:root` rule was removed during the CSS audit.

All requested modules were inspected through their shared shell/control styles: Dashboard, Patients, Imports, Appointments, Records, Checkups, Inventory, Messages, Reports, Staff and Settings. This is source/static theme verification; viewport layout and contrast measurements have **not** been verified in a rendered browser.

### Profile photo architecture

Settings offers an avatar/Edit Photo file picker, preview, centered square crop, pending state, success/error messages, confirmed replacement/removal and initials fallback. JPEG/PNG/WebP input is capped at 2 MiB. A shared Avatar displays photographs in Settings, the top bar, and the current user's Staff directory row, with initials on image failure. Other staff photographs are not exposed through a new cross-user endpoint. Update events refresh mounted avatar consumers without reloading; signed URLs are refreshed every four minutes and reloaded from the API after page refresh.

`GET/PUT/DELETE /api/v1/staff/profile/avatar` is mounted behind the existing JWT and active staff middleware. The request cannot choose a profile ID, storage path, role or account type. Mutations recheck active staff eligibility under profile/staff row locks and use a per-user rate limit (20 changes per 15 minutes per API process).

The server validates magic bytes, decodes with `sharp`, limits input to 16 megapixels, rejects unsupported/multi-frame formats, rotates orientation, crops to 512×512 and re-encodes JPEG without source metadata. Header matching alone is not accepted as content validation. Decoder absence fails closed. No client-generated crop is trusted as validation.

Only a server-held Supabase service role can create/sign/delete private `staff-avatars` objects. New objects use `<authenticated UUID>/<random UUID>.jpg`; uploads use POST without overwrite/upsert. The database stores a path only. Readers receive five-minute signed URLs, never the service key. This follows the [Supabase Storage access model](https://supabase.com/docs/guides/storage/security/access-control); decoding follows [sharp's input metadata API](https://sharp.pixelplumbing.com/api-input/).

The profile reference and audit event commit together. Existing objects are deleted only after the replacement/removal commits. A private durable cleanup queue records superseded objects and new upload candidates before upload; its transaction removes successfully referenced candidates. This preserves retry information after failed uploads or process interruption. Failed cleanup leaves a queue record. The startup/15-minute worker retries up to 50 queued objects older than one hour, excluding currently referenced paths. If COMMIT's response is ambiguous, the new object is retained rather than risking deletion of a committed image. Refresh before retrying; crash and network fault behavior still needs real integration verification. If the API sleeps, schedule the exported cleanup function externally. Rate limiting is process-local; use a shared store at larger replica scale.

## Migration and release prerequisites

`database/migrations/005_staff_avatars.sql` is additive to 001–004: nullable `profiles.avatar_path` with an owner-prefix constraint, private RLS-enabled `avatar_cleanup` with client privileges revoked, and a private JPEG-only 2 MiB Storage bucket. It does not alter roles, patient linkage, existing profile fields or existing migrations. No direct authenticated profile UPDATE or Storage policy is added. The bucket insert deliberately fails if that bucket already exists: inspect its configuration/policies before reconciling it, rather than silently accepting a public bucket.

Before enabling photos:

1. Restore approved access to the configured npm registry and install dependencies over verified TLS. `sharp` is declared as `^0.35.5`, but installation failed at the existing proxy (`ECONNREFUSED 127.0.0.1:9` while resolving CSV dependencies). Lockfiles were not regenerated. Regenerate/review the appropriate lockfile after a successful install; `npm ci` is not release-ready with the current dependency mismatch.
2. Run the real decoder test (currently skipped) and real JPEG/PNG/WebP/animated/corrupt/large-image integration cases. Review the native decoder release and platform support.
3. Obtain approval to apply migration 005, then verify API-role column/table grants and constraints on a disposable environment. Migration compatibility was reviewed in source only.
4. Configure server-only `SUPABASE_SERVICE_ROLE_KEY`, the matching HTTPS `SUPABASE_URL`, and then `AVATARS_ENABLED=true`. Keep it false until checks pass. Audit **all** existing `storage.objects` policies for broad bucket access; no new client policies does not negate a pre-existing broad policy. Verify bucket privacy, no anonymous/direct-client read/write/delete, foreign-user access rejection and short URL expiry against the actual project.
5. Test upload, refresh persistence, replacement, removal, failed writes/audits/COMMIT responses, cleanup retries and concurrent updates using synthetic staff accounts. Verify that inactive users cannot mutate photos.
6. Inspect every module in light/dark/system modes at desktop/tablet/mobile widths, including import button, direct URL, refresh, Back and unauthorized access. Browser automation packages were unavailable locally; no rendered interaction test is claimed.

Photo controls remain unavailable by default. This is an implemented, gated feature, **not a verified operational deployment**. Legacy patient imports remain independently disabled until their existing security/dependency/integration gates pass.

## Verification

| Check | Result |
|---|---|
| API TypeScript | Passed |
| Web TypeScript / production build | Passed |
| Web ESLint | Passed after correcting preview lifecycle and embedded BOM |
| Web navigation, guard, wizard, Quick Actions and static theme checks | 6 passed |
| Web password/theme preference tests | 4 passed |
| API onboarding / portal schemas / settings | 10 / 7 / 4 passed |
| API portal HTTP / access controls | 4 passed |
| API importer validation, crypto, scanner and mocked transactions | 21 passed, 3 parser tests skipped (dependencies unavailable) |
| Avatar validation, mocked own-account HTTP lifecycle and private Storage request contract | 3 passed, 1 decoder test skipped (`sharp` unavailable) |
| Real PostgreSQL, Supabase Storage/RLS and real browser interactions | Not run |

Total: **59 passed, 4 skipped**. SQL/Storage tests use doubles or source review, not live authorization policies. No real patient data was tested.

## Changed files

API: `.env.example`, `package.json`, `src/routes/portal-router.ts`, `src/routes/portal-router.test.ts`, `src/routes/profile-avatar.ts` (new), `src/routes/profile-avatar.test.ts` (new), `src/server.ts` (all under `apps/api/`).

Web (under `apps/web/`): `src/App.css`, `src/App.tsx`, `src/index.css`, `src/design-tokens.css`, `src/portal-system.css`, `src/lib/navigation.ts`, `src/components/shell.tsx`, `src/components/avatar.tsx` (new), `src/components/profile-photo.tsx` (new), `src/hooks/use-avatar.ts` (new), `src/pages/dashboard.tsx`, `src/pages/patients.tsx`, `src/pages/patient-imports.css`, `src/pages/settings.tsx`, `src/pages/staff.tsx`, `tests/portal.test.ts`.

Database: `database/migrations/005_staff_avatars.sql` (new, unapplied). Documentation: this file. Mobile code, existing migrations, real environment secrets and deployed services were unchanged.

Suggested commit: `fix(portal): harden import navigation and themes and add gated profile photos`
