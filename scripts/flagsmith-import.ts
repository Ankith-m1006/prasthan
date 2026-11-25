// Verified against https://api.flagsmith.com/api/v1/swagger.json
// GET/POST projects/{project_pk}/{features,segments}/
// GET environments/{api_key}/ ; GET features/feature-segments/?environment=ID&feature=ID
// POST environments/{environment_api_key}/features/{feature_pk}/create-segment-override/
import { config, feature, segment, override } from './flag-payloads.js'
import { localEnv } from './local-env.js'

const base = 'https://api.flagsmith.com/api/v1/'
type Named = { id: number; name: string }
type Page<T> = { results: T[]; next: string | null }
class AdminError extends Error {}
function client(key: string, send: typeof fetch = fetch) {
  async function request<T>(path: string, body?: unknown): Promise<T> {
    const url = new URL(path, base)
    if (!url.href.startsWith(base)) throw new AdminError('Unexpected pagination URL')
    const attempts = body === undefined ? 2 : 1
    for (let i = 1; i <= attempts; i++) {
      try {
        const response = await send(url, {
          method: body === undefined ? 'GET' : 'POST', redirect: 'error',
          headers: { Authorization: 'Api-Key ' + key, 'Content-Type': 'application/json' },
          body: JSON.stringify(body), signal: AbortSignal.timeout(12000)
        })
        if (response.ok) return await response.json() as T
        if (i === attempts || (response.status < 500 && response.status !== 429))
          throw new AdminError('HTTP ' + response.status)
      } catch (error) {
        if (error instanceof AdminError) throw error
        if (i === attempts) throw new AdminError('Request or response failed')
      }
      await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 300))
    }
    throw new AdminError('Request failed')
  }
  async function list<T>(path: string) {
    const rows: T[] = []
    const seen = new Set<string>()
    while (path) {
      if (seen.has(path)) throw new AdminError('Repeated pagination URL')
      seen.add(path)
      const page = await request<Page<T> | T[]>(path)
      if (Array.isArray(page)) return rows.concat(page)
      rows.push(...page.results)
      path = page.next ?? ''
    }
    return rows
  }
  return { list, request }
}
const report: { item: string; result: string; reason: string }[] = []
async function record(item: string, work: () => Promise<string>) {
  try { report.push({ item, result: await work(), reason: '' }) }
  catch (e) { report.push({ item, result: 'failed', reason: e instanceof AdminError ? e.message : 'Unexpected response' }) }
}

async function run() {
  const env = localEnv()
  const key = env.FLAGSMITH_ADMIN_API_KEY
  const project = env.FLAGSMITH_PROJECT_ID
  const environment = env.FLAGSMITH_ENVIRONMENT_API_KEY
  if (!key || !/^\d+$/.test(project ?? '') || !environment)
    throw new AdminError('Check FLAGSMITH_ADMIN_API_KEY, FLAGSMITH_PROJECT_ID and FLAGSMITH_ENVIRONMENT_API_KEY in .env')
  const api = client(key)
  const envPath = 'environments/' + encodeURIComponent(environment) + '/'
  const target = await api.request<{ id: number; project: number }>(envPath)
  if (target.project !== Number(project) || !Number.isInteger(target.id))
    throw new AdminError('Environment and project do not match')
  async function ensureNamed(path: string, items: { name: string }[]) {
    const ids = new Map<string, number>()
    let existing: Named[] | undefined
    for (const item of items) await record(item.name, async () => {
      existing ??= await api.list<Named>(path)
      const found = existing.find(row => row.name === item.name)
      const obj = found ?? await api.request<Named>(path, item)
      if (!Number.isInteger(obj.id)) throw new AdminError('Missing resource ID')
      ids.set(item.name, obj.id)
      return found ? 'existed' : 'created'
    })
    return ids
  }
  const prefix = 'projects/' + project + '/'
  const flags = await ensureNamed(prefix + 'features/', config.flags.map(feature))
  const segments = await ensureNamed(prefix + 'segments/', config.segments.map(segment))
  for (const f of config.flags) for (const item of f.segmentOverrides ?? []) {
    await record(f.name + ' / ' + item.segment, async () => {
      const fid = flags.get(f.name), sid = segments.get(item.segment)
      if (!fid || !sid) throw new AdminError('Create the feature and segment first')
      const path = 'features/feature-segments/?environment=' + target.id + '&feature=' + fid
      const existing = await api.list<{ segment: number }>(path)
      if (existing.some(row => row.segment === sid)) return 'existed'
      await api.request(envPath + 'features/' + fid + '/create-segment-override/', override(f, item, sid))
      return 'created'
    })
  }
  console.table(report)
  if (report.some(r => r.result === 'failed')) {
    console.error('Re-run to reconcile, then create remaining failed items in the dashboard from config/flagsmith/flags.json.')
    process.exitCode = 1
  }
}
if (process.argv.includes('--dry-run')) {
  for (const f of config.flags) console.log('Feature', JSON.stringify(feature(f)))
  for (const s of config.segments) console.log('Segment', JSON.stringify(segment(s)))
  for (const f of config.flags) for (const o of f.segmentOverrides ?? [])
    console.log('Override', f.name, o.segment)
} else {
  run().catch(e => {
    console.error(e instanceof AdminError ? e.message : 'Import failed before completion')
    process.exitCode = 1
  })
}
