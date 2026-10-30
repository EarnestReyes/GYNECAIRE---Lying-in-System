# GYNECAIRE database documentation

| Directory | Contents / execution rule |
|---|---|
| [migrations](migrations/) | Existing immutable SQL 001-006. Review/apply manually to the correct project; never blindly replay CREATE statements. |
| [schema](schema/README.md) | Intended schema from reviewed migrations, data dictionary, relationships, RLS and live-evidence boundaries |
| [checks](checks/README.md) | Read-only metadata checks; privileges depend on the role used |
| [seeds](seeds/README.md) | Opt-in synthetic development fixtures only; blocked by default and never automatic |

The latest read-only documentation check found 13 public application tables, including `clinic_settings`, all with RLS enabled. The private `staff-avatars` bucket is JPEG-only with a 3,145,728-byte limit. There is no confirmed migration ledger; matching resources do not prove exactly which migration file was executed. No configuration row was observed in `clinic_settings` at that check. These are metadata observations, not a database dump or CRUD proof.

Do not recreate the original 12 tables, `profiles.avatar_path`, `avatar_cleanup`, `clinic_settings`, or the existing avatar bucket. Migration 005 contains a historical 2 MiB bucket creation value; the current API and observed bucket use 3 MiB. Preserve the migration and reconcile drift through an approved future change if needed.

No SQL snapshot pretending to be a live export is supplied. [Migration deployment guidance](../docs/deployment/supabase-setup.md) explains new versus existing projects. No migrations or seeds were executed during this documentation task.
