// Entry point. ROLE=all (local dev), api, or voice. Keys come only from process.env (.env at the repo root).
import { config as loadDotenv } from 'dotenv';
import { join } from 'node:path';
import { REPO_ROOT } from './seed.js';
import { buildApp } from './app.js';
import { loadConfig, logEnvPresence } from './config.js';
import { wireAll } from './wire.js';

loadDotenv({ path: join(REPO_ROOT, '.env'), quiet: true });
const config = loadConfig();
const { deps, extras } = await wireAll(config);

const app = await buildApp(deps, extras, { level: process.env.LOG_LEVEL ?? 'info' });
logEnvPresence((line) => app.log.info(line));
app.log.info({ role: config.role, modes: { sarvam: config.sarvamMode, flagsmith: config.flagsmithMode }, fault: config.faultMode }, 'starting prasthan-api');
if (!config.opsToken) app.log.warn('OPS_TOKEN not set: /v1/ops/* only accepts calls from localhost');

app.listen({ port: config.port, host: '0.0.0.0' }).catch((err: unknown) => {
  app.log.error(err);
  process.exit(1);
});
