# Session C status

Branch: session-c. Contract version: 1.

## Done
- C-01 importer, checkout-only env check, mapping tests and package lock are in scripts/. Verified the Admin API paths against the published Swagger schema.
- Installed dependencies, passed strict TypeScript checks and all 5 tests. Offline dry run covered 17 features, 7 segments and 6 overrides.
- C-02 was delivered on main by the home builder (rush load, break/fix/reset scripts and CI).

## Next exact step
- From the directory containing the prepared Prasthan .env, run in PowerShell:
  `Copy-Item -LiteralPath .env -Destination "$env:USERPROFILE\prasthan-session-c\.env"`
- In the checkout run `npm --prefix scripts run --silent check-env`, then `npm --prefix scripts run flags:import`. Repeat the import to check that items already exist. Confirm festival_mode, voice_fallback_offline, gifting_enabled and tamil_travellers in the target dashboard.
- After C-01 verification, continue with C-03 and then C-04.

## Blockers
- The checkout has no prepared .env. The live command stopped at its credential check before making any API requests. Current Flagsmith inventory is unknown.
- If individual requests fail after credentials are available, retry and create the remaining failed items from config/flagsmith/flags.json. Use Features for flag defaults and variants, Segments for rules, and each feature's environment segment overrides for enabled/value settings.

## Reproduce offline checks
- `npm --prefix scripts ci`
- `npm --prefix scripts test`
- `npm --prefix scripts run flags:import:dry`
