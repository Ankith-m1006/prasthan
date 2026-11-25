// Vercel serverless entry: one Fastify app per warm instance, every path routed here (see ../vercel.json).
// Keys only from Vercel env vars: SARVAM_API_KEY -> live Sarvam, FLAGSMITH_SERVER_KEY -> live Flagsmith, else mock.
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../src/app.js';
import { loadConfig, logEnvPresence } from '../src/config.js';
import { wireAll } from '../src/wire.js';

process.env.CORS_ORIGINS ??= 'https://prasthan-ten.vercel.app';

let ready: Promise<FastifyInstance> | undefined;

async function start(): Promise<FastifyInstance> {
  const config = loadConfig();
  const { deps, extras } = await wireAll(config, (m) => console.warn(m));
  const app = await buildApp(deps, extras, { level: process.env.LOG_LEVEL ?? 'warn' });
  logEnvPresence((line) => console.log(line));
  console.log(`prasthan-api on vercel: sarvam=${config.sarvamMode} flagsmith=${config.flagsmithMode}`);
  await app.ready();
  return app;
}

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  ready ??= start().catch((err: unknown) => { ready = undefined; throw err; });
  const app = await ready;
  app.server.emit('request', req, res);
}
