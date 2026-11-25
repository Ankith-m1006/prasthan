# Recover Prasthan voice on k3d

Target the venue cluster `k3d-prasthan`, namespace `prasthan`, deployment `prasthan-voice`. The API deployment stays up during the voice fault. Rehearsal and measured recovery time are pending.

## Connect the cluster

1. Run `node infra/k8s/k3d-up.mjs` from the checkout. Confirm both deployments are Ready with `kubectl --context k3d-prasthan -n prasthan get deployment,pods`. Check `http://localhost:8080/health`. For the live flag demo the health response must show Flagsmith live. Configure the server-side environment key in the ignored .env if it shows mock and reapply the deployment.
2. In NudgeBee, open Integrations, choose Kubernetes and add the venue cluster. Run the Helm command generated for this account with kubectl pointed at `k3d-prasthan`. Keep the generated command and its credentials out of recordings and logs. Wait for the cluster to show connected and for both Prasthan workloads to appear.
3. Connect the Slack integration to the chosen workspace and select `#prasthan-ops`. If Slack approval is unavailable, select dashboard approval and record that choice in the rehearsal notes.

## Build the workflow

1. In Workflow Builder, create a workflow named **Recover Prasthan voice**. Choose an event trigger. Filter by the venue cluster, namespace and voice workload. Match CrashLoopBackOff or OOMKilled, or a restart alert for more than two restarts in two minutes. Inspect a real event to map the owning deployment before enabling remediation. For a manual rehearsal, use a manual trigger against the same fixed target.
2. Add **Core > Approval** with the prompt **Switch travellers to offline voice**. Route approval to Ankith. Only the approved branch proceeds. Rejection or timeout ends the workflow.
3. Add a REST action on the approved branch. In Flagsmith Development, feature ID `303347` is `voice_fallback_offline`. Store the admin credential and environment key in the workspace secret store. Use the workflow editor's secret picker for the placeholders below. A read-only request to this URL returned HTTP 200 and `environment_default.enabled=false` during preparation.

   | Setting | Value |
   |---|---|
   | Method | PATCH |
   | URL | `https://api.flagsmith.com/api/__future__/environments/<environment-key>/features/303347/` |
   | Authorization header | `Api-Key <admin-key>` |
   | Content-Type | `application/json` |
   | JSON | `{"environment_default":{"enabled":true}}` |

   Require a successful response and confirm with GET on the same URL that `environment_default.enabled` is true. The environment uses v2 feature versioning. The endpoint and PATCH shape come from the [Flagsmith schema](https://api.flagsmith.com/api/v1/swagger.json). The write still needs a live rehearsal.

4. If the REST action cannot call Flagsmith, use an authenticated REST action against the venue API instead. From an in-cluster runner use `http://prasthan-api.prasthan.svc.cluster.local/v1/ops/fallback`. Set method POST, JSON `{"on":true}` and header `x-ops-token` from the same secret configured as OPS_TOKEN on the API. A live flag change requires both `fallbackActive: true` and `via: "flagsmith"`. An in-memory response affects one API process. If a cloud runner needs access, prefer the public Flagsmith endpoint. A tunnel such as `cloudflared tunnel --url http://localhost:8080` exposes the entire ingress; use only with access control in front and a configured OPS_TOKEN.
5. If only a script action supports the credential header, use an in-cluster script with OPS_TOKEN injected as a secret. Disable shell tracing. Require the same response fields before continuing.

   ```sh
   set -eu
   curl --fail --silent --show-error \
     -H "x-ops-token: ${OPS_TOKEN}" -H 'Content-Type: application/json' \
     --data '{"on":true}' http://prasthan-api.prasthan.svc.cluster.local/v1/ops/fallback |
     jq -e '.fallbackActive == true and .via == "flagsmith"'
   ```

6. Add a Kubernetes action on the venue cluster to run the following for the crash-on-voice rehearsal. For the memory-limit rehearsal replace the first command with `kubectl -n prasthan set resources deploy/prasthan-voice --limits=memory=256Mi,cpu=500m`.

   ```sh
   kubectl -n prasthan set env deploy/prasthan-voice FAULT_MODE=none
   kubectl -n prasthan rollout status deploy/prasthan-voice --timeout=120s
   ```

7. On successful rollout, send **Voice deployment Ready. Verify a traveller reply before restoring live voice.** to the configured channel. With approval, repeat the flag action with false, read it back, then send one voice request. Record its STT, parser and TTS sources. On rollout failure leave fallback on and report the failed step.

## Rehearse and time it

From the checkout, select `kubectl config use-context k3d-prasthan` and verify the active context. On Node 22 use `node --env-file=.env scripts/demo-reset.mjs` followed by `node --env-file=.env scripts/demo-break.mjs` against the venue cluster. Run this only during the agreed rehearsal. Record the local times of fault injection, first cluster event, NudgeBee alert, approval, confirmed flag change, Ready rollout, and confirmed return to live voice in status/C.md. Capture a traveller check while voice is down.

- At injection, say that the voice fault is deliberate. Show the pod events and traveller result.
- At detection, show NudgeBee's actual finding and elapsed time. At approval, show the flag change and the traveller fallback.
- After recovery, show Ready replicas and the real voice response. If the workflow fails, use `node --env-file=.env scripts/demo-fix.mjs` (add `--oom` for the memory rehearsal), confirm both flag and rollout, and identify the manual steps in the demo.

NudgeBee documents [event workflows](https://docs.nudgebee.com/docs/features/workflow-builder/create-event-automation/) and [approval decisions](https://docs.nudgebee.com/docs/features/workflow-builder/workflow-operations-approvals/).
