import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../../', import.meta.url))
const context = 'k3d-prasthan'
const image = 'prasthan:dev'
const workloads = ['prasthan-voice', 'prasthan-api']

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: root, windowsHide: true, encoding: 'utf8',
    stdio: options.private ? 'pipe' : ['ignore', 'pipe', 'inherit'],
    input: options.input
  })
  if (result.error?.code === 'ENOENT') throw new Error(command + ' is missing from PATH')
  if (result.error || result.status !== 0) throw new Error(command + ' command failed')
  return result.stdout
}

const kube = (...args) => run('kubectl', ['--context', context, ...args])

function build() {
  run('docker', ['build', '-t', image, '-f', 'infra/docker/api.Dockerfile', '.'])
  run('k3d', ['image', 'import', image, '-c', 'prasthan'])
}

function secret() {
  const manifest = run('kubectl', ['--context', context, '-n', 'prasthan', 'create',
    'secret', 'generic', 'prasthan-env', '--from-env-file=.env', '--dry-run=client', '-o', 'json'], { private: true })
  run('kubectl', ['--context', context, 'apply', '--server-side', '--field-manager=prasthan-bootstrap', '-f', '-'],
    { input: manifest, private: true })
}

async function ready() {
  for (const name of workloads) {
    console.log(kube('-n', 'prasthan', 'rollout', 'status', 'deployment/' + name, '--timeout=180s').trim())
  }
  for (let i = 0; i < 15; i++) {
    try {
      const r = await fetch('http://localhost:8080/health', { signal: AbortSignal.timeout(3000) })
      const h = await r.json()
      if (r.ok && h.ok && h.role === 'api') return console.log('API health verified on localhost:8080')
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 1000))
  }
  throw new Error('API ingress health check failed')
}

export async function deploy(rebuildOnly) {
  run('docker', ['info', '--format', '{{.ServerVersion}}'])
  const clusters = JSON.parse(run('k3d', ['cluster', 'list', '-o', 'json']))
  if (!clusters.some(c => c.name === 'prasthan')) {
    if (rebuildOnly) throw new Error('Run k3d-up.mjs first')
    run('k3d', ['cluster', 'create', 'prasthan', '--agents', '1', '-p', '8080:80@loadbalancer'])
  }
  build()
  if (!rebuildOnly) {
    kube('apply', '-f', 'infra/k8s/namespace.yaml')
    secret()
    for (const name of ['services', 'voice-deployment', 'api-deployment', 'ingress']) {
      kube('apply', '-f', 'infra/k8s/' + name + '.yaml')
    }
  }
  for (const name of workloads) kube('-n', 'prasthan', 'rollout', 'restart', 'deployment/' + name)
  await ready()
  if (rebuildOnly) return
  const pods = JSON.parse(kube('get', 'pods', '-A', '-o', 'json'))
  if (!pods.items.some(p => /prometheus-server|prometheus-operated|^prometheus-.*-\d+$/.test(p.metadata.name))) {
    const args = ['upgrade', '--install', 'prom', 'prometheus', '--repo', 'https://prometheus-community.github.io/helm-charts',
      '--kube-context', context, '-n', 'monitoring', '--create-namespace',
      '--set', 'alertmanager.enabled=false', '--set', 'prometheus-pushgateway.enabled=false', '--wait']
    if (spawnSync('helm', ['version'], { windowsHide: true }).error?.code === 'ENOENT')
      console.log('Monitoring setup: helm ' + args.join(' '))
    else run('helm', args)
  }
}
