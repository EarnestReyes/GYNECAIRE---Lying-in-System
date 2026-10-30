# Database relationships

These are declared migration FKs, not inferred relationships. Cardinality follows nullability and UNIQUE constraints.

| Parent | Child | Child FK | Meaning |
|---|---|---|---|
| auth.users | profiles | id | one Auth identity to zero/one public profile; cascade |
| profiles | patients | profile_id | zero/one linked demographic record; UNIQUE nullable; set null |
| profiles | staff_members | profile_id | zero/one membership; UNIQUE; restrict |
| profiles | account_preferences | profile_id | zero/one preferences; cascade |
| profiles | patient_verifications | profile_id | many requests; restrict |
| patients | patient_verifications | patient_id | optional patient target; restrict |
| staff_members | patient_verifications | reviewed_by | optional reviewer; default NO ACTION |
| patients | appointments | patient_id | many appointments; restrict |
| profiles | audit_logs | actor_profile_id | optional actor; set null |
| profiles | patient_import_jobs | uploader_id | many jobs; NO ACTION |
| patient_import_jobs | patient_import_rows | job_id | many staging rows; cascade |
| patients | patient_import_rows | patient_id | optional reviewed match; NO ACTION |
| patient_import_jobs | patient_import_provenance | job_id | many provenance records; NO ACTION |
| patient_import_rows | patient_import_provenance | job_id,row_number | composite FK; zero/one provenance per row |
| patients | patient_import_provenance | patient_id | many source mappings; NO ACTION |
| profiles | patient_import_provenance | imported_by | many mappings; NO ACTION |
| patient_import_jobs | patient_import_events | job_id | many events; NO ACTION |
| profiles | patient_import_events | actor_id | many events; NO ACTION |
| profiles | clinic_settings | updated_by | optional last editor; set null |

avatar_cleanup.object_path and profiles.avatar_path refer logically to Storage object paths; they have no storage.objects FK. patient_import_rows.matches is a UUID array of possible matches, not a foreign key. audit_logs.entity_id is a polymorphic identifier with no target FK. clinic_settings.id=1 enforces a global singleton; there is no tenant model. No ERD edge should be added for these logical references.

[ERD](../../docs/diagrams/02-entity-relationships.mmd) | [Dictionary](data_dictionary.md)
