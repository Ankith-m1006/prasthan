# Session C status

Branch: session-c. Contract version: 1.

## Done
- C-01 live Flagsmith import verified by a second Admin API pass: 17 flags, 7 segments and 6 overrides existed, zero failures. The environment uses v2 feature versions. Five mapping tests passed. No manual dashboard changes remain.
- The ignored checkout .env reports SARVAM_API_KEY as SET. Sarvam authentication verified in the A-02 live check below.
- C-02 was already delivered on main by the home builder.

## Next exact step
- Use the verified NudgeBee investigation screenshot in scene 11 of the demo.

## Blockers
- The crash, NudgeBee detection and fault reset are verified. Approval-gated automated remediation was not exercised in this run.
## Commands
- From the checkout: npm --prefix scripts ci, npm --prefix scripts test, npm --prefix scripts run flags:import:dry, npm --prefix scripts run flags:import.

The venue cluster is single-node K3s v1.37.2 in Ubuntu WSL. The Prasthan image was built with Buildah and imported into the connected K3s containerd. The local image measured 263 MB. Both API replicas and one voice replica were Ready before fault injection. Ingress /health returned HTTP 200 with role api and ok true.

## A-02 live Sarvam check, 25 Nov

- Started the API from the ignored checkout .env with ROLE=all, SARVAM_MODE=live, MOCK_ALL=0 and Flagsmith in mock mode to isolate voice. The local health endpoint confirmed live Sarvam.
- Sent one Kannada sentence about travelling to Hubballi on Friday night for Sankranti. POST /voice/translate returned HTTP 200 and "I have to be in Hubli on Friday night for the Sankranti festival."
- POST /v1/tts produced a 222072-byte RIFF/WAVE. Used that synthesized Kannada audio for POST /v1/voice/intent. STT and spoken reply were live. The transcript retained Hubballi, Friday night and Sankranti. Rules resolved BLR-HBL on 2027-01-15.
- TTS accepted language_code on the first request and returned audios. STT and translation worked with the existing client fields. No field-name change required.
- npm run check in services/api passed TypeScript and all 57 tests. The separate MOCK_ALL=1 acceptance request returned HTTP 200, BLR-HBL, 2027-01-15 and parser rules.

## Request to Session A

- Investigate the 600-token chat completion limit with sarvam-105b on the full trip prompt. In a diagnostic replay both attempts returned HTTP 200, finish_reason length, 600 completion tokens and no message content. The voice route correctly used rules. A short chat probe returned content with the expected field name. Validate a completion budget or supported reasoning setting against the eight-second timeout before changing the client.
## C-04 rehearsal, 25 Nov 2026 (IST)

- 15:17:33 injected FAULT_MODE=crash_on_voice into the voice deployment. Only voice received the fault.
- 15:18:17 first observed CrashLoopBackOff for prasthan-voice-7f5fbdb78-7vd5s. Both API pods remained Running. All three NudgeBee agent pods were Running.
- At 15:18:48 a traveller request during the incident returned HTTP 200, BLR-HBL, 2027-01-15 via rules. Prometheus reported both API scrape targets up and the failing voice target down.
- By 15:25:10 the automatic reset restored FAULT_MODE=none. The replacement voice pod was Ready with zero restarts, both API replicas were Running and the voice health endpoint was healthy from an API pod. The failed voice pod restarted six times during the demo. The [NudgeBee investigation](../docs/img/nudgebee-finding.png) records a CrashLoopBackOff event at 15:18:49 IST (09:48:49 UTC), 76 seconds after injection. The automatic investigation identifies the matching pod and correlates exit code 1 during incoming requests with the deployment change to crash_on_voice.

## Festival calendar

- 31 dated records from December 2026 through April 2027 across all 12 requested states plus nationwide observances. Each record links its date source. Eid al-Fitr and Bisu Parba are marked provisional; travel windows are planning estimates.
- Configured and imported festival_calendar and festival_calendar_enabled in the live Flagsmith environment. Verified both via Edge, including enabled=true and the pinned public calendar JSON matching the checked-in dataset. All five importer tests passed.
