# Schema reference

[Dictionary](data_dictionary.md) records column definitions, constraints and explicit indexes. [Relationships](relationships.md) and [authorization](rls_authorization.md) explain their use.

| Table | Purpose | Key / notable integrity |
|---|---|---|
| profiles | Auth-linked identity and account category | id |
| patients | Clinic demographic record; may be unlinked to an account | id, patient_number, profile_id |
| staff_members | Authoritative staff role and active membership | id, profile_id |
| patient_verifications | Account-to-patient verification requests and review state | id, profile_id, patient_id, reviewed_by |
| appointments | Scheduled clinic encounters; not a clinical record | id, patient_id |
| audit_logs | Metadata-only mutation audit | id, actor_profile_id |
| account_preferences | Account interests | profile_id; table constraints in dictionary |
| patient_import_jobs | Encrypted import source, mapping, revision and lifecycle | id, uploader_id; table constraints in dictionary |
| patient_import_rows | Encrypted row staging and duplicate decisions | job_id, patient_id; table constraints in dictionary |
| patient_import_provenance | Idempotent source identifiers and imported patient mapping | id, job_id, patient_id, imported_by; table constraints in dictionary |
| patient_import_events | Import decision events without patient values | id, job_id, actor_id |
| avatar_cleanup | Durable obsolete-object cleanup queue | object_path |
| clinic_settings | Single-clinic configuration, revision and patient-publication opt-in | id, updated_by |

## Migration dependencies

Apply only after operator review: 001 base -> 002 Auth trigger/policies -> 003 preferences/onboarding -> 004 imports -> 005 avatars -> 006 singleton clinic settings. Existing projects must reconcile objects before considering any SQL: these migrations are not universal idempotent repair scripts. No deployment ledger was found. All 13 table names are present on the inspected project; this does not prove every migration statement was applied unchanged.

## Confirmed drift and limits

- Migration 005 specifies 2,097,152 bytes; the existing private staff-avatars bucket was read as 3,145,728 bytes, JPEG only. Current API validation follows 3 MiB. Do not recreate the bucket or rerun 005.
- clinic_settings exists, but no singleton row was present during the read-only check. An approved administrator must enter real facts.
- The clinic services list accepts arbitrary names, while the appointment validator accepts four fixed types. Configuration does not make arbitrary services bookable.
- No migration defines clinical records, checkup observations, inventory, conversations, messages or persistent notifications. A table/screen name alone is not proof of a working workflow.
- No stored medical documents bucket or document metadata schema exists in these migrations.
