# Software Requirements Specification

## Purpose and scope

GYNECAIRE supports clinic administration and patient account onboarding using a React/Vite staff web portal, Expo/React Native patient app, Express API, PostgreSQL, and Supabase Auth/private Storage. This SRS documents the current repository and explicitly separated future requirements. It is not an assertion of production readiness.

## Actors and boundaries

Guest, General User, linked Verified Patient, and active staff memberships (administrator, midwife, nurse, receptionist). No doctor role is defined. Supabase Auth is the identity provider; Express is the privileged workflow boundary. SQL schema is single-clinic, not multi-tenant.

## Interfaces and data

Clients obtain Auth sessions and send bearer JWTs to /api/v1. The API verifies tokens and queries PostgreSQL using parameterized SQL. Private staff avatars use server Storage REST operations and short-lived signed reads. Imports use authenticated encrypted staging and scanner/decoder prerequisites. See [architecture](../diagrams/01-system-architecture.mmd), [schema](../../database/schema/README.md) and [deployment](../deployment/README.md).

## Requirements baseline

[FR-001 through FR-030](functional-requirements.md) define observed functionality and gaps; [NFR-001 through NFR-014](non-functional-requirements.md) define security, reliability and quality expectations. [Permissions](roles-permissions.md), [use cases](use-cases.md), [acceptance](acceptance-criteria.md) and [test traceability](../testing/traceability-matrix.md) form the review baseline.

## Module boundaries

| Surface | Current scope | Requirement references |
|---|---|---|
| Staff dashboard | Real demographic/appointment aggregates and navigation, not clinical outcomes; live browser unverified | FR-008, FR-009, FR-015, FR-025 |
| Patients and verification | Demographic CRUD subset, review and account linking; no clinical chart | FR-006 through FR-008 |
| Imports | Encrypted staging, duplicate decisions, confirmation/history behind security prerequisites | FR-021 |
| Appointments | Staff-managed schedule/status; custom-service mismatch; patient reads only | FR-009, FR-010, FR-029 |
| Records/checkups | No clinical persistence; completed appointment list does not establish a medical record | FR-011, FR-012 |
| Inventory/messages/notifications | Unavailable backends | FR-013, FR-014, FR-019 |
| Reports and staff | Limited aggregates and membership changes, no invitation lifecycle | FR-015, FR-022, FR-028 |
| Settings/profile/clinic/privacy | Own profile and gated avatars, revisioned clinic configuration, supported Auth actions and optional approved policy links | FR-016 through FR-018, FR-020, FR-025 |
| Mobile welcome/Auth/onboarding | Guest/general/clinic intent, signup/login/recovery and pending verification routing | FR-001 through FR-007 |
| Mobile patient dashboard/history | Bounded own appointment summary; no clinical history, monitoring or self-booking | FR-010 through FR-012, FR-026, FR-029 |
| Mobile education/profile/Community | Static education, local bookmarks, account/logout; Community unavailable | FR-002, FR-005, FR-023, FR-024, FR-027 |

## Exclusions and approval

Clinical charting, medical documents, inventory, messages, notifications, patient self-booking and Community are not delivered end to end. Approved clinic facts, legal texts, data retention, role segregation, hosting, backup objectives and capacity targets require stakeholder decisions. No source, schema or deployment change is authorized by this document alone.
