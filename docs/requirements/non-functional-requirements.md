# Non-functional requirements

Status follows the [baseline legend](README.md). No unmeasured latency, availability or legal compliance target is claimed.

| ID | Concern | Required behavior / current limitation | Status | Verification |
|---|---|---|---|---|
| NFR-001 | Server authentication | JWT signature/issuer/audience and active database role checks | I | See security/integration/manual checklists; unit coverage alone is insufficient. |
| NFR-002 | Patient isolation | Derive patient identity from authenticated profile; reject cross-account access | I | See security/integration/manual checklists; unit coverage alone is insufficient. |
| NFR-003 | Secret and transport protection | Server-only SQL/Storage credentials; verified TLS; HTTPS in deployment | P | See security/integration/manual checklists; unit coverage alone is insufficient. |
| NFR-004 | Atomic audit | Supported changes and audit commit/rollback together; coverage not universal | P | See security/integration/manual checklists; unit coverage alone is insufficient. |
| NFR-005 | Retry and concurrency | Import idempotency and clinic optimistic revision checks | I | See security/integration/manual checklists; unit coverage alone is insufficient. |
| NFR-006 | Upload safety | Avatar decode/size validation; imports require clean malware result and encrypted staging | B | See security/integration/manual checklists; unit coverage alone is insufficient. |
| NFR-007 | Accessibility | Keyboard, focus, labels, contrast, screen-reader and touch-target assessment | P | See security/integration/manual checklists; unit coverage alone is insufficient. |
| NFR-008 | Responsive themes | Web light/dark/system; mobile currently light design | P | See security/integration/manual checklists; unit coverage alone is insufficient. |
| NFR-009 | Performance | Clinic-approved latency, load and capacity budgets not established | U | Clinic must approve measurable budgets before load testing. |
| NFR-010 | Recovery and retention | Approved backups, restore drill and healthcare retention policy needed | P | See security/integration/manual checklists; unit coverage alone is insufficient. |
| NFR-011 | Maintainability and tests | Named suites exist; root test placeholder and mobile lint configuration gaps remain | P | See security/integration/manual checklists; unit coverage alone is insufficient. |
| NFR-012 | Privacy governance | Approve policies, consent, access/retention and incident process before release | P | See security/integration/manual checklists; unit coverage alone is insufficient. |
| NFR-013 | Validation and time | Strict allowlisted inputs; clinic timezone does not yet govern all appointment entry | P | See security/integration/manual checklists; unit coverage alone is insufficient. |
| NFR-014 | Observability | Sanitized errors exist; production alerting, metrics and incident ownership unverified | P | See security/integration/manual checklists; unit coverage alone is insufficient. |

Evidence: [auth middleware](../../apps/api/src/middleware), [API routes](../../apps/api/src/routes), [imports](../../apps/api/src/imports), [test results](../testing/test-results.md), [audit](../audits/GYNECAIRE_FULL_SYSTEM_AUDIT.md).
