// INTERNAL voice routes (ROLE=voice, or ROLE=all for testing). Only the api calls them.
// FAULT_MODE is a DEMO TOOL for the NudgeBee moment (off by default):
//   crash_on_voice: the process exits on the 3rd /voice/* request (a crash loop under load in k8s)
//   slow_voice:     every /voice/* call waits 9 s (the api's 8 s timeout trips)
//   bad_model:      live STT uses a wrong model name, so Sarvam answers 4xx
import type { FastifyInstance } from 'fastify';
import type { Lang } from '../../../../shared/contract/src/index.js';
import type { FaultMode } from '../config.js';
import type { ParseInput } from '../intent/rules.js';
import type { VoiceGateway } from '../voice/gateway.js';

export interface FaultState { mode: FaultMode; count: number; exit: (code: number) => void; sleep: (ms: number) => Promise<void> }

export function faultState(mode: FaultMode): FaultState {
  return { mode, count: 0, exit: (c) => process.exit(c), sleep: (ms) => new Promise((r) => setTimeout(r, ms)) };
}

export async function applyFault(f: FaultState): Promise<void> {
  f.count += 1;
  if (f.mode === 'crash_on_voice' && f.count >= 3) f.exit(1);
  if (f.mode === 'slow_voice') await f.sleep(9000);
}

export function internalVoiceRoutes(inproc: VoiceGateway, fault: FaultState) {
  return async (app: FastifyInstance): Promise<void> => {
    app.addHook('preHandler', async (req) => {
      if (req.url.startsWith('/voice/')) await applyFault(fault);
    });
    const lt = (h: unknown) => h === '1';

    app.post('/voice/stt', async (req) => {
      const b = req.body as { audioBase64: string; mime: string; sttMode: string; lang?: Lang; nameHint?: string };
      return inproc.stt(Buffer.from(b.audioBase64 ?? '', 'base64'), b.mime, b.sttMode, b.lang, b.nameHint, lt(req.headers['x-load-test']));
    });
    app.post('/voice/llm', async (req) => inproc.parse(req.body as ParseInput, lt(req.headers['x-load-test'])));
    app.post('/voice/tts', async (req) => {
      const b = req.body as { text: string; lang: Lang; model: string; speaker: string };
      return inproc.tts(b.text, b.lang, b.model, b.speaker, lt(req.headers['x-load-test']));
    });
    app.post('/voice/translate', async (req) => {
      const b = req.body as { text: string; from: Lang; to: Lang };
      return { text: await inproc.translate(b.text, b.from, b.to, lt(req.headers['x-load-test'])) };
    });
  };
}
