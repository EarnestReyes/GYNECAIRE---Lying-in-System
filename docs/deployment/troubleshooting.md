# Troubleshooting

| Symptom | Inspect / safe next step |
|---|---|
| Dependency registry/proxy refusal | Check approved registry/proxy and connectivity. Use normal TLS; never disable verification. Do not delete unrelated caches or regenerate lockfiles blindly. |
| Missing mobile account/care data | `EXPO_PUBLIC_API_URL` must be configured and reachable by that device. Auth sign-in alone does not prove Express account requests work. Rebuild/restart public environment consumers. |
| Recovery unavailable/incomplete | Check `EXPO_PUBLIC_AUTH_REDIRECT_URL`, exact Supabase allowlist, same-device PKCE verifier and callback `next=recover`. Check provider delivery/expiry without logging tokens. |
| Portal returns login after a forbidden action | Current `staffApi` treats every 403 as access loss. Inspect operation permission versus actual inactive/expired staff session; do not weaken the backend guard. |
| Import button goes to Dashboard | Current canonical `#patients/import` and legacy aliases have unit coverage. Check served build/hash and guards. Unknown hashes still fall back to Dashboard; actual browser behavior needs acceptance testing. |
| Imports unavailable | Approval/key/scanner/parser/schema readiness is fail-closed. Inspect named capabilities; never bypass a missing encryption/scanner check or test with real patient files. |
| Avatar setup details shown | Check server flag, credential/project, decoder, private JPEG-only 3 MiB bucket, profile column/cleanup access. Do not recreate existing resources. Use safe presence diagnostics, not full `.env` output. |
| Image upload rejected | JPEG only, nonempty and <=3 MiB, <=16 megapixels, valid decoded content. PNG/WebP are not currently accepted. Native sharp must load. |
| Clinic configuration unavailable | Reconcile actual `clinic_settings` existence and API-role permissions. Latest metadata already confirms its table; do not replay migration 006 blindly. No row means setup is needed, not a missing table. |
| Configured service cannot be scheduled | Known contract defect: clinic services/free text can differ from the appointment API's fixed four-value enum. See [known issues](../testing/known-issues.md); do not claim the service catalog is fully integrated. |
| Empty records/inventory/messages | These are genuinely unavailable modules, not evidence that a patient has no clinical records or stock is zero. Do not replace warnings with mock facts. |
| Mobile lint wants to install/configure | No canonical mobile ESLint config exists. Approve that setup as a separate change; do not treat supplemental web rules as the native project's established policy. |
| TLS/database startup error | Verify private connection configuration and the CA file. Maintain `rejectUnauthorized:true`; do not print a connection URL or disable certificate checks. |
| Metadata history disagrees with old reports | Follow current code + fresh read-only catalogs + dated results. The audit observed `clinic_settings` appear between probes; operator changes/target history need reconciliation. |

Do not reproduce a production incident with data writes during a documentation audit. Capture sanitized status/error identifiers and verify risky steps in an isolated environment.
