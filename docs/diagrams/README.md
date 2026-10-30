# Current system diagrams

Baseline: repository working tree, October 30, 2026. These diagrams describe current source paths and explicit gaps, not verified deployed workflows or a proposed replacement architecture. Dashed shapes identify conditional or unavailable scope.

| Diagram | Editable Mermaid | SVG companion | Evidence |
|---|---|---|---|
| System architecture | [source](01-system-architecture.mmd) | [SVG](01-system-architecture.svg) | [server](../../apps/api/src/server.ts), client package manifests, [database](../../database/schema/README.md) |
| Entity relationships | [source](02-entity-relationships.mmd) | [SVG](02-entity-relationships.svg) | [migrations](../../database/migrations), [relationship ledger](../../database/schema/relationships.md) |
| Data flow | [source](03-data-flow.mmd) | [SVG](03-data-flow.svg) | [account](../../apps/api/src/routes/account.ts), [portal](../../apps/api/src/routes/portal-router.ts), [imports](../../apps/api/src/imports/router.ts) |
| Authentication | [source](04-authentication-flow.mmd) | [SVG](04-authentication-flow.svg) | [middleware](../../apps/api/src/middleware), [Auth trigger](../../database/migrations/002_authentication.sql), [web app](../../apps/web/src/App.tsx) |
| Registration/verification | [source](05-registration-verification.mmd) | [SVG](05-registration-verification.svg) | [account](../../apps/api/src/routes/account.ts), [review](../../apps/api/src/routes/verification-review.ts), [mobile routes](../../apps/mobile/src/app) |
| Appointments | [source](06-appointments.mmd) | [SVG](06-appointments.svg) | [portal](../../apps/api/src/routes/portal-router.ts), [validator](../../apps/api/src/validation/portal.ts), [care read](../../apps/api/src/routes/account.ts) |
| Historical import | [source](07-historical-import.mmd) | [SVG](07-historical-import.svg) | [router](../../apps/api/src/imports/router.ts), [migration 004](../../database/migrations/004_legacy_patient_imports.sql) |
| Staff avatar | [source](08-staff-avatar.mmd) | [SVG](08-staff-avatar.svg) | [avatar router](../../apps/api/src/routes/profile-avatar.ts), [migration 005](../../database/migrations/005_staff_avatars.sql) |
| API sequences | [source](09-api-sequences.mmd) | [SVG](09-api-sequences.svg) | [clinic transaction](../../apps/api/src/routes/clinic-settings.ts), [own-care query](../../apps/api/src/routes/account.ts) |
| Role access | [source](10-role-access.mmd) | [SVG](10-role-access.svg) | [authorization](../../apps/api/src/middleware/authorize.ts), [permissions matrix](../requirements/roles-permissions.md) |

## Notation and limits

- Flowcharts: rounded terminators, process rectangles, decision diamonds, input/output parallelograms and database cylinders. Branch labels identify outcomes. Dashed boxes mean a prerequisite-gated workflow or an explicitly missing backend, not a completed feature.
- Architecture separates patient/mobile, staff/web, shared API and managed services by labeled nodes. No medical document or messaging Storage service is implied.
- DFD: rectangular external entities, elliptical processes, cylindrical stores and labeled transfers. This is a logical overview, not packet-level networking. Audit data is physically in the same PostgreSQL database; its distinct store represents its logical purpose. Imports stage encrypted bytes in PostgreSQL, not in the avatar bucket.
- ERD: the Mermaid source uses crow's-foot relationships for actual declared FKs only, including the composite import-row/provenance reference. The SVG companion is a field-complete table-card and explicit cardinality-ledger view to avoid unreadable crossing edges; it is not the graphical Mermaid ERD export. `auth_users` means managed `auth.users`, shown with only its referenced id. Array type labels use `textArray`/`uuidArray` in Mermaid. Consult the dictionary for exact PostgreSQL types, composite PKs, UNIQUE, CHECK and deletion behavior.
- API sequence SVG condenses alternate outcomes; the Mermaid source contains the explicit alt branches. Patient care requires both patient category and linkage; absence returns 403. Clinic publication is opt-in and never exposes editor identity through the patient projection.
- No proposed future architecture is presented as implemented. Missing modules appear only as gap annotations. Existing draw.io artifacts remain unchanged in [architecture](../architecture/README.md).

## Reproduce and validate

```powershell
node docs/diagrams/generate-diagrams.mjs
```

[The generator](generate-diagrams.mjs) is a documentation-only script using Node built-ins. It reads migration definitions and writes these 20 documentation artifacts. No application imports, network, migrations or data mutations are involved. It does not install tools.

Mermaid CLI/Graphviz/browser rendering packages were unavailable. SVGs were generated directly from the same graph models, **not exported by Mermaid**. All ten SVGs were parsed/rasterized with the installed sharp library; a contact sheet was visually inspected, and loop routes were widened to prevent clipping. Fontconfig emitted cache-directory warnings but rasterization completed. Mermaid source was checked structurally; rendering with an actual Mermaid engine remains a review item, not a claimed passing test. Open individual SVGs at full size for reading; the contact sheet is only layout QA and is not retained in the repository.
