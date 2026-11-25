// Entry point. ROLE=all (local dev), api, or voice. Keys come only from process.env (.env at the repo root).
import { config as loadDotenv } from 'dotenv';
import { join } from 'node:path';
import { REPO_ROOT } from './seed.js';
loadDotenv({ path: join(REPO_ROOT, '.env'), quiet: true });
import { buildApp, memoryOps } from './app.js';
import { loadConfig, logEnvPresence } from './config.js';
import { loadFlagDefs } from './flags/defaults.js';
import { MockFlagsProvider } from './flags/mock.js';
import { createMetrics } from './metrics.js';
import { loadSeed } from './seed.js';
import { createStore, demoClock } from './store.js';

const config = loadConfig();
const flags = new MockFlagsProvider(loadFlagDefs());
const deps = {
  config, seed: loadSeed(config.seedDir), store: createStore(), flags, ops: memoryOps(flags),
  metrics: createMetrics(), clock: demoClock(config.demoToday),
};

const app = await buildApp(deps, [], { level: process.env.LOG_LEVEL ?? 'info' });
logEnvPresence((line) => app.log.info(line));
app.log.info({ role: config.role, modes: { sarvam: config.sarvamMode, flagsmith: config.flagsmithMode } }, 'starting prasthan-api');
if (!config.opsToken) app.log.warn('OPS_TOKEN not set: /v1/ops/* only accepts calls from localhost');

app.listen({ port: config.port, host: '0.0.0.0' }).catch((err: unknown) => {
  app.log.error(err);
  process.exit(1);
});
