# Production security, rollback and recovery

## Release checklist

- [ ] Confirm project/host identity, applied SQL history, root dependency lockfile and supported runtime.
- [ ] Review client/default database grants, exposed functions and the privileged API role. RLS is enabled, but the observed backend role bypasses it.
- [ ] Verify real JWT issuer/audience/role/expiry, active staff roles, admin-only routes and two-patient ownership with synthetic accounts.
- [ ] Decide and enforce approved administrator MFA/assurance, staff provisioning/deprovisioning and session/recovery policies. These are not certified by existing unit tests.
- [ ] Supply only public client keys to Vite/Expo; keep SQL, service credentials and import keys in server secret storage. Review history/build outputs separately for leaks.
- [ ] Keep TLS verification, private buckets/scanner and exact origins. Bound requests/SQL work and configure trusted ingress/rate controls according to actual topology.
- [ ] Approve versioned privacy/terms, verification wording, clinical record amendment/retention, access audits and backup policy. Do not auto-publish generated legal policies.
- [ ] Run real avatar/clinic/import acceptance in an isolated project before enabling production feature flags. Imports require maintained scanner signatures and durable key recovery.
- [ ] Keep unavailable features visibly unavailable. Clinical records, checkups, inventory, messages and notifications do not yet have completed persistence.

## Recovery before rollout

Inventory database backups/PITR, object storage recovery capabilities, import encryption-key backups and hosting rollback artifacts. Their existence/retention was not verified by this task. A database restore does not automatically restore the same Storage objects; a Storage restore does not repair profile paths/provenance. Protect and test both sides of the reference boundary.

Perform restore drills only in isolated targets. Check schema, constraints, role grants, profile/patient linkage, encrypted data decryptability, object references, cleanup queues and audit continuity. Do not extract real patient data into public capstone/demo fixtures.

## Rollback principles

1. Stop or drain affected traffic/jobs using an approved operator runbook; preserve logs/unknown-operation IDs without printing secrets.
2. Roll back application artifacts/environment flags when compatible with the current additive schema. Do not automatically drop tables/columns or reset the database.
3. Investigate ambiguous commits before retrying non-idempotent writes. Imports have job replay semantics; ordinary appointments currently lack equivalent idempotency.
4. Reconcile avatar objects and `avatar_cleanup` safely. Never bulk-delete a bucket to resolve an uncertain upload. A signed URL may remain valid until expiry/deletion; it is not a permanent permission grant.
5. Use a reviewed forward corrective migration or isolated recovery process if schema/data correction is required. Preserve existing migrations and audits.
6. Re-run authorization and acceptance checks before reopening writes. Inform authorized clinic owners of any relevant integrity/privacy incident.

No backup restoration, rollback, deletion, secret rotation or account change was executed by this documentation task. These procedures require operator/clinic review and cannot establish regulatory compliance by themselves.
