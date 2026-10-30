-- READ ONLY. Diagnostic queries, not a migration. Run with the actual API role
-- to assess API grants; the Dashboard SQL editor usually uses a stronger role.
BEGIN READ ONLY;
SELECT table_name,column_name,data_type,is_nullable
FROM information_schema.columns
WHERE table_schema='public' AND table_name IN ('profiles','avatar_cleanup')
ORDER BY table_name,ordinal_position;

SELECT c.relname,c.relrowsecurity,c.relforcerowsecurity
FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
WHERE (n.nspname='public' AND c.relname IN ('profiles','avatar_cleanup'))
   OR (n.nspname='storage' AND c.relname='objects');

SELECT schemaname,tablename,policyname,roles,cmd,qual,with_check
FROM pg_policies
WHERE (schemaname='public' AND tablename IN ('profiles','avatar_cleanup'))
   OR (schemaname='storage' AND tablename='objects');

SELECT conname,pg_get_constraintdef(oid) AS definition
FROM pg_constraint WHERE conrelid IN ('public.profiles'::regclass,'public.avatar_cleanup'::regclass);

SELECT id,public,file_size_limit,allowed_mime_types
FROM storage.buckets WHERE id='staff-avatars';

SELECT current_user,
 has_column_privilege(current_user,'public.profiles','avatar_path','SELECT') AS read_avatar,
 has_column_privilege(current_user,'public.profiles','avatar_path','UPDATE') AS update_avatar,
 has_table_privilege(current_user,'public.avatar_cleanup','SELECT') AS read_cleanup,
 has_table_privilege(current_user,'public.avatar_cleanup','INSERT') AS queue_cleanup,
 has_table_privilege(current_user,'public.avatar_cleanup','DELETE') AS finish_cleanup,
 has_table_privilege(current_user,'public.audit_logs','INSERT') AS write_audit;
ROLLBACK;
