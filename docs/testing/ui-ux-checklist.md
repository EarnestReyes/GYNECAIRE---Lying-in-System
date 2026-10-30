# UI/UX acceptance checklist

Manual browser/device checks: **NOT RUN**. Code inspection and helper tests do not prove rendered quality. Preserve burgundy, blush pink and deep plum while meeting measurable accessibility requirements.

| ID | Coverage | Procedure / expected result |
|---|---|---|
| UX-001 | All web routes / sidebar / nested import routes | Direct-load and back/forward; retain intended page rather than unexpected Dashboard redirect |
| UX-002 | Light/dark/system | Switch OS and app themes; no white panels or unreadable borders/text; selection persists as designed |
| UX-003 | Responsive | Check 360/768/1280+ CSS-pixel viewports; tables scroll intentionally, forms/dialogs remain reachable |
| UX-004 | Keyboard / screen reader | Logical tab order, visible focus, accessible names, modal focus trapping/return and announced errors |
| UX-005 | Forms / clinic settings | Field errors, loading, empty, offline/error feedback, save/cancel, dirty state and conflict recovery |
| UX-006 | Tables / reports | Real data only, understandable filters/pagination/timezone and no invented statistics |
| UX-007 | Avatar | Own image in profile/navigation; initials for empty/error; no stale signed image after replacement/removal |
| UX-008 | Mobile onboarding / navigation | Touch targets, safe areas, back/logout, guest restrictions and pending/rejected/approved states |
| UX-009 | Content and unavailable states | Clear backend limits, no dead actionable buttons or implied clinical persistence |
| UX-010 | Readability | Heading hierarchy, contrast assessment, text enlargement and consistent spacing/tokens across pages |

Mobile app currently uses a light design; web theme support must not be described as mobile dark-mode support. Diagram visual QA is separate from application UI verification.
