-- Additive onboarding storage. Apply after 001 and 002; never resets data.
BEGIN;
CREATE TABLE public.account_preferences (
 profile_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
 interests TEXT[] NOT NULL DEFAULT '{}',
 updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 CHECK (cardinality(interests) <= 8)
);
ALTER TABLE public.account_preferences ENABLE ROW LEVEL SECURITY;
-- Access is through authenticated backend routes; no direct client writes.
ALTER TABLE public.patient_verifications
 ADD COLUMN patient_kind TEXT CHECK (patient_kind IN ('new', 'existing')),
 ADD COLUMN date_of_birth DATE,
 ADD COLUMN contact_number TEXT CHECK (length(contact_number) <= 25),
 ADD COLUMN consent_at TIMESTAMPTZ;
-- Existing pending duplicates are preserved; backend serializes new submissions
-- using a profile row lock instead of imposing a destructive uniqueness cleanup.
CREATE INDEX idx_verifications_profile_created ON public.patient_verifications(profile_id, created_at DESC);
COMMIT;
