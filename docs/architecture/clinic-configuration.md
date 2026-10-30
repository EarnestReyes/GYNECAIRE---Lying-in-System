# Phase 2: clinic configuration

Implementation date: October 30, 2026. This phase changes clinic configuration only; it does not begin Inventory, Medical Records, Messages or Notifications. Existing avatar work and other uncommitted changes were preserved. No SQL migration, deployment or commit was performed.

## Architecture and schema

Repository inspection found no clinic configuration table or endpoints in migrations 001–005. A read-only check of the configured Supabase database returned `to_regclass('public.clinic_settings') = NULL`. The existing 12 tables and all their data remain untouched.

The exact SQL to apply is the complete file **[`database/migrations/006_clinic_settings.sql`](../../database/migrations/006_clinic_settings.sql)**. Do not rerun earlier migrations. This additive migration creates only `public.clinic_settings`, its singleton primary key/constraints, and its access policy/grants. It does not insert fictional clinic facts.

The model is a single row (`id=1`) containing clinic name, description, contact number, email, address, IANA timezone (default Asia/Manila), seven-day hours, services, booking/cancellation guidance, an explicit patient-sharing flag, update timestamp, version and an updated-by profile foreign key. The primary key is the lookup index; no additional index benefits a one-row table. `updated_by` records the authenticated administrator and is cleared if that profile is legitimately deleted; historical role changes do not rewrite the configuration.

Database checks bound text/JSON/array sizes and policy values; the strict API schema additionally validates exact object fields, all seven days, phone digits, email, IANA timezone, clock syntax, open-before-close, closed-day null times and unique service names. Overnight or split shifts are not supported. Empty services are allowed. Blank UI defaults are proposals only, not saved or published facts.

RLS is enabled. PUBLIC/anon/authenticated privileges are revoked and an explicit deny policy prevents direct client access. The backend-only service role receives SELECT/INSERT/UPDATE; Express remains the authorization boundary for the privileged connection. If the API uses a custom database role rather than an owner/BYPASSRLS backend role, a DBA must provision that role's table privileges and an appropriate backend-only RLS policy. Never solve an API-role error by granting browser roles write access or disabling RLS.

## Endpoints and security

| Endpoint | Permission | Behavior |
|---|---|---|
| `GET /api/v1/staff/clinic-settings` | Existing JWT + active staff guard | Full staff configuration, or `settings:null` before initial setup |
| `PUT /api/v1/staff/clinic-settings` | Active administrator | Strict full configuration + `expected_version`; saves and audits atomically |
| `GET /api/v1/account/clinic` | Existing authenticated account guard | Published patient-safe projection, or `settings:null` when not shared/unconfigured |

Anonymous access is not added. The patient endpoint excludes administrator identity, version/update metadata, patient-sharing internals and internal slot/minimum-notice fields. Sharing defaults off and requires an administrator's explicit save. General users and clinic patients may both read the shared projection after sign-in.

Updates reject unknown properties, including caller-supplied roles, actor IDs and database identifiers. SQL is parameterized. A transaction advisory lock serializes first creation as well as edits; the active administrator's database membership is rechecked and locked inside the transaction. `expected_version=0` means first creation; stale edits receive HTTP 409 instead of overwriting another administrator. An audit insert (`clinic.settings_updated`, actor profile, singleton entity type) shares the transaction; failure rolls back the configuration. The existing UUID audit entity column stays NULL for this numeric singleton rather than inventing an entity UUID or altering audit schema.

Invalid fields return HTTP 400 with field paths/messages. Missing migration/permissions/database failures return sanitized HTTP 503. Staff GET remains allowed when administrative editing is unavailable. Existing Supabase JWT verification, account routing, patient ownership/linkage and staff authorization are unchanged.

## UI and integration

Settings → Clinic Configuration now offers General Information, Location, Operating Hours, Services, Appointment Policies and Patient-facing Information sections. It uses existing semantic theme tokens and form/modal controls. Administrators can set up/edit, add/remove service names, change closed days/times, save or cancel; staff see the saved form read-only. Loading, no configuration, missing-schema, validation, success, dirty and busy states are explicit. Canceling dirty changes requires confirmation. Dirty/busy edits disable other Settings sections; refresh/tab-close has an unsaved-change warning. Main sidebar navigation is not a complete route-blocking workflow, so save/cancel before leaving Settings through the main navigation.

Dashboard displays the saved clinic name/timezone when available. Appointment creation offers saved services as suggestions without fabricating a default clinic service. Staff may enter an agreed service manually, preserving existing workflows. Appointment details display the saved booking guidance; existing records and final-status protections are unchanged.

**Policies are persisted staff guidance, not a new scheduling engine.** Acceptance status, minimum notice, suggested duration and cancellation rules do not automatically reject existing/future staff-entered appointments, compute capacity or expose online booking. Appointment entry/filtering continues to use Manila time, even if a different informational clinic timezone is saved. This boundary is stated in the UI; timezone changes never shift existing appointment timestamps.

The mobile clinic card uses the authenticated patient-safe endpoint when signed in. It displays shared clinic name, description, phone/address/email, timezone/hours, services and booking/cancellation guidance. Unpublished data and network failure have explicit states. Guest behavior retains the existing explicitly configured public environment details; no new anonymous configuration endpoint was created. The card reloads configuration when mounted/account identity changes; restart/reopen the clinic view/app to refresh already-mounted data after an administrative change. Expo SDK 58 documentation was checked before touching the existing mobile component; no Expo packages/APIs were added or upgraded.

## Manual Supabase setup

1. Back up/review the project as usual. In Supabase SQL Editor, paste and execute **all of `006_clinic_settings.sql`**, from `BEGIN` through `COMMIT`, once. This is the only migration for this phase; it has not been applied by the agent.
2. Verify `public.clinic_settings` exists, has RLS enabled and has no direct-client privileges. It should initially contain zero rows. Do not seed example clinic contact details.
3. Confirm the actual API database role can SELECT/INSERT/UPDATE the new table, lock the required profile/staff rows and insert audit entries. SQL Editor privileges can differ from the API role; inspect the API role specifically.
4. Keep existing `DATABASE_URL`, certificate verification, `SUPABASE_URL`, `CORS_ORIGINS`, web `VITE_API_URL` and mobile `EXPO_PUBLIC_API_URL`. **No new environment variable, secret, Storage bucket or Storage policy is required.** Existing avatar/import flags remain independent.
5. Restart the API/web development processes as needed:

```powershell
npm run dev:api
```

In another terminal:

```powershell
npm run dev:web
```

6. Sign in as an existing active administrator. In Settings → Clinic Configuration, choose Set up clinic and enter actual approved details. Review closed days, services, guidance and sharing carefully, then Save changes.
7. Reload and reopen Settings to verify persistence, revision and timestamp. Confirm the audit log has the current actor and `clinic.settings_updated` action. No live write test was performed in this phase because the migration is unapplied.

Optional read-only verification after manual application:

```sql
SELECT id, clinic_name, version, updated_at, updated_by
FROM public.clinic_settings;

SELECT relrowsecurity FROM pg_class
WHERE oid='public.clinic_settings'::regclass;

SELECT policyname, roles, cmd, qual, with_check FROM pg_policies
WHERE schemaname='public' AND tablename='clinic_settings';

SELECT action, actor_profile_id, created_at FROM public.audit_logs
WHERE action='clinic.settings_updated' ORDER BY created_at DESC LIMIT 10;
```

## Browser/mobile acceptance checks

- As admin, edit real details; confirm Save, Cancel/discard confirmation, dirty indicator, field errors, success and refresh persistence. Closed days must have no times; opening must precede closing.
- Open two admin sessions, edit the same revision and save one. The other must receive a conflict and must cancel/reload before retrying. Failed audit/database operations must not report success.
- As nurse/midwife/receptionist, confirm read-only display and rejected direct PUT attempts. An inactive member must be denied staff endpoints. Unauthenticated staff/account clinic endpoints must return 401.
- Keep sharing off: signed-in patient/general-user clinic requests must return null. Enable it with approved data: mobile should show only the intended projection. Check response payloads do not contain `updated_by`, version or internal scheduling fields. Guest data must remain unchanged.
- Check Dashboard and new appointment service suggestions. Confirm no existing appointment was modified. Confirm policy guidance is not presented as enforced availability.
- Check light, dark and system modes at narrow/wide widths, including hours rows, service controls, busy/error states and keyboard focus.

## Verification results and limits

New tests: **3 API tests and 2 web tests passed**. These cover strict validation/mass assignment, invalid hours/timezone/services/policies, patient publication/projection, unauthenticated/non-admin/inactive rejection, initial configuration, simulated persistence, optimistic conflict, audit atomicity, database failure sanitization and editor defaults/preflight checks.

Full regression total for this phase: **81 passed, zero skipped** (59 API, 14 web, 8 mobile). `git diff --check` also passed.

The persistence/rollback HTTP tests use database query doubles; they are **not PostgreSQL integration tests**. The migration was reviewed in source but not executed or tested against a disposable PostgreSQL schema. The live read-only absence probe succeeded. No deployed clinic behavior, actual save/RLS-denial transaction or rendered browser/mobile layout is claimed verified.

API TypeScript, web TypeScript/production build and web ESLint passed. Mobile TypeScript and its existing 8 UI/domain tests passed. Official `expo lint` was attempted but found no ESLint configuration and failed to obtain setup dependencies through the configured proxy (`ECONNREFUSED 127.0.0.1:9`); no mobile package/config changes resulted. Supplemental lint of the changed mobile component passed using the existing web TypeScript/React ESLint configuration from the repository root:

```powershell
& 'apps/web/node_modules/.bin/eslint.cmd' --config apps/web/eslint.config.js apps/mobile/src/components/clinic-info.tsx
```

Focused commands:

```powershell
npm run typecheck --workspace=apps/api
npm run test:clinic --workspace=apps/api
npm run test:clinic --workspace=apps/web
npm run lint --workspace=apps/web
npm run build --workspace=apps/web
npm exec --workspace=apps/mobile -- tsc --noEmit
npm run test:ui --workspace=apps/mobile
```

## Files created or modified for this phase

New:

- `database/migrations/006_clinic_settings.sql`
- `apps/api/src/validation/clinic-settings.ts`
- `apps/api/src/routes/clinic-settings.ts`
- `apps/api/src/routes/clinic-settings.test.ts`
- `apps/web/src/lib/clinic-settings.ts`
- `apps/web/src/pages/clinic-settings.tsx`
- `apps/web/src/pages/clinic-settings.css`
- `apps/web/tests/clinic-settings.test.ts`
- This report.

Modified:

- `apps/api/src/routes/portal-router.ts`, `portal-router.test.ts`, `account.ts`
- `apps/api/package.json` (clinic test script)
- `apps/web/src/pages/settings.tsx`, `dashboard.tsx`, `appointments.tsx`
- `apps/web/package.json`, `apps/web/tsconfig.settings-tests.json` (clinic tests)
- `apps/mobile/src/components/clinic-info.tsx`

Prior avatar/lockfile changes remain separate existing work; migrations 001–005 and existing database data were not changed. Suggested commit: `feat(settings): add audited single-clinic configuration`
