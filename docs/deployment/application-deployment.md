# Application deployment procedures

These are **reviewable operator recommendations**, not proof of a completed deployment. No hosting provider or domain is assumed.

## Express API

Build an environment with the reviewed workspace dependency lockfile and supported Node runtime. Current start script uses `tsx src/server.ts`; there is no committed production-compiled API release pipeline. Include `apps/api/certs/supabase-ca.crt`, private environment configuration and the import `parse-worker.cjs` beside the runtime module location. Missing the worker during a future compiled deployment breaks parsing even if TypeScript passes.

Use a managed process/container with HTTPS ingress, limited network access, exact CORS origins, trusted-proxy settings appropriate to the host, secret injection and controlled log access. The source does not yet implement database readiness/graceful drain or a complete distributed limiter; track those release gaps rather than claiming they exist. Do not start enabled retention jobs against an unreviewed schema/target.

```powershell
npm run typecheck --workspace=apps/api
npm start --workspace=apps/api
```

`PORT` is supplied by the host or defaults to 5000. Keep import approval off until scanner, key, database and actual integration checks pass. Avatar release checks must pass with sharp installed. Persistent cleanup needs a trusted external schedule on sleeping/serverless hosts; startup/15-minute timers alone are not a durable job system.

## Staff web portal

Set public Vite values **before** building. The API URL must point to the HTTPS API, not the developer's localhost. Keep server credentials out of client source/build logs.

```powershell
npm run lint --workspace=apps/web
npm run build --workspace=apps/web
```

Host `apps/web/dist` as static assets with an appropriate index fallback, HTTPS and reviewed security headers. The portal uses hash navigation (`#patients/import`); do not add a second router or silently reinterpret route fragments at the host. Verify refresh, direct URLs, login/recovery return and cache behavior. `vite preview` is a local preview, not a documented production service. Assets may be cached; API/Auth responses must retain their appropriate sensitive-response handling.

## Expo patient application

Inspect `apps/mobile/package.json` and [Expo SDK 58 documentation](https://docs.expo.dev/versions/v58.0.0/) before changing Expo/native dependencies. Use `npx expo install` for approved Expo package additions. This task did not add/upgrade packages.

Development uses `npm run dev:mobile` from the root. Configure device-reachable API and approved callback URLs. The current `app.json` declares the `gynecairemobile` scheme, light UI, portrait layout and server web output. Do not assume Expo web export is a simple static SPA or that native dark mode is implemented.

EAS is the intended native-build route per repository instructions, but no `eas.json` or verified EAS deployment was found. An operator may, after approving tooling/account setup, run the standard configuration/build workflow inside `apps/mobile`:

```powershell
npx eas-cli build:configure
npx eas-cli build --platform android
```

These commands can install tooling, create build configuration and use external accounts; they were **not run**. Review generated project IDs, build profiles, signing, public environment injection and platform permissions. Do not generate native folders or signing credentials casually. iOS and store delivery require their separate approved credentials/review. Test confirmation/recovery, SecureStore refresh/logout, patient isolation and real device layouts before release.

## Promotion gate

Promote the same reviewed code/lockfile through isolated test and production environments. Require [automated checks](../testing/test-results.md), [integration acceptance](../testing/integration-checklist.md), clinic policy approval and a tested rollback/recovery plan. Do not label unavailable medical/inventory/messaging/notification modules complete because navigation/build succeeds.
