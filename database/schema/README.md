# Database schema

- [Schema reference](schema_reference.md): table purposes, lifecycle, keys, constraints/indexes and migration dependencies.
- [Data dictionary](data_dictionary.md): every column defined by migrations 001-006, including later ALTER additions.
- [Relationships](relationships.md): actual foreign keys, cardinality, deletion behavior and logical non-FK references.
- [RLS and authorization](rls_authorization.md): browser/API/SQL/Storage trust boundaries and observed privilege concerns.
- [Entity relationship diagram](../../docs/diagrams/02-entity-relationships.mmd) and [SVG](../../docs/diagrams/02-entity-relationships.svg).

The dictionary is a **migration-derived reference**, not a live database export. Managed `auth.users` and Storage schemas are referenced but not redefined. The read-only metadata evidence in [deployment setup](../../docs/deployment/supabase-setup.md) confirms resource presence, not all transactional behavior or exact migration history.
