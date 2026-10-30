-- Additive; requires approval before application. Bucket remains private.
BEGIN;
ALTER TABLE public.profiles ADD COLUMN avatar_path TEXT;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_avatar_owner CHECK (
 avatar_path IS NULL OR avatar_path ~ ('^' || id::text || '/[a-f0-9-]{36}\.jpg$')
);
CREATE TABLE public.avatar_cleanup (
 object_path TEXT PRIMARY KEY,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.avatar_cleanup ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.avatar_cleanup FROM PUBLIC,anon,authenticated;
INSERT INTO storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
VALUES('staff-avatars','staff-avatars',false,2097152,ARRAY['image/jpeg']);
-- No client storage policies: only the server service role writes/signs/deletes.
COMMIT;
