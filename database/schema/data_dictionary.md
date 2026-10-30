# GYNECAIRE data dictionary

Source: migrations 001-006, inspected 2026-10-30. This is a repository definition reference, not a live schema export. A read-only catalog check confirmed all 13 table names and RLS flags; full live column/constraint parity was not established in this pass. Managed auth/storage columns are not reconstructed. Nullable unless NOT NULL or PRIMARY KEY is stated. Unspecified defaults are PostgreSQL NULL.

## profiles

Source: [001_initial_schema.sql](../migrations/001_initial_schema.sql#L8).

| Column | Type, default and inline constraints | Source |
|---|---|---|
| id | `id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE` | [001_initial_schema.sql](../migrations/001_initial_schema.sql) |
| full_name | `full_name TEXT NOT NULL` | [001_initial_schema.sql](../migrations/001_initial_schema.sql) |
| phone_number | `phone_number TEXT` | [001_initial_schema.sql](../migrations/001_initial_schema.sql) |
| account_type | `account_type TEXT NOT NULL DEFAULT 'general' CHECK (account_type IN ('general', 'patient', 'staff', 'admin'))` | [001_initial_schema.sql](../migrations/001_initial_schema.sql) |
| created_at | `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()` | [001_initial_schema.sql](../migrations/001_initial_schema.sql) |
| updated_at | `updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()` | [001_initial_schema.sql](../migrations/001_initial_schema.sql) |
| avatar_path | `avatar_path TEXT (nullable; profiles_avatar_owner constrains path to own UUID/random UUID.jpg)` | [005_staff_avatars.sql](../migrations/005_staff_avatars.sql) |

Table constraints: Inline constraints above.

## patients

Source: [001_initial_schema.sql](../migrations/001_initial_schema.sql#L19).

| Column | Type, default and inline constraints | Source |
|---|---|---|
| id | `id UUID PRIMARY KEY DEFAULT gen_random_uuid()` | [001_initial_schema.sql](../migrations/001_initial_schema.sql) |
| patient_number | `patient_number TEXT UNIQUE NOT NULL` | [001_initial_schema.sql](../migrations/001_initial_schema.sql) |
| profile_id | `profile_id UUID UNIQUE REFERENCES public.profiles(id) ON DELETE SET NULL` | [001_initial_schema.sql](../migrations/001_initial_schema.sql) |
| full_name | `full_name TEXT NOT NULL` | [001_initial_schema.sql](../migrations/001_initial_schema.sql) |
| date_of_birth | `date_of_birth DATE` | [001_initial_schema.sql](../migrations/001_initial_schema.sql) |
| contact_number | `contact_number TEXT` | [001_initial_schema.sql](../migrations/001_initial_schema.sql) |
| created_at | `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()` | [001_initial_schema.sql](../migrations/001_initial_schema.sql) |

Table constraints: Inline constraints above.

## staff_members

Source: [001_initial_schema.sql](../migrations/001_initial_schema.sql#L31).

| Column | Type, default and inline constraints | Source |
|---|---|---|
| id | `id UUID PRIMARY KEY DEFAULT gen_random_uuid()` | [001_initial_schema.sql](../migrations/001_initial_schema.sql) |
| profile_id | `profile_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT` | [001_initial_schema.sql](../migrations/001_initial_schema.sql) |
| staff_role | `staff_role TEXT NOT NULL CHECK (staff_role IN ('admin', 'midwife', 'nurse', 'receptionist'))` | [001_initial_schema.sql](../migrations/001_initial_schema.sql) |
| is_active | `is_active BOOLEAN NOT NULL DEFAULT TRUE` | [001_initial_schema.sql](../migrations/001_initial_schema.sql) |
| created_at | `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()` | [001_initial_schema.sql](../migrations/001_initial_schema.sql) |

Table constraints: Inline constraints above.

## patient_verifications

Source: [001_initial_schema.sql](../migrations/001_initial_schema.sql#L42).

| Column | Type, default and inline constraints | Source |
|---|---|---|
| id | `id UUID PRIMARY KEY DEFAULT gen_random_uuid()` | [001_initial_schema.sql](../migrations/001_initial_schema.sql) |
| profile_id | `profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT` | [001_initial_schema.sql](../migrations/001_initial_schema.sql) |
| patient_id | `patient_id UUID REFERENCES public.patients(id) ON DELETE RESTRICT` | [001_initial_schema.sql](../migrations/001_initial_schema.sql) |
| status | `status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected'))` | [001_initial_schema.sql](../migrations/001_initial_schema.sql) |
| reviewed_by | `reviewed_by UUID REFERENCES public.staff_members(id)` | [001_initial_schema.sql](../migrations/001_initial_schema.sql) |
| reviewed_at | `reviewed_at TIMESTAMPTZ` | [001_initial_schema.sql](../migrations/001_initial_schema.sql) |
| created_at | `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()` | [001_initial_schema.sql](../migrations/001_initial_schema.sql) |
| patient_kind | `patient_kind TEXT CHECK (patient_kind IN ('new', 'existing'))` | [003_mobile_onboarding.sql](../migrations/003_mobile_onboarding.sql) |
| date_of_birth | `date_of_birth DATE` | [003_mobile_onboarding.sql](../migrations/003_mobile_onboarding.sql) |
| contact_number | `contact_number TEXT CHECK (length(contact_number) <= 25)` | [003_mobile_onboarding.sql](../migrations/003_mobile_onboarding.sql) |
| consent_at | `consent_at TIMESTAMPTZ` | [003_mobile_onboarding.sql](../migrations/003_mobile_onboarding.sql) |

Table constraints: Inline constraints above.

## appointments

Source: [001_initial_schema.sql](../migrations/001_initial_schema.sql#L56).

| Column | Type, default and inline constraints | Source |
|---|---|---|
| id | `id UUID PRIMARY KEY DEFAULT gen_random_uuid()` | [001_initial_schema.sql](../migrations/001_initial_schema.sql) |
| patient_id | `patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE RESTRICT` | [001_initial_schema.sql](../migrations/001_initial_schema.sql) |
| appointment_date | `appointment_date TIMESTAMPTZ NOT NULL` | [001_initial_schema.sql](../migrations/001_initial_schema.sql) |
| appointment_type | `appointment_type TEXT NOT NULL` | [001_initial_schema.sql](../migrations/001_initial_schema.sql) |
| status | `status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ( 'pending', 'confirmed', 'completed', 'cancelled' ))` | [001_initial_schema.sql](../migrations/001_initial_schema.sql) |
| notes | `notes TEXT` | [001_initial_schema.sql](../migrations/001_initial_schema.sql) |
| created_at | `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()` | [001_initial_schema.sql](../migrations/001_initial_schema.sql) |

Table constraints: Inline constraints above.

## audit_logs

Source: [001_initial_schema.sql](../migrations/001_initial_schema.sql#L71).

| Column | Type, default and inline constraints | Source |
|---|---|---|
| id | `id UUID PRIMARY KEY DEFAULT gen_random_uuid()` | [001_initial_schema.sql](../migrations/001_initial_schema.sql) |
| actor_profile_id | `actor_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL` | [001_initial_schema.sql](../migrations/001_initial_schema.sql) |
| action | `action TEXT NOT NULL` | [001_initial_schema.sql](../migrations/001_initial_schema.sql) |
| entity_type | `entity_type TEXT NOT NULL` | [001_initial_schema.sql](../migrations/001_initial_schema.sql) |
| entity_id | `entity_id UUID` | [001_initial_schema.sql](../migrations/001_initial_schema.sql) |
| created_at | `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()` | [001_initial_schema.sql](../migrations/001_initial_schema.sql) |

Table constraints: Inline constraints above.

## account_preferences

Source: [003_mobile_onboarding.sql](../migrations/003_mobile_onboarding.sql#L3).

| Column | Type, default and inline constraints | Source |
|---|---|---|
| profile_id | `profile_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE` | [003_mobile_onboarding.sql](../migrations/003_mobile_onboarding.sql) |
| interests | `interests TEXT[] NOT NULL DEFAULT '{}'` | [003_mobile_onboarding.sql](../migrations/003_mobile_onboarding.sql) |
| updated_at | `updated_at TIMESTAMPTZ NOT NULL DEFAULT now()` | [003_mobile_onboarding.sql](../migrations/003_mobile_onboarding.sql) |

Table constraints: `CHECK (cardinality(interests) <= 8)`

## patient_import_jobs

Source: [004_legacy_patient_imports.sql](../migrations/004_legacy_patient_imports.sql#L3).

| Column | Type, default and inline constraints | Source |
|---|---|---|
| id | `id uuid PRIMARY KEY DEFAULT gen_random_uuid()` | [004_legacy_patient_imports.sql](../migrations/004_legacy_patient_imports.sql) |
| uploader_id | `uploader_id uuid NOT NULL REFERENCES public.profiles(id)` | [004_legacy_patient_imports.sql](../migrations/004_legacy_patient_imports.sql) |
| idempotency_key | `idempotency_key uuid NOT NULL` | [004_legacy_patient_imports.sql](../migrations/004_legacy_patient_imports.sql) |
| filename | `filename text NOT NULL CHECK (length(filename) BETWEEN 1 AND 120)` | [004_legacy_patient_imports.sql](../migrations/004_legacy_patient_imports.sql) |
| source_system | `source_system text NOT NULL CHECK (length(source_system) BETWEEN 1 AND 60)` | [004_legacy_patient_imports.sql](../migrations/004_legacy_patient_imports.sql) |
| status | `status text NOT NULL DEFAULT 'created' CHECK (status IN ('created','staged','validated','completed','expired'))` | [004_legacy_patient_imports.sql](../migrations/004_legacy_patient_imports.sql) |
| file_hash | `file_hash text` | [004_legacy_patient_imports.sql](../migrations/004_legacy_patient_imports.sql) |
| source_cipher | `source_cipher bytea` | [004_legacy_patient_imports.sql](../migrations/004_legacy_patient_imports.sql) |
| headers | `headers jsonb` | [004_legacy_patient_imports.sql](../migrations/004_legacy_patient_imports.sql) |
| mapping | `mapping jsonb` | [004_legacy_patient_imports.sql](../migrations/004_legacy_patient_imports.sql) |
| date_order | `date_order text CHECK (date_order IN ('DMY','MDY','ISO'))` | [004_legacy_patient_imports.sql](../migrations/004_legacy_patient_imports.sql) |
| revision | `revision integer NOT NULL DEFAULT 0` | [004_legacy_patient_imports.sql](../migrations/004_legacy_patient_imports.sql) |
| row_count | `row_count integer NOT NULL DEFAULT 0 CHECK (row_count BETWEEN 0 AND 10000)` | [004_legacy_patient_imports.sql](../migrations/004_legacy_patient_imports.sql) |
| imported_count | `imported_count integer NOT NULL DEFAULT 0` | [004_legacy_patient_imports.sql](../migrations/004_legacy_patient_imports.sql) |
| skipped_count | `skipped_count integer NOT NULL DEFAULT 0` | [004_legacy_patient_imports.sql](../migrations/004_legacy_patient_imports.sql) |
| created_at | `created_at timestamptz NOT NULL DEFAULT now()` | [004_legacy_patient_imports.sql](../migrations/004_legacy_patient_imports.sql) |
| expires_at | `expires_at timestamptz NOT NULL DEFAULT now() + interval '24 hours'` | [004_legacy_patient_imports.sql](../migrations/004_legacy_patient_imports.sql) |
| completed_at | `completed_at timestamptz` | [004_legacy_patient_imports.sql](../migrations/004_legacy_patient_imports.sql) |

Table constraints: `UNIQUE(uploader_id,idempotency_key)`

## patient_import_rows

Source: [004_legacy_patient_imports.sql](../migrations/004_legacy_patient_imports.sql#L24).

| Column | Type, default and inline constraints | Source |
|---|---|---|
| job_id | `job_id uuid NOT NULL REFERENCES public.patient_import_jobs(id) ON DELETE CASCADE` | [004_legacy_patient_imports.sql](../migrations/004_legacy_patient_imports.sql) |
| row_number | `row_number integer NOT NULL CHECK (row_number BETWEEN 2 AND 10001)` | [004_legacy_patient_imports.sql](../migrations/004_legacy_patient_imports.sql) |
| data_cipher | `data_cipher bytea` | [004_legacy_patient_imports.sql](../migrations/004_legacy_patient_imports.sql) |
| issues | `issues text[] NOT NULL DEFAULT '{}'` | [004_legacy_patient_imports.sql](../migrations/004_legacy_patient_imports.sql) |
| warnings | `warnings text[] NOT NULL DEFAULT '{}'` | [004_legacy_patient_imports.sql](../migrations/004_legacy_patient_imports.sql) |
| matches | `matches uuid[] NOT NULL DEFAULT '{}'` | [004_legacy_patient_imports.sql](../migrations/004_legacy_patient_imports.sql) |
| decision | `decision text NOT NULL DEFAULT 'review' CHECK (decision IN ('review','create','skip'))` | [004_legacy_patient_imports.sql](../migrations/004_legacy_patient_imports.sql) |
| patient_id | `patient_id uuid REFERENCES public.patients(id)` | [004_legacy_patient_imports.sql](../migrations/004_legacy_patient_imports.sql) |

Table constraints: `PRIMARY KEY(job_id,row_number)`

## patient_import_provenance

Source: [004_legacy_patient_imports.sql](../migrations/004_legacy_patient_imports.sql#L35).

| Column | Type, default and inline constraints | Source |
|---|---|---|
| id | `id uuid PRIMARY KEY DEFAULT gen_random_uuid()` | [004_legacy_patient_imports.sql](../migrations/004_legacy_patient_imports.sql) |
| job_id | `job_id uuid NOT NULL REFERENCES public.patient_import_jobs(id)` | [004_legacy_patient_imports.sql](../migrations/004_legacy_patient_imports.sql) |
| row_number | `row_number integer NOT NULL` | [004_legacy_patient_imports.sql](../migrations/004_legacy_patient_imports.sql) |
| patient_id | `patient_id uuid NOT NULL REFERENCES public.patients(id)` | [004_legacy_patient_imports.sql](../migrations/004_legacy_patient_imports.sql) |
| source_system | `source_system text NOT NULL` | [004_legacy_patient_imports.sql](../migrations/004_legacy_patient_imports.sql) |
| source_identifier_hash | `source_identifier_hash text NOT NULL` | [004_legacy_patient_imports.sql](../migrations/004_legacy_patient_imports.sql) |
| source_identifier_cipher | `source_identifier_cipher bytea NOT NULL` | [004_legacy_patient_imports.sql](../migrations/004_legacy_patient_imports.sql) |
| source_file_hash | `source_file_hash text NOT NULL` | [004_legacy_patient_imports.sql](../migrations/004_legacy_patient_imports.sql) |
| imported_by | `imported_by uuid NOT NULL REFERENCES public.profiles(id)` | [004_legacy_patient_imports.sql](../migrations/004_legacy_patient_imports.sql) |
| imported_at | `imported_at timestamptz NOT NULL DEFAULT now()` | [004_legacy_patient_imports.sql](../migrations/004_legacy_patient_imports.sql) |

Table constraints: `UNIQUE(source_system,source_identifier_hash)`; `UNIQUE(job_id,row_number)`; `FOREIGN KEY(job_id,row_number) REFERENCES public.patient_import_rows(job_id,row_number)`

## patient_import_events

Source: [004_legacy_patient_imports.sql](../migrations/004_legacy_patient_imports.sql#L50).

| Column | Type, default and inline constraints | Source |
|---|---|---|
| id | `id uuid PRIMARY KEY DEFAULT gen_random_uuid()` | [004_legacy_patient_imports.sql](../migrations/004_legacy_patient_imports.sql) |
| job_id | `job_id uuid NOT NULL REFERENCES public.patient_import_jobs(id)` | [004_legacy_patient_imports.sql](../migrations/004_legacy_patient_imports.sql) |
| actor_id | `actor_id uuid NOT NULL REFERENCES public.profiles(id)` | [004_legacy_patient_imports.sql](../migrations/004_legacy_patient_imports.sql) |
| action | `action text NOT NULL` | [004_legacy_patient_imports.sql](../migrations/004_legacy_patient_imports.sql) |
| details | `details jsonb NOT NULL DEFAULT '{}'` | [004_legacy_patient_imports.sql](../migrations/004_legacy_patient_imports.sql) |
| created_at | `created_at timestamptz NOT NULL DEFAULT now()` | [004_legacy_patient_imports.sql](../migrations/004_legacy_patient_imports.sql) |

Table constraints: Inline constraints above.

## avatar_cleanup

Source: [005_staff_avatars.sql](../migrations/005_staff_avatars.sql#L7).

| Column | Type, default and inline constraints | Source |
|---|---|---|
| object_path | `object_path TEXT PRIMARY KEY` | [005_staff_avatars.sql](../migrations/005_staff_avatars.sql) |
| created_at | `created_at TIMESTAMPTZ NOT NULL DEFAULT now()` | [005_staff_avatars.sql](../migrations/005_staff_avatars.sql) |

Table constraints: Inline constraints above.

## clinic_settings

Source: [006_clinic_settings.sql](../migrations/006_clinic_settings.sql#L4).

| Column | Type, default and inline constraints | Source |
|---|---|---|
| id | `id smallint PRIMARY KEY CHECK (id=1)` | [006_clinic_settings.sql](../migrations/006_clinic_settings.sql) |
| clinic_name | `clinic_name text NOT NULL CHECK (length(trim(clinic_name)) BETWEEN 2 AND 150)` | [006_clinic_settings.sql](../migrations/006_clinic_settings.sql) |
| description | `description text CHECK (length(description)<=2000)` | [006_clinic_settings.sql](../migrations/006_clinic_settings.sql) |
| contact_number | `contact_number text CHECK (contact_number ~ '^\+?[0-9 ()-]{7,25}$')` | [006_clinic_settings.sql](../migrations/006_clinic_settings.sql) |
| email | `email text CHECK (length(email)<=254 AND email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$')` | [006_clinic_settings.sql](../migrations/006_clinic_settings.sql) |
| address | `address text CHECK (length(address)<=1000)` | [006_clinic_settings.sql](../migrations/006_clinic_settings.sql) |
| timezone | `timezone text NOT NULL DEFAULT 'Asia/Manila' CHECK (length(timezone) BETWEEN 1 AND 100)` | [006_clinic_settings.sql](../migrations/006_clinic_settings.sql) |
| operating_hours | `operating_hours jsonb NOT NULL CHECK ( jsonb_typeof(operating_hours)='object' AND octet_length(operating_hours::text)<=8192 AND operating_hours ?& ARRAY['monday','tuesday','wednesday','thursday','friday','saturday','sunday'])` | [006_clinic_settings.sql](../migrations/006_clinic_settings.sql) |
| services | `services text[] NOT NULL CHECK (cardinality(services)<=30 AND array_position(services,NULL) IS NULL AND length(array_to_string(services,''))<=3000)` | [006_clinic_settings.sql](../migrations/006_clinic_settings.sql) |
| appointment_policies | `appointment_policies jsonb NOT NULL CHECK ( jsonb_typeof(appointment_policies)='object' AND octet_length(appointment_policies::text)<=4096 AND appointment_policies ?& ARRAY['booking_enabled','minimum_notice_hours','slot_minutes','cancellation_notice_hours','cancellation_rules'] AND jsonb_typeof(appointment_policies->'booking_enabled')='boolean' AND (appointment_policies->>'minimum_notice_hours')::integer BETWEEN 0 AND 8760 AND (appointment_policies->>'slot_minutes')::integer BETWEEN 5 AND 240 AND (appointment_policies->>'cancellation_notice_hours')::integer BETWEEN 0 AND 8760)` | [006_clinic_settings.sql](../migrations/006_clinic_settings.sql) |
| patient_visible | `patient_visible boolean NOT NULL DEFAULT false` | [006_clinic_settings.sql](../migrations/006_clinic_settings.sql) |
| version | `version integer NOT NULL CHECK (version>0)` | [006_clinic_settings.sql](../migrations/006_clinic_settings.sql) |
| updated_at | `updated_at timestamptz NOT NULL DEFAULT now()` | [006_clinic_settings.sql](../migrations/006_clinic_settings.sql) |
| updated_by | `updated_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL` | [006_clinic_settings.sql](../migrations/006_clinic_settings.sql) |

Table constraints: Inline constraints above.

## Explicit indexes

PK and UNIQUE constraints also create indexes; do not add duplicate indexes blindly.

- `CREATE INDEX idx_patients_profile ON public.patients(profile_id);` - [001_initial_schema.sql](../migrations/001_initial_schema.sql)
- `CREATE INDEX idx_appointments_patient_date ON public.appointments(patient_id, appointment_date);` - [001_initial_schema.sql](../migrations/001_initial_schema.sql)
- `CREATE INDEX idx_verifications_status ON public.patient_verifications(status);` - [001_initial_schema.sql](../migrations/001_initial_schema.sql)
- `CREATE INDEX idx_audit_logs_created ON public.audit_logs(created_at DESC);` - [001_initial_schema.sql](../migrations/001_initial_schema.sql)
- `CREATE INDEX idx_verifications_profile_created ON public.patient_verifications(profile_id, created_at DESC);` - [003_mobile_onboarding.sql](../migrations/003_mobile_onboarding.sql)
- `CREATE INDEX patient_import_jobs_created ON public.patient_import_jobs(created_at DESC);` - [004_legacy_patient_imports.sql](../migrations/004_legacy_patient_imports.sql)
- `CREATE INDEX patient_import_jobs_expiry ON public.patient_import_jobs(expires_at) WHERE source_cipher IS NOT NULL;` - [004_legacy_patient_imports.sql](../migrations/004_legacy_patient_imports.sql)
- `CREATE INDEX patients_import_number_lookup ON public.patients(lower(patient_number));` - [004_legacy_patient_imports.sql](../migrations/004_legacy_patient_imports.sql)
- `CREATE INDEX patients_import_name_lookup ON public.patients(lower(regexp_replace(trim(full_name),'\s+',' ','g')));` - [004_legacy_patient_imports.sql](../migrations/004_legacy_patient_imports.sql)
- `CREATE INDEX patients_import_demographics_lookup ON public.patients(date_of_birth,regexp_replace(contact_number,'[^0-9]','','g'));` - [004_legacy_patient_imports.sql](../migrations/004_legacy_patient_imports.sql)

## Functions and triggers

Migration [002](../migrations/002_authentication.sql) provisions public profiles from Auth inserts and defines the own-profile SELECT policy. No automatic updated_at trigger is defined; supported API writes must set timestamps explicitly. Inspect the full SQL when reconciling a deployed project. Migration 003 uses profile locking in API code instead of a pending-verification uniqueness constraint. Migration 005 adds the avatar ownership CHECK. No SQL snapshot is supplied: migrations depend on managed Supabase schemas and the live bucket limit differs from migration 005.

Exact avatar ownership constraint (migration 005):

```sql
CHECK (avatar_path IS NULL OR avatar_path ~ ('^' || id::text || '/[a-f0-9-]{36}\.jpg$'))
```
