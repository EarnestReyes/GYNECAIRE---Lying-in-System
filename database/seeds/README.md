# Development seed strategy

[development_seed.sql](development_seed.sql) is an **optional, unexecuted** fixture for a disposable development project. It creates two clearly synthetic, unlinked demographic records and metadata-only audit events. It creates no Auth users, passwords, staff memberships, appointments, or clinical observations.

Prerequisites: review migration 001 and actual schema compatibility; back up the isolated project; verify its project reference is not production; use an authorized SQL operator. No Supabase Auth identities are required. Auth-dependent test scenarios require separately provisioned, disposable accounts through the approved Auth workflow, never fabricated UUIDs or direct auth.users inserts.

The SQL fails closed unless the operator explicitly configures both session settings in the **same SQL session** before execution:

```sql
SET gynecaire.seed_environment = 'development';
SET gynecaire.seed_ack = 'I_HAVE_VERIFIED_THIS_IS_NOT_PRODUCTION';
```

These are human attestations, not automatic detection of a production project. Do not put them into application startup, CI, or production scripts. The seed itself deliberately does not enable them. Repeated execution inserts no duplicate fixture or audit rows. Existing conflicting fixture identifiers cause an exception rather than an overwrite. No seed was executed or database mutation tested during documentation work; review and test it only in an isolated project.

Remove fixtures by resetting the disposable environment under its own recovery policy. This directory supplies no automatic deletion or production rollback script. Never use these records in screenshots presented as real patient data.
