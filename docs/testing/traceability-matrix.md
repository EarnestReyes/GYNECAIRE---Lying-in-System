# Requirements-to-tests traceability

Automated references below are **narrow relevant assertions**, not proof that the complete requirement is tested. For example, signup form validation does not test Auth registration, and approval-schema tests do not test database linking. Inspect the exact case/source before treating it as complete coverage. All automated cases ran; live integration/manual acceptance remains NOT RUN. Missing features have no positive implementation test.

| Requirement | Source status | Relevant existing case IDs | Manual / remaining verification |
|---|---|---|---|
| FR-001 Registration | I | TC-MOB-002, TC-MOB-003 | Confirm email/callback on a disposable account; inspect trigger-created profile. NOT RUN. |
| FR-002 Login, session and logout | I | TC-API-028, TC-MOB-004 | Test expired session, inactive membership and logout on both clients. NOT RUN. |
| FR-003 Password recovery | P | TC-WEB-011, TC-WEB-012 | Test allowlisted native/web recovery and expired links. NOT RUN. |
| FR-004 Guest access | I | TC-MOB-005 | Try each protected screen without a session. NOT RUN. |
| FR-005 Account interests | I | TC-API-045, TC-API-046 | Save/reload with two separate accounts. NOT RUN. |
| FR-006 Verification submission | I | TC-API-040, TC-API-041, TC-API-042, TC-API-043, TC-API-044 | Submit, reject, resubmit and reload; pending duplicates must not be created. NOT RUN. |
| FR-007 Verification review/linking | I | TC-API-047, TC-API-048, TC-API-049 | Check conflict/rollback and two-account isolation. NOT RUN. |
| FR-008 Patient management | I | TC-API-029, TC-API-050, TC-API-051, TC-API-052, TC-API-053 | Verify validation, persistence, pagination and unauthorized denial. NOT RUN. |
| FR-009 Staff appointments | P | TC-API-029, TC-API-054, TC-API-055 | Create supported appointment; test custom clinic service rejection and fix before acceptance. NOT RUN. |
| FR-010 Patient care read | P | None establishing implementation | Verify own linked account only and unlinked denial. NOT RUN. |
| FR-011 Medical records | U | None establishing implementation | Requires approved clinical model and document access rules. NOT RUN. |
| FR-012 Checkups | U | None establishing implementation | Requires clinical schema, API and clinician workflow tests. NOT RUN. |
| FR-013 Inventory | U | None establishing implementation | Requires stock integrity and audited movement design. NOT RUN. |
| FR-014 Messages | U | None establishing implementation | Requires participant model and isolation tests. NOT RUN. |
| FR-015 Reports | P | TC-API-029, TC-API-056 | Reconcile aggregation using synthetic fixtures; historical imports can increase new-record counts. NOT RUN. |
| FR-016 Staff own profile | I | TC-API-037, TC-API-057, TC-API-058, TC-API-059 | Save/reload and attempt another profile identifier. NOT RUN. |
| FR-017 Staff avatars | B | TC-API-030, TC-API-031, TC-API-032, TC-API-033, TC-API-034, TC-API-035, TC-API-036, TC-WEB-001, TC-WEB-002 | Run authorized disposable-account lifecycle and restoration against Storage. NOT RUN. |
| FR-018 Clinic configuration | I | TC-API-025, TC-API-026, TC-API-027, TC-WEB-003, TC-WEB-004 | Enter approved facts, conflict two edits, test patient_visible false/true and rollback. NOT RUN. |
| FR-019 Persistent notifications | U | None establishing implementation | Requires persistence, preferences and event authorization. NOT RUN. |
| FR-020 Privacy and account | P | TC-WEB-011, TC-WEB-012 | Verify approved URLs, password recovery and actual supported actions. NOT RUN. |
| FR-021 Historical imports | B | TC-API-001, TC-API-002, TC-API-003, TC-API-004, TC-API-005, TC-API-006, TC-API-007, TC-API-008, TC-API-009, TC-API-010, TC-API-011, TC-API-012, TC-API-013, TC-API-014, TC-API-015, TC-API-016, TC-API-017, TC-API-018, TC-API-019, TC-API-020, TC-API-021, TC-API-022, TC-API-023, TC-API-024, TC-WEB-008, TC-WEB-010 | Use synthetic files with scanner; verify rollback, retry, provenance and expiry in isolated DB. NOT RUN. |
| FR-022 Existing staff access | P | TC-API-038, TC-API-039 | Verify deactivation/self-lockout protections and role refresh. NOT RUN. |
| FR-023 Education bookmarks | I | TC-MOB-006 | Bookmark/reload locally; do not claim server sync. NOT RUN. |
| FR-024 Educational content | I | TC-MOB-005, TC-MOB-007 | Open external resources and verify safe fallback. NOT RUN. |
| FR-025 Web theme and responsiveness | I | TC-WEB-007, TC-WEB-013, TC-WEB-014 | Keyboard, narrow viewport and both theme checks. NOT RUN. |
| FR-026 Health monitoring | U | None establishing implementation | Requires clinical data and ownership model. NOT RUN. |
| FR-027 Community | U | None establishing implementation | Do not present placeholder navigation as a functioning community. NOT RUN. |
| FR-028 Staff invitation/provisioning | U | None establishing implementation | Requires approved Auth administration and activation workflow. NOT RUN. |
| FR-029 Patient booking | U | None establishing implementation | Requires booking conflict, policy and ownership enforcement. NOT RUN. |
| FR-030 Audit trails | P | TC-API-018, TC-API-019, TC-API-027, TC-API-029, TC-API-032, TC-API-037, TC-API-039 | Reconcile each supported mutation and rollback; avoid storing patient values in event details. NOT RUN. |

## Non-functional traceability

| Requirement | Evidence / planned test | Result boundary |
|---|---|---|
| NFR-001 Server authentication | SEC-001 through SEC-012, plus targeted route/validation cases | Manual acceptance NOT RUN; narrower automated evidence only |
| NFR-002 Patient isolation | SEC-001 through SEC-012, plus targeted route/validation cases | Manual acceptance NOT RUN; narrower automated evidence only |
| NFR-003 Secret and transport protection | SEC-001 through SEC-012, plus targeted route/validation cases | Manual acceptance NOT RUN; narrower automated evidence only |
| NFR-004 Atomic audit | SEC-001 through SEC-012, plus targeted route/validation cases | Manual acceptance NOT RUN; narrower automated evidence only |
| NFR-005 Retry and concurrency | SEC-001 through SEC-012, plus targeted route/validation cases | Manual acceptance NOT RUN; narrower automated evidence only |
| NFR-006 Upload safety | SEC-001 through SEC-012, plus targeted route/validation cases | Manual acceptance NOT RUN; narrower automated evidence only |
| NFR-007 Accessibility | UX-001 through UX-010 | Manual acceptance NOT RUN; narrower automated evidence only |
| NFR-008 Responsive themes | UX-001 through UX-010 | Manual acceptance NOT RUN; narrower automated evidence only |
| NFR-009 Performance | Capacity targets/load test not defined | Manual acceptance NOT RUN; narrower automated evidence only |
| NFR-010 Recovery and retention | SEC-012 restore/retention review | Manual acceptance NOT RUN; narrower automated evidence only |
| NFR-011 Maintainability and tests | Automated catalog; TypeScript/lint/build results | Named checks passed; no CI guarantee |
| NFR-012 Privacy governance | SEC-001 through SEC-012, plus targeted route/validation cases | Manual acceptance NOT RUN; narrower automated evidence only |
| NFR-013 Validation and time | SEC-001 through SEC-012, plus targeted route/validation cases | Manual acceptance NOT RUN; narrower automated evidence only |
| NFR-014 Observability | SEC-001 through SEC-012, plus targeted route/validation cases | Manual acceptance NOT RUN; narrower automated evidence only |

[FR definitions](../requirements/functional-requirements.md) | [NFR definitions](../requirements/non-functional-requirements.md) | [case catalog](test-case-catalog.md) | [integration cases](integration-checklist.md)
