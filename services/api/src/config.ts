// Reads env once. Never log values: logEnvPresence() prints NAME: SET|MISSING only.
import type { ModeState } from '../../../shared/contract/src/index.js';

export type Role = 'all' | 'api' | 'voice';
export type FaultMode = 'none' | 'crash_on_voice' | 'slow_voice' | 'bad_model';

export interface Config {
  port: number;
  role: Role;
  mockAll: boolean;
  sarvamMode: 'live' | 'mock';
  flagsmithMode: 'live' | 'mock';
  contextDevMode: 'live' | 'off';
  opsToken: string;
  voiceUrl: string;
  demoToday: string;
  faultMode: FaultMode;
  seedDir?: string;
  storeSnapshot: boolean;
}

type Env = Record<string, string | undefined>;

const SECRET_NAMES = [
  'SARVAM_API_KEY', 'FLAGSMITH_SERVER_KEY', 'FLAGSMITH_ADMIN_API_KEY', 'FLAGSMITH_ENVIRONMENT_API_KEY',
  'FLAGSMITH_PROJECT_ID', 'OPS_TOKEN', 'CONTEXT_DEV_API_KEY',
];

export function loadConfig(env: Env = process.env): Config {
  const mockAll = env.MOCK_ALL === '1';
  const sarvamLive = !mockAll && env.SARVAM_MODE !== 'mock' && Boolean(env.SARVAM_API_KEY);
  const flagsLive = !mockAll && env.FLAGSMITH_MODE !== 'mock' && Boolean(env.FLAGSMITH_SERVER_KEY);
  const ctxLive = !mockAll && env.CONTEXT_DEV_MODE === 'live' && Boolean(env.CONTEXT_DEV_API_KEY);
  return {
    port: Number(env.PORT ?? 8787),
    role: (['all', 'api', 'voice'].includes(env.ROLE ?? '') ? env.ROLE : 'all') as Role,
    mockAll,
    sarvamMode: sarvamLive ? 'live' : 'mock',
    flagsmithMode: flagsLive ? 'live' : 'mock',
    contextDevMode: ctxLive ? 'live' : 'off',
    opsToken: env.OPS_TOKEN ?? '',
    voiceUrl: env.VOICE_URL ?? 'http://localhost:8787',
    demoToday: env.DEMO_TODAY ?? '2027-01-05',
    faultMode: (['crash_on_voice', 'slow_voice', 'bad_model'].includes(env.FAULT_MODE ?? '') ? env.FAULT_MODE : 'none') as FaultMode,
    seedDir: env.SEED_DIR,
    storeSnapshot: env.STORE_SNAPSHOT === '1',
  };
}

export function modes(c: Config): { sarvam: ModeState; flagsmith: ModeState; contextDev: ModeState } {
  return { sarvam: c.sarvamMode, flagsmith: c.flagsmithMode, contextDev: c.contextDevMode };
}

export function envPresence(env: Env = process.env): string[] {
  return SECRET_NAMES.map((n) => `${n}: ${env[n] ? 'SET' : 'MISSING'}`);
}

export function logEnvPresence(log: (line: string) => void, env: Env = process.env): void {
  for (const line of envPresence(env)) log(line);
}
