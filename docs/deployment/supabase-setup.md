# Supabase setup and migration reconciliation

## Evidence at documentation time

A read-only transaction on October 30, 2026 found the 13 application tables in [the dictionary](../../database/schema/data_dictionary.md), all with RLS enabled. `staff-avatars` is private, JPEG-only, limited to **3,145,728 bytes**. `clinic_settings` exists but no singleton row was observed. No `supabase_migrations.schema_migrations` ledger was found. No patient rows or secrets were exported and no SQL was applied.

This corroborates resource presence. It does not prove all migration files were applied verbatim, every policy/grant is safe, Auth email works, or CRUD/concurrency is correct. The [audit](../audits/GYNECAIRE_FULL_SYSTEM_AUDIT.md) records excessive original client grants, a BYPASSRLS backend role and further verification requirements.

## Dependency order for a genuinely new, isolated project

| Order | Existing file | Purpose |
|---|---|---|
| 001 | [initial schema](../../database/migrations/001_initial_schema.sql) | Profiles, patients, staff, verifications, appointments, audit logs, indexes/RLS |
| 002 | [authentication](../../database/migrations/002_authentication.sql) | Auth-triggered general profile creation and own-profile SELECT policy |
| 003 | [mobile onboarding](../../database/migrations/003_mobile_onboarding.sql) | Interests and verification intake/consent columns |
| 004 | [legacy imports](../../database/migrations/004_legacy_patient_imports.sql) | Jobs/rows/provenance/events, encryption references and duplicate lookup indexes |
| 005 | [staff avatars](../../database/migrations/005_staff_avatars.sql) | Avatar path/check, cleanup and original private bucket creation |
| 006 | [clinic settings](../../database/migrations/006_clinic_settings.sql) | Single-clinic configuration, revision/actor and direct-client denial |

Supabase-managed `auth.users`, Storage schemas and platform roles are prerequisites, not resources to fabricate from these files. Review each SQL file and apply manually after approval. These scripts are not general-purpose idempotent replay scripts.

## Existing project: do not replay the list

1. Confirm the intended project and take/review a suitable recovery point.
2. Inspect columns, constraints, policies, grants, indexes and existing bucket settings. [Avatar readiness checks](../../database/checks/avatar-readiness.sql) are read-only, not a repair script.
3. Reconcile the operator's migration/change history. The currently observed resources already include 001-006's application entities; an absent ledger is not permission to recreate them.
4. Record known drift: migration 005 creates a 2 MiB bucket, while the current API and actual bucket use 3 MiB. Do not edit historical migrations or recreate the bucket to hide this difference. Any correction for fresh installs requires a separately reviewed additive change.
5. Verify the actual API SQL role and direct-client privileges. Do not grant anon/authenticated unrestricted writes or disable RLS to make Express work. Source SQL and platform default grants can differ.
6. Complete first clinic setup through the authorized admin form with real approved clinic facts; no fictional clinic seed is provided. Fix/verify the custom-service/appointment enum mismatch before claiming arbitrary configured services can be scheduled.

## Authentication

Provision public client keys only to clients. Configure approved site URLs and confirmation/recovery redirect URIs for the web and Expo scheme. Verify confirmation mail/SMTP, expiry, account enumeration behavior, secure password changes and any required MFA assurance with synthetic accounts. No Auth settings or accounts were changed by this task.

The signup trigger must create **general** profiles regardless of requested user metadata. Clinic intent changes onboarding, not authorization. Existing staff memberships/first-admin provisioning require an authorized operator procedure; the mobile registration flow and seed SQL do not create staff accounts or manipulate `auth.users`.

## Storage and privileged jobs

Reuse `staff-avatars`: private, JPEG-only, 3 MiB. The server signs short-lived URLs and validates ownership/active staff; clients do not need broad Storage object policies. Verify existing policies for unintended broad access. `avatar_cleanup` retries obsolete/orphan candidates; schedule trusted cleanup if the API sleeps or uploads are disabled. Import staging uses encrypted database bytes, not a public upload bucket. Real documents need a separately approved private/scanned design; that module is not implemented.

No migrations, seeds, buckets, policies or deployed services were created/modified during documentation.
