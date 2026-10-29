-- Additive only. Review and apply explicitly; the application never runs this file.
BEGIN;
CREATE TABLE public.patient_import_jobs (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 uploader_id uuid NOT NULL REFERENCES public.profiles(id),
 idempotency_key uuid NOT NULL,
 filename text NOT NULL CHECK (length(filename) BETWEEN 1 AND 120),
 source_system text NOT NULL CHECK (length(source_system) BETWEEN 1 AND 60),
 status text NOT NULL DEFAULT 'created' CHECK (status IN ('created','staged','validated','completed','expired')),
 file_hash text,
 source_cipher bytea,
 headers jsonb,
 mapping jsonb,
 date_order text CHECK (date_order IN ('DMY','MDY','ISO')),
 revision integer NOT NULL DEFAULT 0,
 row_count integer NOT NULL DEFAULT 0 CHECK (row_count BETWEEN 0 AND 10000),
 imported_count integer NOT NULL DEFAULT 0,
 skipped_count integer NOT NULL DEFAULT 0,
 created_at timestamptz NOT NULL DEFAULT now(),
 expires_at timestamptz NOT NULL DEFAULT now() + interval '24 hours',
 completed_at timestamptz,
 UNIQUE(uploader_id,idempotency_key)
);
CREATE TABLE public.patient_import_rows (
 job_id uuid NOT NULL REFERENCES public.patient_import_jobs(id) ON DELETE CASCADE,
 row_number integer NOT NULL CHECK (row_number BETWEEN 2 AND 10001),
 data_cipher bytea,
 issues text[] NOT NULL DEFAULT '{}',
 warnings text[] NOT NULL DEFAULT '{}',
 matches uuid[] NOT NULL DEFAULT '{}',
 decision text NOT NULL DEFAULT 'review' CHECK (decision IN ('review','create','skip')),
 patient_id uuid REFERENCES public.patients(id),
 PRIMARY KEY(job_id,row_number)
);
CREATE TABLE public.patient_import_provenance (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 job_id uuid NOT NULL REFERENCES public.patient_import_jobs(id),
 row_number integer NOT NULL,
 patient_id uuid NOT NULL REFERENCES public.patients(id),
 source_system text NOT NULL,
 source_identifier_hash text NOT NULL,
 source_identifier_cipher bytea NOT NULL,
 source_file_hash text NOT NULL,
 imported_by uuid NOT NULL REFERENCES public.profiles(id),
 imported_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(source_system,source_identifier_hash),
 UNIQUE(job_id,row_number),
 FOREIGN KEY(job_id,row_number) REFERENCES public.patient_import_rows(job_id,row_number)
);
CREATE TABLE public.patient_import_events (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 job_id uuid NOT NULL REFERENCES public.patient_import_jobs(id),
 actor_id uuid NOT NULL REFERENCES public.profiles(id),
 action text NOT NULL,
 details jsonb NOT NULL DEFAULT '{}', -- only decisions, row numbers, counts; no patient values
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX patient_import_jobs_created ON public.patient_import_jobs(created_at DESC);
CREATE INDEX patient_import_jobs_expiry ON public.patient_import_jobs(expires_at) WHERE source_cipher IS NOT NULL;
-- Non-unique lookup indexes preserve every existing row and identifier.
CREATE INDEX patients_import_number_lookup ON public.patients(lower(patient_number));
CREATE INDEX patients_import_name_lookup ON public.patients(lower(regexp_replace(trim(full_name),'\s+',' ','g')));
CREATE INDEX patients_import_demographics_lookup ON public.patients(date_of_birth,regexp_replace(contact_number,'[^0-9]','','g'));
ALTER TABLE public.patient_import_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_import_rows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_import_provenance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_import_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.patient_import_jobs, public.patient_import_rows,
 public.patient_import_provenance, public.patient_import_events FROM PUBLIC, anon, authenticated;
-- No direct-client policies. Provision a backend-only role explicitly (see deployment guide).
-- Existing patients/profile_id and all historical clinical data remain untouched.
COMMIT;
