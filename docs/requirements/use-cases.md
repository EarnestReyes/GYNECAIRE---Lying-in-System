# Use cases

All live acceptance scenarios below remain NOT RUN in this documentation task. Use synthetic data and authorized disposable accounts.

## UC-001 - Account onboarding

Requirements: FR-001, FR-002, FR-003, FR-004.

- Main sequence: Guest chooses General User or Clinic Patient intent, signs up/logs in and follows confirmed Auth callback.
- Alternatives: Invalid/expired callback retains safe recovery; signup never self-grants staff.
- Postcondition and limits: Auth trigger/profile and API session checks; real email/callback not exercised.

## UC-002 - Patient verification

Requirements: FR-006, FR-007.

- Main sequence: Authenticated account submits consent/demographics; staff reviews, selects/creates patient and approves.
- Alternatives: Pending stays pending; rejection permits controlled resubmission; already-linked conflicts roll back.
- Postcondition and limits: Verification, patient link, account category and audit must agree.

## UC-003 - Staff appointment

Requirements: FR-008, FR-009.

- Main sequence: Active staff selects actual patient, supported service and date/time, saves and changes status.
- Alternatives: Invalid service fails; custom clinic service currently exposes a contract mismatch.
- Postcondition and limits: Appointment and audit persist; no implied medical chart or patient self-booking.

## UC-004 - Historical import

Requirements: FR-021.

- Main sequence: Active admin supplies synthetic CSV/XLSX after encryption/scanner readiness, maps, previews, reviews duplicates and confirms.
- Alternatives: Malformed/unsafe file rejected; unresolved decisions block; retry must not duplicate patients.
- Postcondition and limits: Jobs/rows/provenance/events/audit update atomically; imported patient stays unlinked.

## UC-005 - Own avatar lifecycle

Requirements: FR-016, FR-017.

- Main sequence: Active staff uploads JPEG, retrieves signed image, replaces, removes and reloads profile/navigation.
- Alternatives: Bad format/size/foreign owner rejected; failed storage must not leave invalid profile pointer.
- Postcondition and limits: Own profile path, audit and durable cleanup queue; live lifecycle not rerun here.

## UC-006 - Clinic settings

Requirements: FR-018.

- Main sequence: Admin enters approved facts, hours/services/policies and saves expected revision.
- Alternatives: Inactive/nonadmin denied; stale revision returns conflict; patient sharing off by default.
- Postcondition and limits: Singleton revision/editor/audit commit together; booking policies are not enforced scheduling rules.
