# Environment variables

Source of variable names/defaults: [API example](../../apps/api/.env.example), [web example](../../apps/web/.env.example), [mobile example](../../apps/mobile/.env.example), and their actual clients/server. Values below are descriptions, never real secrets. Restart/rebuild the relevant process after changing environment configuration.

## API: server only

| Variable | Purpose / boundary |
|---|---|
| `PORT` | Express listener; source defaults to 5000 |
| `DATABASE_URL` | Privileged PostgreSQL connection; secret, verified TLS with `apps/api/certs/supabase-ca.crt` |
| `SUPABASE_URL` | Project URL matching Auth issuer and Storage; explicitly set it rather than relying on the project's source fallback |
| `SUPABASE_SERVICE_ROLE_KEY` | Privileged Storage credential; secret, API only; never `VITE_`/`EXPO_PUBLIC_` |
| `CORS_ORIGINS` | Comma-separated exact client origins; configure each environment, not an unreviewed wildcard |
| `AVATARS_ENABLED` | Enables new image uploads when all other checks pass; retrieval/removal have separate readiness behavior |
| `IMPORTS_ENABLED` | Explicit import deployment approval; requires key, parser libraries and scanner; default false |
| `IMPORT_RETENTION_ENABLED` | Starts encrypted-staging cleanup independently of new-upload approval; only after schema/key readiness |
| `IMPORT_ENCRYPTION_KEY` | Secret 32-byte key encoded as 64 hex characters; back up consistently across replicas; never commit a sample key |
| `IMPORT_CLAMD_HOST`, `IMPORT_CLAMD_PORT` | Maintained ClamAV INSTREAM on a trusted private network; do not expose it publicly |

The API database role currently observed bypasses RLS. Enabling RLS does not replace Express authorization or least-privilege server credentials. The CA file is required at deployment; do not disable TLS verification if it is missing.

## Web: public build configuration

| Variable | Purpose |
|---|---|
| `VITE_SUPABASE_URL` | Auth project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Public client key protected by Auth/RLS, not a privileged service key |
| `VITE_API_URL` | Express base URL; code defaults to localhost:5000 when absent, which is unsuitable for a deployed client |
| `VITE_PRIVACY_POLICY_URL`, `VITE_TERMS_URL` | Optional clinic-approved HTTPS documents; blank/unapproved values show Not published |

## Mobile/Expo: public build configuration

| Variable | Purpose |
|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | Auth project URL |
| `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Public client key |
| `EXPO_PUBLIC_API_URL` | Required by account/preferences/verification/care/clinic requests; reachable device-specific development URL or production HTTPS API |
| `EXPO_PUBLIC_AUTH_REDIRECT_URL` | Explicit PKCE callback; register exact approved web/native URI and recovery variant in Supabase |
| `EXPO_PUBLIC_CLINIC_PHONE`, `EXPO_PUBLIC_CLINIC_ADDRESS` | Optional approved guest-facing facts; no invented defaults |

Native callback example: `gynecairemobile://auth-callback`. Development mobile web example: `http://localhost:8081/auth-callback`; recovery adds `?next=recover`. Check the actual build scheme and origin before allowlisting. These examples are not real project credentials.

## Development seed controls

The [seed file](../../database/seeds/development_seed.sql) uses explicit PostgreSQL session settings, not frontend or API flags. Nothing in the application reads or executes it. It stays blocked unless both development-environment and non-production acknowledgement settings are deliberately supplied by an operator on a disposable target. See [seed safety](../../database/seeds/README.md). A session setting cannot prove which hosted project a human selected.
