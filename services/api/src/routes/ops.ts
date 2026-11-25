// /health, /metrics, /v1/ops/* (fallback switch for the NudgeBee runbook, reset, state)
import type { FastifyInstance, FastifyRequest } from 'fastify';
import { timingSafeEqual } from 'node:crypto';
import type { HealthResponse, OpsFallbackResponse, OpsStateResponse } from '../../../../shared/contract/src/index.js';
import { modes } from '../config.js';
import { HttpError, type Deps } from '../deps.js';
import { resetStore } from '../store.js';

const LOCAL_IPS = new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1']);

function sameSecret(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export function checkOpsToken(deps: Deps, req: FastifyRequest): void {
  const sent = req.headers['x-ops-token'];
  const token = Array.isArray(sent) ? sent[0] : sent;
  if (deps.config.opsToken) {
    if (!token || !sameSecret(token, deps.config.opsToken)) throw new HttpError(401, 'unauthorized', 'Bad or missing x-ops-token');
    return;
  }
  if (!LOCAL_IPS.has(req.ip)) throw new HttpError(401, 'unauthorized', 'OPS_TOKEN is not set; ops calls allowed from localhost only');
  req.log.warn('OPS_TOKEN not set: allowing ops call from localhost');
}

export default async function opsRoutes(app: FastifyInstance, deps: Deps): Promise<void> {
  app.get('/health', async (): Promise<HealthResponse> => ({ ok: true, role: deps.config.role, version: '0.1.0', modes: modes(deps.config) }));

  app.get('/metrics', async (_req, reply) => {
    const env = await deps.flags.getEnvFlags();
    deps.metrics.fallbackActive.set(env.voice_fallback_offline ? 1 : 0);
    reply.header('content-type', deps.metrics.registry.contentType);
    return deps.metrics.registry.metrics();
  });

  app.post('/v1/ops/fallback', async (req): Promise<OpsFallbackResponse> => {
    checkOpsToken(deps, req);
    const on = (req.body as { on?: unknown } | null)?.on;
    if (typeof on !== 'boolean') throw new HttpError(400, 'bad_request', 'body {on: boolean} is required');
    const via = await deps.ops.setFallback(on);
    deps.metrics.fallbackActive.set(on ? 1 : 0);
    req.log.info({ on, via }, 'ops fallback switched');
    return { fallbackActive: on, via };
  });

  app.post('/v1/ops/reset', async (req) => {
    checkOpsToken(deps, req);
    resetStore(deps.store);
    return { ok: true };
  });

  app.get('/v1/ops/state', async (): Promise<OpsStateResponse> => {
    const env = await deps.flags.getEnvFlags();
    const out: OpsStateResponse = { fallbackActive: env.voice_fallback_offline, voiceHealthy: deps.store.voiceHealthy };
    if (deps.store.lastVoiceError) out.lastVoiceError = deps.store.lastVoiceError;
    return out;
  });
}
