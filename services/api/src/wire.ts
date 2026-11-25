// Wires real deps from env: Sarvam live/mock, voice gateway by ROLE, Flagsmith live/mock.
import type { FastifyInstance } from 'fastify';
import { memoryOps, type Extra } from './app.js';
import type { Config } from './config.js';
import type { Deps, OpsSwitch } from './deps.js';
import { loadFlagDefs, type FlagsProvider } from './flags/defaults.js';
import { MockFlagsProvider } from './flags/mock.js';
import { mockChat } from './intent/llm.js';
import { createMetrics } from './metrics.js';
import { internalVoiceRoutes, faultState } from './routes/internal-voice.js';
import voiceRoutes from './routes/voice.js';
import type { SarvamClient } from './sarvam/client.js';
import { LiveSarvamClient } from './sarvam/live.js';
import { MockSarvamClient } from './sarvam/mock.js';
import { loadSeed, type Seed } from './seed.js';
import { createStore, demoClock } from './store.js';
import { HttpGateway, InProcessGateway, type VoiceGateway } from './voice/gateway.js';
import type { VoiceDeps } from './voice/pipeline.js';

export function sarvamClients(config: Config, seed: Seed, env = process.env): { live: SarvamClient; mock: SarvamClient } {
  const world = { routes: seed.routes, festivals: seed.festivals };
  const mock = new MockSarvamClient(seed.utterances, mockChat(world, config.demoToday));
  const live = config.sarvamMode === 'live' && env.SARVAM_API_KEY
    ? new LiveSarvamClient({ apiKey: env.SARVAM_API_KEY, badModel: config.faultMode === 'bad_model' })
    : mock;
  return { live, mock };
}

export interface Wired { deps: VoiceDeps; extras: Extra[] }

export function wireVoice(base: Deps, live: SarvamClient, mock: SarvamClient): Wired {
  const inproc = new InProcessGateway(live, mock, { routes: base.seed.routes, festivals: base.seed.festivals });
  const voice: VoiceGateway = base.config.role === 'api' ? new HttpGateway(base.config.voiceUrl) : inproc;
  const deps: VoiceDeps = { ...base, voice };
  const extras: Extra[] = [];
  if (base.config.role !== 'voice') extras.push((app: FastifyInstance) => voiceRoutes(app, deps));
  if (base.config.role !== 'api') extras.push(internalVoiceRoutes(inproc, faultState(base.config.faultMode)));
  return { deps, extras };
}

export async function wireAll(config: Config, makeFlags?: (seed: Seed) => Promise<{ flags: FlagsProvider; ops: OpsSwitch }>): Promise<Wired> {
  const seed = loadSeed(config.seedDir);
  const mockFlags = new MockFlagsProvider(loadFlagDefs());
  const fl = makeFlags ? await makeFlags(seed) : { flags: mockFlags, ops: memoryOps(mockFlags) };
  const base: Deps = { config, seed, store: createStore(), flags: fl.flags, ops: fl.ops, metrics: createMetrics(), clock: demoClock(config.demoToday) };
  const { live, mock } = sarvamClients(config, seed);
  return wireVoice(base, live, mock);
}
