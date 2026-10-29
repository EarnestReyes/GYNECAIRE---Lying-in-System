
-- GYNECAIRE: Initial Database Schema
-- Migration 001

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Account profiles
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    phone_number TEXT,
    account_type TEXT NOT NULL DEFAULT 'general'
        CHECK (account_type IN ('general', 'patient', 'staff', 'admin')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Clinic patient records
CREATE TABLE public.patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_number TEXT UNIQUE NOT NULL,
    profile_id UUID UNIQUE REFERENCES public.profiles(id)
        ON DELETE SET NULL,
    full_name TEXT NOT NULL,
    date_of_birth DATE,
    contact_number TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Clinic staff
CREATE TABLE public.staff_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID UNIQUE NOT NULL
        REFERENCES public.profiles(id) ON DELETE RESTRICT,
    staff_role TEXT NOT NULL
        CHECK (staff_role IN ('admin', 'midwife', 'nurse', 'receptionist')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Patient verification requests
CREATE TABLE public.patient_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL
        REFERENCES public.profiles(id) ON DELETE RESTRICT,
    patient_id UUID REFERENCES public.patients(id)
        ON DELETE RESTRICT,
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'approved', 'rejected')),
    reviewed_by UUID REFERENCES public.staff_members(id),
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Appointments
CREATE TABLE public.appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL
        REFERENCES public.patients(id) ON DELETE RESTRICT,
    appointment_date TIMESTAMPTZ NOT NULL,
    appointment_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN (
            'pending', 'confirmed', 'completed', 'cancelled'
        )),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Audit logs
CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_profile_id UUID REFERENCES public.profiles(id)
        ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_patients_profile
    ON public.patients(profile_id);

CREATE INDEX idx_appointments_patient_date
    ON public.appointments(patient_id, appointment_date);

CREATE INDEX idx_verifications_status
    ON public.patient_verifications(status);

CREATE INDEX idx_audit_logs_created
    ON public.audit_logs(created_at DESC);

-- Restrict direct API access until policies are implemented
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
