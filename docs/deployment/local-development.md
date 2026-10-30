# Local development

## Software and workspace

Observed runtime: Node **24.13.0**, npm **11.19.1**, Windows PowerShell. The repository is an npm workspace (`apps/*`). Web uses React 19/Vite 8/TypeScript 5.9, API Express 5/TypeScript 7/tsx, and mobile Expo 58/React Native 0.88/TypeScript 6. Follow the checked-in manifests/lockfile and matching SDK documentation rather than upgrading the stack during setup.

The root `package-lock.json` is used by root workspace commands. Nested legacy lockfiles also exist; do not delete or treat them as independent authoritative installs without a separate package-management decision. Review the existing uncommitted work before a clean install.

```powershell
node --version
npm --version
npm ci --offline=false
```

`npm ci` is the intended clean-checkout procedure once the reviewed root lockfile is synchronized. This documentation task did not install packages or prove a clean install. Preserve verified TLS and the approved registry/proxy. Do not use `strict-ssl=false` or `NODE_TLS_REJECT_UNAUTHORIZED=0` to solve network errors. Inspect npm lifecycle-script approval warnings rather than blindly approving unrelated scripts.

## Configure without overwriting local secrets

Use the existing examples only when the destination is absent:

```powershell
if (!(Test-Path apps/api/.env)) { Copy-Item apps/api/.env.example apps/api/.env }
if (!(Test-Path apps/web/.env.local)) { Copy-Item apps/web/.env.example apps/web/.env.local }
if (!(Test-Path apps/mobile/.env.local)) { Copy-Item apps/mobile/.env.example apps/mobile/.env.local }
```

Fill values privately using [the environment reference](environment-variables.md). `.env` files are ignored. API SQL uses the existing CA file and certificate verification. Use a disposable Supabase project for integration tests and seeds; do not reuse a production URL as a test fixture.

For an existing Supabase project, reconcile [schema state](supabase-setup.md) before running any SQL. The documentation's latest project already has all 13 application tables and the avatar bucket; do not recreate them.

## Run

Use separate terminals from the repository root:

```powershell
npm run dev:api
```

```powershell
npm run dev:web
```

```powershell
npm run dev:mobile
```

Default API port is 5000; Vite usually uses 5173 and Expo web 8081. Confirm actual terminal origins and `CORS_ORIGINS`. A physical phone needs a reachable development-machine LAN URL, not its own `localhost`. Permit only the necessary trusted development network traffic; do not disable network security globally. Production URLs must use HTTPS.

`GET /api/v1/health` is a basic process check, not a database-readiness test. Sign in with an operator-provisioned synthetic staff account for portal testing. General/clinic patient registration never grants staff roles. No passwords or Auth identities are supplied by the seed file.

## Check

```powershell
npm run typecheck --workspace=apps/api
npm run test:clinic --workspace=apps/api
npm run test:portal-http --workspace=apps/api
npm run lint --workspace=apps/web
npm run build --workspace=apps/web
npm exec --workspace=apps/mobile -- tsc --noEmit
npm run test:ui --workspace=apps/mobile
```

See [all suites and limitations](../testing/test-results.md). Mobile's canonical lint configuration is missing; `expo lint` can attempt to install/configure dependencies. That is a separate approved setup task, not a safe assumption that lint already works. Existing root/API default `npm test` scripts are placeholders; use named suites.
