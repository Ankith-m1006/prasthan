# C-04: NudgeBee break/fix moment, end to end (Session C + Ankith, 45-60 min)

Most of this is clicking in the NudgeBee and Slack UIs (Ankith). Codex prepares, verifies and times it.

## Paste into Codex

````
Session C. Read AGENTS.md, docs/SPONSORS.md section 3, docs/DEMO-SCRIPT.md, docs/RISKS.md. `git merge main`; read status/A.md (is /v1/ops/fallback live with Flagsmith?).

GOAL: on stage, the voice pod crashes under the rush; NudgeBee raises it with a root cause in Slack; an approved runbook turns on Flagsmith voice_fallback_offline and restores the voice deployment; travellers keep getting answers.

FILES YOU OWN: infra/k8s/**, docs/NUDGEBEE-RUNBOOK.md (new; you own it), status/C.md. Use scripts/demo-*.mjs from C-02 as they are; if one needs a fix, write a REQUEST in your status file (in the 2-session split another session owns scripts/).

STEPS
1. Verify the agent: ask Ankith (in your report if needed) to confirm the cluster shows active in NudgeBee. If nbctl is installed and NUDGEBEE_API_TOKEN is in the shell env (never print it): run `nbctl events list --account-id $NUDGEBEE_ACCOUNT_ID` and paste only event names/times.
2. Write docs/NUDGEBEE-RUNBOOK.md: the exact runbook to build in the NudgeBee UI:
   - Trigger: alert on prasthan-voice (CrashLoopBackOff / OOMKilled / restarts > 2 in 2 min) or a chat command.
   - Step 1 (approval gate): "Switch travellers to offline voice".
   - Step 2: REST call. Preferred: Flagsmith Admin API (PATCH the voice_fallback_offline feature state to enabled=true; headers Authorization: Api-Key <stored as a NudgeBee secret, never in git>). Alternative: POST <tunnel-url>/v1/ops/fallback {on:true} with x-ops-token. Alternative 2: script step running curl. Write all three; Ankith picks what the UI supports.
   - Step 3: kubectl set env deploy/prasthan-voice FAULT_MODE=none -n prasthan (or rollout undo) via the K8s action / Kubectl bee.
   - Step 4: wait for ready; message in Slack "Voice restored; switch back with /..." (manual flag off, or a second runbook).
   - What to say on stage at each step.
3. If the REST step needs a public URL to reach the laptop: document a quick tunnel option (cloudflared tunnel --url http://localhost:8080) as optional; prefer the Flagsmith Admin API path (public already).
4. Dry run with Ankith: node scripts/demo-reset.mjs; node scripts/demo-break.mjs; time how long until NudgeBee shows the alert in Slack; Approve; time the recovery. Record the times in status/C.md.
5. Make sure the traveller path survives: during the break, demo-break.mjs prints "traveller answers: OK" (built in C-02). If it prints FAIL, find why (api fallback? flag?) and request the fix from the owner.
6. Fallback if NudgeBee is not raising alerts by 15:15: demo-fix.mjs is the manual runbook; in the demo, show NudgeBee's view of the cluster + whatever it found, and say honestly that the flip was manual.

ACCEPTANCE CHECKS
- One full rehearsal: break -> alert seen -> approve -> fallback on (Flagsmith dashboard) -> voice pod Ready -> fallback off. Times written down.
- During the break, "traveller answers: OK" lines in demo-break output.

FINISH: status/C.md (times, what worked, what is manual), commit "C-04: NudgeBee runbook + rehearsal", Merge steps. Report the timings to Ankith.
````
