# Integration checklist

All cases below: **NOT RUN**. Do not execute production writes without authorization. Use disposable environments/synthetic data and verify cleanup before concluding. Detailed assertions and permission gates must be implemented in future integration tests; no automatic rollback is assumed across Storage and PostgreSQL.

| ID | Module / requirements | Preconditions | Steps | Expected | Actual |
|---|---|---|---|---|---|
| TC-MAN-001 | Auth registration/recovery (FR-001/002/003) | Disposable General User and allowlisted callbacks | Register, confirm email, login, recover, expire link, logout and relaunch | Own general profile only; safe callback and expired-token handling. | NOT RUN |
| TC-MAN-002 | Verification/linking (FR-006/007) | Two synthetic accounts and unlinked patients; active staff | Submit, reject/resubmit, approve, repeat approval and test conflicting link | One valid link, consistent status/category/audit, rollback on conflict. | NOT RUN |
| TC-MAN-003 | Patient management (FR-008) | Active staff, nonstaff and synthetic demographics | Create/edit/list/filter/reload; attempt unauthenticated and inactive requests | Validated persisted demographics; forbidden requests denied. | NOT RUN |
| TC-MAN-004 | Appointments/service contract (FR-009/029) | Synthetic linked patient; fixed and custom clinic services | Create supported service, edit status, try custom service, inspect patient read-only view | Supported path persists; custom-service mismatch remains a known source defect. | NOT RUN |
| TC-MAN-005 | Avatar lifecycle (FR-017) | Explicit test-account authorization; decoder/credential/bucket readiness | Back up avatar, upload JPEG, retrieve, replace, remove, relaunch and restore original | Correct private objects, own path/audit, cleanup retries, original restored. | NOT RUN |
| TC-MAN-006 | Clinic revision/publication (FR-018) | Approved clinic facts, admin/nonadmin and two edit sessions | Save first row, stale edit, invalid input, nonadmin edit, toggle patient visibility | Revision conflict; transaction audit; reduced projection only after opt-in. | NOT RUN |
| TC-MAN-007 | Historical import (FR-021) | Isolated DB; approved encryption key/scanner; synthetic CSV/XLSX | Upload/map/review/confirm/retry; inject failure and expire staging | No duplicates, atomic rollback, provenance/events and no Auth linking. | NOT RUN |
| TC-MAN-008 | Staff membership (FR-022/028) | Disposable admins and active/inactive staff | Change supported role/activation; retry old token; test safeguards | Server reads current role, denies deactivated access; no fake invite flow. | NOT RUN |
| TC-MAN-009 | Reports (FR-015) | Known synthetic appointments and imported demographics | Compare totals/date filters and reload | Totals match underlying data; creation counts labeled accurately. | NOT RUN |
| TC-MAN-010 | Profile/privacy (FR-016/020) | Own staff account; approved policy links | Save profile, reload, inspect policy URLs and supported password actions | Own updates only; no unsupported legal or account-deletion promise. | NOT RUN |
| TC-MAN-011 | Mobile local education (FR-004/023/024) | Guest/general/linked device sessions | Open resources, bookmark/relaunch, inspect protected navigation | Education works; bookmarks device-local; no guest protected data. | NOT RUN |
| TC-MAN-012 | Unavailable modules (FR-011/012/013/014/019/026/027) | Web/mobile navigation | Open each module and inspect unavailable states | No fabricated data or controls implying unavailable backend works. | NOT RUN |
