# RLS and authorization

RLS is enabled for all 13 public application tables in the inspected catalog. This is a defense layer, not proof that API operations enforce ownership: the SQL backend uses privileged credentials and must authorize every request itself. Never put DATABASE_URL or a service-role key in either client.

## Direct-client surface

Review migration [002](../migrations/002_authentication.sql) for the own-profile SELECT policy and Auth-insert trigger; it adds no patient/appointment read policies. Migrations 003-004 leave sensitive workflow writes to Express. 004 revokes PUBLIC/anon/authenticated on import tables; 005 does the same for avatar_cleanup. 006 revokes client grants and has an explicit deny policy, granting backend service_role SELECT/INSERT/UPDATE. Policy results also depend on table grants, role membership and BYPASSRLS; reconfirm all three before release. The previous full-system audit records broader grants on original tables; this documentation pass reconfirmed RLS flags, not every effective privilege.

## Express controls

- JWT verification uses issuer/JWKS/audience in [authenticate.ts](../../apps/api/src/middleware/authenticate.ts).
- Staff routes check active database membership and staff/admin profile category; administrator capabilities come from staff_members.staff_role, never request roles. Inspect [middleware](../../apps/api/src/middleware) and [portal router](../../apps/api/src/routes/portal-router.ts).
- Patient care reads derive the linked patients.profile_id from the authenticated account with account_type=patient. A supplied patient UUID is not authority.
- Verification approval links the account, changes status/category and audits in one transaction. Resubmission does not mean automatic approval.
- Clinic edits recheck/lock active admin membership, compare revision, write and audit atomically. Patient reads require explicit patient_visible and use a reduced field projection.
- Imports require active administrator access and security gates. Importing demographics does not create Auth accounts or verified links.
- Avatar paths are owner-prefixed, database constrained, and private. Only server Storage credentials sign/write/delete; no permissive direct-client policy is required. Cleanup objects are not public.

## Verification still required

Run isolated two-account and deactivated-staff integration tests; test direct REST/Storage denial using anon/authenticated tokens; review MFA/session/redirect settings in Dashboard. Unit mocks and enabled RLS do not establish production isolation. No live mutation/security penetration tests were performed here.
