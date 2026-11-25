// Shared helpers for the stage scripts (demo-break / demo-fix / demo-reset). No dependencies.
// The ops token comes only from env OPS_TOKEN and is never printed.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

export const NS = process.env.PRASTHAN_NS ?? 'prasthan';
export const API = (process.env.PRASTHAN_URL ?? 'http://localhost:8080').replace(/\/$/, '');

export function flag(argv, name) {
  return argv.includes(name);
}

export function stamp(msg) {
  console.log(`[${new Date().toLocaleTimeString('en-IN', { hour12: false })}] ${msg}`);
}

/** Prints then runs kubectl. Returns stdout ('' on failure, so the timeline keeps going). */
export function kubectl(args, { quiet = false } = {}) {
  if (!quiet) stamp(`$ kubectl ${args.join(' ')}`);
  try {
    return execFileSync('kubectl', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (err) {
    if (!quiet) stamp(`kubectl failed: ${String(err.stderr ?? err.message).split('\n')[0]}`);
    return '';
  }
}

export async function ops(path, body) {
  const headers = body ? { 'content-type': 'application/json' } : {};
  if (process.env.OPS_TOKEN) headers['x-ops-token'] = process.env.OPS_TOKEN;
  stamp(`POST ${API}${path} ${body ? JSON.stringify(body) : ''} (x-ops-token: ${process.env.OPS_TOKEN ? 'SET' : 'MISSING'})`);
  try {
    const res = await fetch(API + path, { method: 'POST', headers, body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(8000) });
    const text = await res.text();
    stamp(`-> ${res.status} ${text.slice(0, 160)}`);
    return res.ok;
  } catch (err) {
    stamp(`-> failed: ${err.message}`);
    return false;
  }
}

const PARSE = readFileSync(new URL('../shared/contract/examples/intent-parse.request.json', import.meta.url), 'utf8');

/** "Is anyone stranded?" One typed traveller request; OK = HTTP 200 with an intent. */
export async function travellerCheck() {
  try {
    const res = await fetch(`${API}/v1/intent/parse`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: PARSE, signal: AbortSignal.timeout(9000) });
    const body = await res.json();
    const ok = res.ok && Boolean(body.intent?.routeId);
    return ok ? `traveller answers: OK (${body.source?.llm ?? '?'} parser=${body.intent.parser})` : `traveller answers: FAIL (${res.status})`;
  } catch (err) {
    return `traveller answers: FAIL (${err.name === 'TimeoutError' ? 'timeout' : err.message})`;
  }
}

export function voicePods() {
  const out = kubectl(['-n', NS, 'get', 'pods', '-l', 'app=prasthan-voice', '--no-headers'], { quiet: true }).trim();
  return out ? out.split('\n').map((l) => l.replace(/\s+/g, ' ')).join(' | ') : 'voice pods: (kubectl unavailable)';
}
