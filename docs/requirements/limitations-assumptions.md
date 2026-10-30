# Known limitations and assumptions

- Repository migration definitions are not a live export. Thirteen table names/RLS flags and the private JPEG bucket were checked read-only; no migration ledger was found and full live constraint/policy parity is not established.
- No clinic singleton facts were stored at inspection. Stakeholders must supply approved name, contacts, address, hours, services and publication choices.
- Custom clinic service names conflict with the fixed appointment validator. Booking settings and clinic timezone are informational/partial integrations, not a complete booking engine.
- Medical records, checkups, inventory, messaging, notifications, health monitoring, Community and patient self-booking need backend work. No new tables are prescribed or applied by this documentation task.
- Avatar security gate and import encryption/scanner gates depend on operator configuration; no live write lifecycle was rerun.
- Mobile education bookmarks are local, content is static, and mobile theme is light. Web responsiveness/themes need visual acceptance on supported devices.
- Patient consent, approved policy texts, data retention, clinician role separation, backup/restore targets, capacity and hosting must be approved. No regulatory certification is claimed.
- Public Auth callback URLs, SMTP/email delivery, MFA and session settings require Dashboard review. No secrets are included in these docs.
- Historical architecture reports are retained as dated evidence; new indexes explain known drift rather than silently rewriting history.
