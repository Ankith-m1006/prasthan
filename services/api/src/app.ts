// Builds the Fastify app from injected deps. index.ts wires real deps; tests wire their own.
import Fastify, { type FastifyError, type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import { loadConfig, type Config } from './config.js';
import { HttpError, type Deps, type OpsSwitch } from './deps.js';
import { loadFlagDefs } from './flags/defaults.js';
import { MockFlagsProvider } from './flags/mock.js';
import { createMetrics } from './metrics.js';
import { loadSeed } from './seed.js';
import { createStore, demoClock } from './store.js';
import configRoutes from './routes/config.js';
import optionsRoutes from './routes/options.js';
import tripRoutes from './routes/trips.js';
import partnerRoutes from './routes/partners.js';
import giftRoutes from './routes/gifts.js';
import opsRoutes from './routes/ops.js';

export type Extra = (app: FastifyInstance, deps: Deps) => Promise<void>;

export function memoryOps(flags: MockFlagsProvider): OpsSwitch {
  return { setFallback: async (on) => { flags.setOverride('voice_fallback_offline', { enabled: on }); return 'memory'; } };
}

export function mockDeps(config: Config = loadConfig({ MOCK_ALL: '1' })): Deps {
  const flags = new MockFlagsProvider(loadFlagDefs());
  return {
    config, seed: loadSeed(config.seedDir), store: createStore(), flags, ops: memoryOps(flags),
    metrics: createMetrics(), clock: demoClock(config.demoToday),
  };
}

function routeLabel(url: string | undefined): string {
  return url ?? 'unknown';
}

/** CORS_ORIGINS=comma list (e.g. the hosted web app) limits CORS; unset = reflect any origin (local dev). */
export function corsOrigin(env = process.env): true | Array<string | RegExp> {
  const list = (env.CORS_ORIGINS ?? '').split(',').map((s) => s.trim()).filter(Boolean);
  return list.length ? [...list, /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/] : true;
}

export async function buildApp(deps: Deps, extras: Extra[] = [], logger: boolean | object = false): Promise<FastifyInstance> {
  const app = Fastify({ logger, bodyLimit: 1_000_000 });
  await app.register(cors, { origin: corsOrigin() });
  await app.register(multipart, { limits: { fileSize: 2 * 1024 * 1024, files: 1, fields: 5 } });

  app.addHook('onResponse', async (req, reply) => {
    const route = routeLabel(req.routeOptions.url);
    deps.metrics.requests.inc({ route, status: String(reply.statusCode) });
    deps.metrics.duration.observe({ route }, reply.elapsedTime / 1000);
  });

  app.setErrorHandler((err: FastifyError | HttpError, req, reply) => {
    if (err instanceof HttpError) return reply.status(err.status).send({ error: { code: err.code, message: err.message } });
    const status = err.statusCode && err.statusCode >= 400 && err.statusCode < 500 ? err.statusCode : 500;
    if (status === 500) req.log.error({ code: err.code, msg: err.message }, 'unhandled error');
    const message = status === 500 ? 'Something went wrong' : err.message;
    return reply.status(status).send({ error: { code: err.code ?? (status === 500 ? 'internal' : 'bad_request'), message } });
  });
  app.setNotFoundHandler((_req, reply) => reply.status(404).send({ error: { code: 'not_found', message: 'No such route' } }));

  for (const plugin of [opsRoutes, configRoutes, optionsRoutes, tripRoutes, partnerRoutes, giftRoutes, ...extras]) {
    await plugin(app, deps);
  }
  return app;
}
