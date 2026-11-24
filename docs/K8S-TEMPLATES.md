# Kubernetes templates (text only; Session C writes the real files in infra/k8s/ at hack time)

These are templates in a doc, not committed manifests, because the rules say main work starts at 11:30. Values are placeholders. Secrets come from `kubectl create secret generic prasthan-env --from-env-file=.env -n prasthan` (never a YAML with values).

## Cluster (laptop)
```
k3d cluster create prasthan --agents 1 -p "8080:80@loadbalancer"
kubectl create namespace prasthan
# image: build locally and import (no registry needed, good on bad Wi-Fi)
docker build -t prasthan:dev -f infra/docker/api.Dockerfile .
k3d image import prasthan:dev -c prasthan
```

## Deployment: prasthan-voice (the pod we break on stage)
```yaml
apiVersion: apps/v1
kind: Deployment
metadata: { name: prasthan-voice, namespace: prasthan, labels: { app: prasthan-voice } }
spec:
  replicas: 1
  selector: { matchLabels: { app: prasthan-voice } }
  template:
    metadata:
      labels: { app: prasthan-voice }
      annotations: { prometheus.io/scrape: "true", prometheus.io/port: "8787", prometheus.io/path: "/metrics" }
    spec:
      containers:
        - name: voice
          image: prasthan:dev
          imagePullPolicy: IfNotPresent
          env:
            - { name: ROLE, value: voice }
            - { name: FAULT_MODE, value: none }
          envFrom: [ { secretRef: { name: prasthan-env } } ]
          ports: [ { containerPort: 8787 } ]
          resources:
            requests: { cpu: 100m, memory: 128Mi }
            limits: { cpu: 500m, memory: 256Mi }
          readinessProbe: { httpGet: { path: /health, port: 8787 }, periodSeconds: 5 }
          livenessProbe: { httpGet: { path: /health, port: 8787 }, periodSeconds: 10, failureThreshold: 3 }
```

## Deployment: prasthan-api
Same as above with `name: prasthan-api`, `ROLE=api`, `VOICE_URL=http://prasthan-voice:8787`, `replicas: 2`.

## Services + ingress
```yaml
apiVersion: v1
kind: Service
metadata: { name: prasthan-voice, namespace: prasthan }
spec: { selector: { app: prasthan-voice }, ports: [ { port: 8787, targetPort: 8787 } ] }
---
apiVersion: v1
kind: Service
metadata: { name: prasthan-api, namespace: prasthan }
spec: { selector: { app: prasthan-api }, ports: [ { port: 80, targetPort: 8787 } ] }
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata: { name: prasthan, namespace: prasthan }
spec:
  rules:
    - http:
        paths:
          - { path: /, pathType: Prefix, backend: { service: { name: prasthan-api, port: { number: 80 } } } }
```
k3d ships Traefik, so `http://localhost:8080/health` reaches the api.

## Break / fix (scripts/demo-break.mjs, scripts/demo-fix.mjs; Node, so they run on Windows too)
- Break option 1 (preferred): `kubectl -n prasthan set env deploy/prasthan-voice FAULT_MODE=crash_on_voice` then run the rush (`node infra/load/rush.mjs --minutes 2`). Voice pod exits on voice requests -> CrashLoopBackOff.
- Break option 2: lower the voice memory limit to 64Mi so it OOMs under the rush.
- Fix (what the runbook does): Flagsmith `voice_fallback_offline=true` (Admin API or `POST /v1/ops/fallback`), then `kubectl -n prasthan set env deploy/prasthan-voice FAULT_MODE=none` (or `rollout undo`), wait ready, then flag back off.

## Prometheus
If NudgeBee's agent needs Prometheus and does not bring it [UNVERIFIED]:
```
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm install prom prometheus-community/prometheus -n monitoring --create-namespace \
  --set alertmanager.enabled=false --set prometheus-pushgateway.enabled=false
```
Optional alert rule (PrometheusRule or plain rules file): `increase(kube_pod_container_status_restarts_total{namespace="prasthan"}[2m]) > 2`.
