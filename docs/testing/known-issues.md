# Known issues and limitations

Source evidence and detailed prioritized findings remain in the [full-system audit](../audits/GYNECAIRE_FULL_SYSTEM_AUDIT.md). This index does not replace it.

| ID | Issue | Evidence / impact | Required verification or action |
|---|---|---|---|
| DOC-K01 | Custom service/API enum mismatch | [portal validation](../../apps/api/src/validation/portal.ts) versus [clinic validation](../../apps/api/src/validation/clinic-settings.ts); configured custom services can be rejected | Align contract in later implementation; TC-MAN-004 |
| DOC-K02 | Missing clinical and other backends | Migrations define no medical records/vitals/stock/messages/notifications | Approve clinical/security design before building; do not claim UI completion |
| DOC-K03 | Avatar bucket drift | 005=2 MiB; inspected existing bucket=3 MiB JPEG | Preserve existing bucket; review future reconciliation, not migration replay |
| DOC-K04 | Migration application evidence incomplete | No ledger; table names alone do not establish full SQL parity | Compare live columns/constraints/policies/grants read-only before deployment |
| DOC-K05 | Live write integration untested here | Route tests mostly doubles; no cloud mutation | TC-MAN lifecycle/rollback and SEC isolation checks in disposable project |
| DOC-K06 | Test entry points/configuration | Root/API generic test placeholders; mobile lint lacks setup | Configure explicit CI/check commands in a separately authorized code task |
| DOC-K07 | Mobile environment/callback readiness | Previous audit found local API/recovery variables missing; no secret values recorded | Verify target environment against example and Dashboard before device test |
| DOC-K08 | Security/governance gaps | Broad staff access, effective SQL grants, MFA/rate coverage and policy approval need review | SEC checklist and clinic-approved role/policy matrix |
| DOC-K09 | Clinic configuration not initialized | Read-only check found no singleton row | Administrator enters approved facts; no fake seed facts |
| DOC-K10 | Limited cross-module policy integration | Clinic booking policies not enforced booking engine; appointment entry still Manila-oriented | Approve scheduling semantics and add end-to-end enforcement later |
| DOC-K11 | Historical docs and UI limits | Earlier reports include old parser/bucket/clinic assumptions; mobile light-only/local bookmarks | Use current indexes, retain historical scope and test actual devices |

No package health/CVE certification or production readiness claim is made. No issues were fixed in application code during documentation work.
