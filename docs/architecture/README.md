# Architecture reports and history

These existing reports and diagrams were reviewed and preserved. Start with the current [SRS](../requirements/SRS.md), [schema](../../database/schema/README.md), [diagrams](../diagrams/README.md), [test results](../testing/test-results.md) and [audit](../audits/GYNECAIRE_FULL_SYSTEM_AUDIT.md). They distinguish implementation from deployment evidence.

| Existing document | Use / limitation |
|---|---|
| [System-flow audit](system-flow-audit.md) | Earlier detailed routing/backend analysis; line numbers and feature inventory predate later import/avatar/clinic changes. |
| [Mobile foundation phases 1-3](mobile-phases-1-3.md) | Onboarding/Auth architecture and earlier verification scope |
| [Mobile UI refinement](mobile-ui-refinement.md) | Design rationale, touch targets, education/bookmarks and historical checks |
| [Staff web portal](staff-web-portal.md) | Original portal modules and interface/backend boundaries |
| [Admin portal refinement](admin-portal-refinement.md) | Shared UI/staff access work; clinic configuration was not yet implemented at that report's baseline |
| [Legacy imports](legacy-patient-imports.md) | Import design/security/deployment detail; initial dependency blockers and test counts are historical. Current parser tests pass; operational gates still apply. |
| [Staff settings](staff-settings.md) | Own profile/password/theme architecture and provider limitations |
| [Navigation/themes/avatars](portal-navigation-theme-avatars.md) | Historical 2 MiB/JPEG-PNG-WebP proposal; its avatar section is superseded by the existing-schema repair |
| [Existing-schema avatars](staff-avatar-existing-schema.md) | Current JPEG-only 3 MiB design and later Storage smoke evidence; full signed-in lifecycle remains unverified |
| [Clinic configuration](clinic-configuration.md) | Implementation details/manual migration guidance. Latest metadata now confirms the table exists, so do not treat its original absent-table statement as current. |

Preserved diagrams: [native current flowchart](current-system-flowchart.drawio), [SVG](current-system-flowchart.svg), and [complete system flowchart](GYNECAIRE-complete-system-flowchart.drawio). These are historical/manual artifacts; their names do not certify every planned branch is implemented. The new diagrams directory explicitly models current source and marks unavailable/conditional behavior.
