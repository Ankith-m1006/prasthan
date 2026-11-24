# B-06 (OPTIONAL): Android build / Play internal testing (Session B, only if ahead after 15:30)

Do not depend on this. Expo Web is the judge path. Expo Go on the phone is the second path.

Reference: Ruko's mobile release workflow in the repo `Ankith-m1006/bharat-agent-lab` (GitHub Actions, EAS-free: `expo prebuild` + Gradle, signed with a keystore from secrets). It is not on this laptop; open it on github.com and copy the approach, not code blindly.

## Paste into Codex

````
Session B. OPTIONAL phase. Read AGENTS.md. `git merge main`.

GOAL: a GitHub Actions workflow that builds a release AAB (and APK) from apps/mobile without EAS, for Play internal testing.

FILES YOU OWN: .github/workflows/android-beta.yml, apps/mobile/** (app.json android.package, versionCode), status/B.md.

STEPS
1. app.json: android.package "dev.ankithbuilds.prasthan" (ask Ankith to confirm the id), versionCode 1, app name "Prasthan", adaptive icon from our own SVG motif exported to PNG.
2. Workflow (manual trigger): checkout, setup-node 22, setup-java 17, npm ci in apps/mobile, `npx expo prebuild --platform android --no-install`, decode keystore from secret ANDROID_KEYSTORE_BASE64, gradle bundleRelease + assembleRelease with signing env from secrets (ANDROID_KEYSTORE_PASSWORD, ANDROID_KEY_ALIAS, ANDROID_KEY_PASSWORD), set EXPO_PUBLIC_API_URL from a repo variable, upload artifacts. Never echo secrets.
3. README note in status/B.md: which secrets to add; Play Console upload is manual (internal testing track).

ACCEPTANCE CHECKS
- actionlint (if available) or a careful read; the workflow is valid YAML.
- If time: run it once from GitHub (needs the repo pushed + secrets).

FINISH: status/B.md, commit "B-06: optional Android release workflow", Merge steps.
````
