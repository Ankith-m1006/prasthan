#!/usr/bin/env node
// "Special buses to Hubballi just opened": a rush of travellers opening the app at once.
// No dependencies (plain fetch, Node 22). Mix: 50% alerts, 25% config, 20% options, 5% voice (tiny silent WAV).
// Voice requests carry `x-load-test: 1`, so the api answers them with the MOCK Sarvam client (still through the
// voice service, so a voice crash under load is real) and the rush never spends Sarvam credits or hits rate limits.
// Usage: node infra/load/rush.mjs --url http://localhost:8080 --minutes 2 --connections 40

export function parseArgs(argv) {
  const out = { url: 'http://localhost:8080', minutes: 2, connections: 40, help: false };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--help' || a === '-h') out.help = true;
    else if (a === '--url') out.url = argv[++i];
    else if (a === '--minutes') out.minutes = Number(argv[++i]);
    else if (a === '--connections') out.connections = Number(argv[++i]);
  }
  return out;
}

/** 0.1 s of 16 kHz mono silence as a WAV file. */
export function silentWav(samples = 1600) {
  const b = Buffer.alloc(44 + samples * 2);
  b.write('RIFF', 0); b.writeUInt32LE(36 + samples * 2, 4); b.write('WAVE', 8); b.write('fmt ', 12);
  b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22); b.writeUInt32LE(16000, 24);
  b.writeUInt32LE(32000, 28); b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34); b.write('data', 36); b.writeUInt32LE(samples * 2, 40);
  return b;
}

const WAV = silentWav();

/** Picks a request by the mix, from a number in [0, 1). */
export function pick(r) {
  if (r < 0.5) return { name: 'alerts', path: '/v1/alerts?identity=trav-rush' };
  if (r < 0.75) return { name: 'config', path: '/v1/config' };
  if (r < 0.95) return { name: 'options', path: '/v1/options?routeId=BLR-HBL&date=2027-01-14&mode=bus' };
  return { name: 'voice', path: '/v1/voice/intent', voice: true };
}

function init(req) {
  const headers = { 'x-load-test': '1', 'x-prasthan-identity': `trav-rush-${Math.floor(Math.random() * 20000)}` };
  if (!req.voice) return { headers };
  const form = new FormData();
  form.append('audio', new Blob([WAV], { type: 'audio/wav' }), 'rush.wav');
  form.append('language', 'kn-IN');
  return { method: 'POST', headers, body: form };
}

export function percentile(sorted, p) {
  if (sorted.length === 0) return 0;
  return sorted[Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))];
}

function report(stats, label) {
  const lines = Object.entries(stats).map(([name, s]) => {
    const t = [...s.times].sort((a, b) => a - b);
    return `${name.padEnd(8)} n=${String(s.n).padStart(6)} err=${String(s.err).padStart(4)} p50=${percentile(t, 50)}ms p95=${percentile(t, 95)}ms p99=${percentile(t, 99)}ms`;
  });
  console.log(`--- ${label} ---\n${lines.join('\n')}`);
}

export async function rush({ url, minutes, connections }) {
  const stats = {};
  const end = Date.now() + minutes * 60_000;
  const worker = async () => {
    while (Date.now() < end) {
      const req = pick(Math.random());
      const s = (stats[req.name] ??= { n: 0, err: 0, times: [] });
      const t0 = Date.now();
      try {
        const res = await fetch(url + req.path, { ...init(req), signal: AbortSignal.timeout(10_000) });
        await res.arrayBuffer();
        if (!res.ok) s.err += 1;
      } catch {
        s.err += 1;
      }
      s.n += 1;
      s.times.push(Date.now() - t0);
    }
  };
  const timer = setInterval(() => report(stats, `${new Date().toLocaleTimeString()} (running)`), 10_000);
  await Promise.all(Array.from({ length: connections }, worker));
  clearInterval(timer);
  report(stats, 'final');
  return stats;
}

const isMain = process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/').split('/').pop());
if (isMain) {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log('node infra/load/rush.mjs --url http://localhost:8080 --minutes 2 --connections 40\n  Mix: 50% /v1/alerts, 25% /v1/config, 20% /v1/options, 5% /v1/voice/intent (x-load-test: 1 -> mock Sarvam).');
  } else {
    console.log(`rush: ${args.connections} connections for ${args.minutes} min against ${args.url}`);
    const stats = await rush(args);
    const errors = Object.values(stats).reduce((a, s) => a + s.err, 0);
    process.exitCode = errors > 0 ? 1 : 0;
  }
}
