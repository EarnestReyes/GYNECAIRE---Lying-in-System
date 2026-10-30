-- OPTIONAL DEVELOPMENT-ONLY FIXTURE. NOT EXECUTED OR LIVE-VALIDATED.
-- Read README.md. Operator must verify a disposable non-production project.
-- No Auth writes, credentials, clinical records, or automatic opt-in.
BEGIN;
DO $$
BEGIN
 IF current_setting('gynecaire.seed_environment', true) IS DISTINCT FROM 'development'
 OR current_setting('gynecaire.seed_ack', true) IS DISTINCT FROM 'I_HAVE_VERIFIED_THIS_IS_NOT_PRODUCTION' THEN
  RAISE EXCEPTION 'Development seed blocked: verify non-production project and explicit session opt-in.';
 END IF;
 IF to_regclass('public.patients') IS NULL OR to_regclass('public.audit_logs') IS NULL THEN
  RAISE EXCEPTION 'Development seed blocked: review migration 001 prerequisites.';
 END IF;
 IF EXISTS (
  SELECT 1 FROM public.patients p
  JOIN (VALUES ('DEV-SEED-0001','SYNTHETIC DEVELOPMENT PATIENT A'),
               ('DEV-SEED-0002','SYNTHETIC DEVELOPMENT PATIENT B')) AS f(number,name)
    ON p.patient_number=f.number
  WHERE p.full_name IS DISTINCT FROM f.name OR p.profile_id IS NOT NULL
     OR p.date_of_birth IS NOT NULL OR p.contact_number IS NOT NULL
 ) THEN
  RAISE EXCEPTION 'Development seed blocked: fixture identifier collision; no records overwritten.';
 END IF;
END $$;
WITH inserted AS (
 INSERT INTO public.patients(patient_number,full_name)
 VALUES ('DEV-SEED-0001','SYNTHETIC DEVELOPMENT PATIENT A'),
        ('DEV-SEED-0002','SYNTHETIC DEVELOPMENT PATIENT B')
 ON CONFLICT(patient_number) DO NOTHING
 RETURNING id
)
INSERT INTO public.audit_logs(actor_profile_id,action,entity_type,entity_id)
SELECT NULL,'development.seed.patient','patient',id FROM inserted;
COMMIT;
