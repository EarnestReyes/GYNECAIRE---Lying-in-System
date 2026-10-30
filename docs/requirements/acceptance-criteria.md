# Acceptance criteria

The acceptance/verification column in [functional requirements](functional-requirements.md) defines the requirement-specific checks for every FR. Status I indicates source implementation, not final acceptance.

## Release gates

1. For implemented routes, prove happy path, invalid input, unauthorized role, deactivated membership, reload persistence and rollback on an isolated database.
2. Use two patient accounts to prove own-care isolation; no client-supplied UUID may bypass it.
3. Exercise clinic initial creation, stale version conflict, audit failure rollback and patient publication opt-in. Do not use fake clinic facts in production.
4. Exercise real Storage avatar upload/read/replace/remove, cleanup retry and original-image restoration with explicit account authorization.
5. Keep import gate closed until encryption, trusted scanner, parser suites and real isolated transaction/retry tests pass.
6. Unavailable features must clearly explain limits and must not display fabricated metrics or actionable dead controls. Future modules require approved schema/API/security requirements before acceptance.
7. Test web themes, narrow layouts, keyboard/focus/labels/contrast and mobile touch/navigation on actual supported devices.
8. Approve recovery, retention, privacy policies and hosting configuration; passing unit suites does not replace these gates.

[Test evidence](../testing/test-results.md) records what was actually executed. [Manual checklists](../testing/integration-checklist.md) remain unexecuted.
