# Security test checklist

All manual checks: **NOT RUN**. Coordinate a non-production scope, use synthetic accounts, and retain only sanitized evidence.

| ID | Check | Expected / evidence required |
|---|---|---|
| SEC-001 | Missing, expired, wrong issuer/audience JWT | Protected API rejects; no sensitive response/cache |
| SEC-002 | General/patient/inactive staff attempts privileged endpoints | Current database role enforced; deny imports/clinic/staff writes |
| SEC-003 | Two patient profiles, manipulated UUIDs | No cross-account care or profile access |
| SEC-004 | Direct anon/authenticated table and Storage REST calls | Effective grants + RLS + private Storage deny unintended reads/writes |
| SEC-005 | JPEG spoof, oversized/decompression input, foreign avatar path | Decode/limits enforced; own object only; no invalid persisted path |
| SEC-006 | Scanner unavailable, infected fixture approved by security team, malformed archive | Import fails closed before parse; no patient leakage |
| SEC-007 | Force audit/storage/DB failure in isolated tests | Transaction rolls back; obsolete/orphan objects queued safely |
| SEC-008 | Concurrent/replayed import, clinic stale revision | No duplicated provenance/patient; 409 stale settings |
| SEC-009 | Inspect built client bundle/config and sanitized logs | No service key, SQL URL, patient data or signed URLs in persistent logs |
| SEC-010 | Auth allowlist/SMTP/session/MFA review | Approved production origins, recovery delivery and documented policy |
| SEC-011 | Rate limits/CORS/proxy trust review | Exact approved origins and meaningful abuse controls; CORS is not authorization |
| SEC-012 | Backup/retention/restore/privacy review | Approved recovery and retention evidence; no unsupported compliance claim |

[Automated catalog](test-case-catalog.md) provides narrower unit/mock evidence. [RLS overview](../../database/schema/rls_authorization.md) explains why privileged backend access does not eliminate server ownership checks.
