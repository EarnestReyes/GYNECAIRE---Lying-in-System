# GYNECAIRE technical documentation

Documentation baseline: October 30, 2026, Asia/Manila. This set describes the current working tree, including uncommitted clinic/avatar work. It is not a claim that the complete system is deployed or production-ready.

## Start here

| Area | Purpose |
|---|---|
| [System requirements](requirements/SRS.md) | Product scope, implemented/partial/unavailable requirements and acceptance boundaries |
| [Database](../database/README.md) | Migration order, complete column dictionary, relationships and authorization |
| [Deployment](deployment/README.md) | Local setup, environment variables, Supabase, hosting, recovery and troubleshooting |
| [Current diagrams](diagrams/README.md) | Mermaid sources, SVG companions, notation and source evidence |
| [Testing](testing/README.md) | Test plan, cases/results, manual checklists and requirements traceability |
| [Architecture history](architecture/README.md) | Reviewed implementation reports and earlier flowcharts, preserved in place |
| [Full-system audit](audits/GYNECAIRE_FULL_SYSTEM_AUDIT.md) | Prioritized evidence-based defects, gaps and proposed roadmap |
| [Documentation manifest](documentation-manifest.md) | Files/purposes, final directory tree, review decisions and validation results |

## Evidence and terminology

- **Implemented**: source, route and intended persistence exist; deployment/real interaction may still be unverified.
- **Partial**: a useful subset exists; the remaining scope is explicitly identified.
- **Unavailable/planned**: there is no connected backend for the feature; a screen or table name alone is not completion.
- **Verified**: only the stated check actually passed. Unit/query-double results do not prove real PostgreSQL writes, RLS, email delivery, browser rendering or device behavior.

Current application source and migration definitions describe intended implementation. Read-only metadata verifies particular resources at a particular time. [Test results](testing/test-results.md) describe executed checks. Historical architecture reports retain their original scope/date; newer evidence can supersede their deployment assumptions without rewriting history.

Important open issues include the custom-service/appointment enum mismatch, missing local mobile API/recovery configuration, production authorization/integration coverage, and missing clinical/inventory/messaging/notification backends. See [known issues](testing/known-issues.md). No unsupported regulatory certification or deployed availability is asserted.
