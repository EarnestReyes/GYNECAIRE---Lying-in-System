# Roles and permissions

Database staff membership, active status and profile category determine staff access. Client labels/metadata are not authority. See [RLS](../../database/schema/rls_authorization.md). The current broad staff permissions require clinic review; do not infer clinician-only segregation.

| Capability | Guest | General | Verified/linked patient | Active midwife/nurse/receptionist | Active admin |
|---|---|---|---|---|---|
| Static education | Yes | Yes | Yes | Outside staff portal scope | Outside staff portal scope |
| Own interests/verification | No | Yes | Account-dependent | Not core staff workflow | Not core staff workflow |
| Own linked care appointments | No | No linked data | Read only | Not via patient identity | Not via patient identity |
| Staff dashboard/patients/appointments/reports | No | No | No | Yes | Yes |
| Review patient verification/linking | No | No | No | Yes | Yes |
| Own staff profile/avatar | No | No | No | Yes, gated avatar | Yes, gated avatar |
| Read internal clinic settings | No | No | No | Yes | Yes |
| Reduced published clinic fields | No public API | Authenticated, opt-in | Authenticated, opt-in | Staff route | Staff route |
| Edit clinic settings | No | No | No | No | Yes |
| Historical import | No | No | No | No | Yes, security gated |
| Change staff membership | No | No | No | No | Yes, safeguards apply |
| Clinical records/inventory/messages/notifications | Unavailable | Unavailable | Unavailable | Unavailable | Unavailable |

Profile account_type supports general/patient/staff/admin. Staff roles support admin/midwife/nurse/receptionist. A linked patients.profile_id is needed for own care reads; an account category alone is insufficient. Supabase service credentials and privileged SQL roles are infrastructure identities, not user roles.
