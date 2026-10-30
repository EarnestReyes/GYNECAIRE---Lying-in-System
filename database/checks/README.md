# Read-only database checks

[`avatar-readiness.sql`](avatar-readiness.sql) checks existing avatar columns, constraints, RLS/policies, bucket configuration and role privileges inside a read-only transaction. It does not upload, seed, recreate or repair anything.

Run checks only against an explicitly identified project. The Dashboard SQL editor can use a more privileged role than Express; a successful editor query is not proof that the API role can perform the same operation. Check the actual role and test authorization separately in an isolated environment.

Other catalog evidence gathered for the documentation is summarized in [Supabase setup](../../docs/deployment/supabase-setup.md). No additional executable check or migration was needed. Do not use `apps/api/src/scripts/avatar-storage-smoke.ts` as a read-only check: it deliberately creates/deletes synthetic Storage objects.
