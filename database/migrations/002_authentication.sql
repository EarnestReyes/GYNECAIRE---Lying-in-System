
-- GYNECAIRE Migration 002
-- Secure profile creation for new Supabase Auth users

BEGIN;

-- Create a profile automatically when an account registers.
-- Do not trust user-supplied roles or account types.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    full_name,
    account_type
  )
  VALUES (
    NEW.id,
    COALESCE(
      NULLIF(
        LEFT(TRIM(NEW.raw_user_meta_data ->> 'full_name'), 150),
        ''
      ),
      'New User'
    ),
    'general'
  );

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.handle_new_user()
FROM PUBLIC;

DROP TRIGGER IF EXISTS on_auth_user_created
ON auth.users;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- Users may read only their own basic profile.
-- Do not grant profile updates yet because account_type
-- must not be editable by ordinary users.

CREATE POLICY "Users can read own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING ((SELECT auth.uid()) = id);

-- Ensure privileged tables remain inaccessible directly
-- until explicit authorization policies are implemented.

COMMIT;
