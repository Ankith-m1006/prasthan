# Session C status

Branch: session-c. Contract version: 1.

## Done
- C-01 live Flagsmith import verified by a second Admin API pass: 17 flags, 7 segments and 6 overrides existed, zero failures. The environment uses v2 feature versions. Five mapping tests passed. No manual dashboard changes remain.
- The ignored checkout .env reports SARVAM_API_KEY as SET. Sarvam authentication verified in the A-02 live check below.
- C-02 was already delivered on main by the home builder.

## Next exact step
- Install WSL 2 and Docker Desktop, start the Docker engine, then install k3d and kubectl and run node infra/k8s/k3d-up.mjs.

## Blockers
- Docker and k3d were unavailable on PATH. WSL reports it is not installed. C-04 paused at user request.

## Commands
- From the checkout: npm --prefix scripts ci, npm --prefix scripts test, npm --prefix scripts run flags:import:dry, npm --prefix scripts run flags:import.

C-03 image definition, Dockerfile-specific context allowlist, six Kubernetes resources and deployment helpers are committed. YAML parsing and Node syntax checks passed. Running k3d-up stopped at Docker preflight. Image size, pod readiness, ingress, voice routing and metrics remain unverified.

## A-02 live Sarvam check, 25 Nov

- Started the API from the ignored checkout .env with ROLE=all, SARVAM_MODE=live, MOCK_ALL=0 and Flagsmith in mock mode to isolate voice. The local health endpoint confirmed live Sarvam.
- Sent one Kannada sentence about travelling to Hubballi on Friday night for Sankranti. POST /voice/translate returned HTTP 200 and "I have to be in Hubli on Friday night for the Sankranti festival."
- POST /v1/tts produced a 222072-byte RIFF/WAVE. Used that synthesized Kannada audio for POST /v1/voice/intent. STT and spoken reply were live. The transcript retained Hubballi, Friday night and Sankranti. Rules resolved BLR-HBL on 2027-01-15.
- TTS accepted language_code on the first request and returned audios. STT and translation worked with the existing client fields. No field-name change required.
- npm run check in services/api passed TypeScript and all 57 tests. The separate MOCK_ALL=1 acceptance request returned HTTP 200, BLR-HBL, 2027-01-15 and parser rules.

## Request to Session A

- Investigate the 600-token chat completion limit with sarvam-105b on the full trip prompt. In a diagnostic replay both attempts returned HTTP 200, finish_reason length, 600 completion tokens and no message content. The voice route correctly used rules. A short chat probe returned content with the expected field name. Validate a completion budget or supported reasoning setting against the eight-second timeout before changing the client.