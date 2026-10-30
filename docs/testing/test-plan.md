# Test plan

## Scope and environment

Use the current uncommitted working tree, installed workspace dependencies, Node 24.13.0/npm 11.19.1, synthetic fixtures and query/Storage doubles. Application code and migrations remain unchanged. No package installation, seed execution, cloud writes, deployment or commit is part of this documentation task.

## Levels

1. Existing validation/unit/query-double HTTP suites: run named package scripts, collect individual cases and distinguish mocks from real parser/decoder coverage.
2. Static checks: API/mobile TypeScript, web lint and build; no assumption that a successful build proves workflow behavior.
3. Read-only Supabase metadata: inspect names/RLS/bucket properties and singleton existence; no patient records or secrets in reports.
4. Isolated integration: authorized disposable accounts, synthetic demographic/files, explicit cloud-write authorization and cleanup/restore plan. NOT RUN here.
5. Browser/device/accessibility: supported viewports, keyboard/screen reader and native flows. NOT RUN here.

## Entry/exit

Installed dependencies and configured trusted database certificate are prerequisites for selected checks. Release acceptance needs all applicable FR/NFR gates, isolated persistence/rollback/ownership tests and stakeholder approval of policies. Unavailable modules cannot pass acceptance through placeholder screenshots. Capture failures without fixing source in this task.

## Commands

Use npm run SCRIPT --workspace=apps/api (or apps/web, apps/mobile) for cataloged scripts. Do not use root npm test as a suite: it intentionally exits with a placeholder error. Do not run test:avatars:storage during a read-only audit: it writes real cloud resources. Mobile expo lint is not run because missing lint setup can offer dependency installation; no installations were authorized.
