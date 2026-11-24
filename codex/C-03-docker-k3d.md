# C-03: Docker image + k3d deploy (Session C, 45 min; needs A-01 on main)

## Paste into Codex

````
Session C. Read AGENTS.md, docs/K8S-TEMPLATES.md, docs/ARCHITECTURE.md section 2. `git merge main` (must include A-01; if not, do the Dockerfile with a placeholder and wait).

GOAL: the api runs on the local k3d cluster as two deployments (prasthan-api, prasthan-voice) with /metrics scraped, so NudgeBee has a real app to watch.

FILES YOU OWN: infra/docker/**, infra/k8s/** (incl. the deploy helper scripts below), status/C.md. Do not edit scripts/** in this phase (in the 2-session split another session owns it).

STEPS
1. infra/docker/api.Dockerfile (multi-stage, node:22-slim): copy shared/contract, services/api, seed/, config/flagsmith/flags.json, apps/mobile/assets/audio/ (if it exists); npm ci --omit=dev in services/api; keep the repo layout (/app/shared/contract, /app/services/api, /app/seed, /app/config) so relative paths work; set SEED_DIR=/app/seed; run as non-root; EXPOSE 8787; CMD ["npm","--prefix","services/api","start"] (tsx is a runtime dependency by design, see P0). .dockerignore excludes node_modules, .env, apps/mobile (except assets/audio), .git.
2. infra/k8s/: namespace.yaml, voice-deployment.yaml, api-deployment.yaml, services.yaml, ingress.yaml from docs/K8S-TEMPLATES.md. Real resource limits. Probes on /health. Prometheus annotations. No secrets in YAML.
3. infra/k8s/k3d-up.mjs: create cluster if missing (k3d cluster create prasthan --agents 1 -p "8080:80@loadbalancer"), build image, k3d image import, create namespace, create secret from ../.env (kubectl create secret generic prasthan-env --from-env-file=.env --dry-run=client -o yaml | kubectl apply -f -; never print the YAML), apply manifests, wait for rollout, curl http://localhost:8080/health.
4. infra/k8s/k3d-redeploy.mjs: rebuild + import + rollout restart (for code changes during the day).
5. If Prometheus is not in the cluster (kubectl get pods -A | grep prometheus), print the helm command from docs/K8S-TEMPLATES.md for Ankith to run (or run it if helm exists).

ACCEPTANCE CHECKS
- node infra/k8s/k3d-up.mjs -> both deployments Ready
- curl -s http://localhost:8080/health -> ok:true role api
- curl -s -X POST http://localhost:8080/v1/intent/parse -H "content-type: application/json" -d @shared/contract/examples/intent-parse.request.json -> intent (goes api -> voice service)
- kubectl -n prasthan get pods -o wide  (paste)
- docker image size < 400 MB (paste `docker images prasthan`)

FINISH: status/C.md (cluster up? URLs), commit "C-03: Docker image + k3d manifests", Merge steps. Report.
````

## If something goes wrong
- Laptop RAM too low: one replica each; skip Prometheus server if NudgeBee doesn't need it.
- Image build slow on venue Wi-Fi: build once, then only `k3d-redeploy` on code changes; use the phone hotspot for the first `npm ci`.
