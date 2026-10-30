-- Single-clinic configuration. Review/apply manually after migrations 001-005.
-- No seed data: clinic facts must be entered by an authorized administrator.
BEGIN;
CREATE TABLE public.clinic_settings (
 id smallint PRIMARY KEY CHECK (id=1),
 clinic_name text NOT NULL CHECK (length(trim(clinic_name)) BETWEEN 2 AND 150),
 description text CHECK (length(description)<=2000),
 contact_number text CHECK (contact_number ~ '^\+?[0-9 ()-]{7,25}$'),
 email text CHECK (length(email)<=254 AND email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
 address text CHECK (length(address)<=1000),
 timezone text NOT NULL DEFAULT 'Asia/Manila' CHECK (length(timezone) BETWEEN 1 AND 100),
 operating_hours jsonb NOT NULL CHECK (
  jsonb_typeof(operating_hours)='object' AND octet_length(operating_hours::text)<=8192
  AND operating_hours ?& ARRAY['monday','tuesday','wednesday','thursday','friday','saturday','sunday']),
 services text[] NOT NULL CHECK (cardinality(services)<=30 AND array_position(services,NULL) IS NULL AND length(array_to_string(services,''))<=3000),
 appointment_policies jsonb NOT NULL CHECK (
  jsonb_typeof(appointment_policies)='object' AND octet_length(appointment_policies::text)<=4096
  AND appointment_policies ?& ARRAY['booking_enabled','minimum_notice_hours','slot_minutes','cancellation_notice_hours','cancellation_rules']
  AND jsonb_typeof(appointment_policies->'booking_enabled')='boolean'
  AND (appointment_policies->>'minimum_notice_hours')::integer BETWEEN 0 AND 8760
  AND (appointment_policies->>'slot_minutes')::integer BETWEEN 5 AND 240
  AND (appointment_policies->>'cancellation_notice_hours')::integer BETWEEN 0 AND 8760),
 patient_visible boolean NOT NULL DEFAULT false,
 version integer NOT NULL CHECK (version>0),
 updated_at timestamptz NOT NULL DEFAULT now(),
 updated_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL
);
-- The singleton primary key is the lookup index; additional indexes add no value.
ALTER TABLE public.clinic_settings ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.clinic_settings FROM PUBLIC,anon,authenticated;
CREATE POLICY clinic_settings_no_direct_clients ON public.clinic_settings
 FOR ALL TO anon,authenticated USING (false) WITH CHECK (false);
-- The API's backend-only SQL role also needs these privileges if it is not owner.
GRANT SELECT,INSERT,UPDATE ON public.clinic_settings TO service_role;
COMMIT;
