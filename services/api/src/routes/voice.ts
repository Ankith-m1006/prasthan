// Public voice routes: POST /v1/voice/intent (multipart), /v1/intent/parse, /v1/tts, GET /v1/audio/:key.
import type { FastifyInstance, FastifyRequest } from 'fastify';
import { createReadStream, existsSync } from 'node:fs';
import { join, basename } from 'node:path';
import type { IntentParseRequest, Lang, TripIntent, TtsRequest, TtsResponse } from '../../../../shared/contract/src/index.js';
import { HttpError, identityOf, traitsFor } from '../deps.js';
import { LANGS } from '../i18n/templates.js';
import { AUDIO_DIR, audioTurn, textTurn, useFallback, type TurnInput, type VoiceDeps } from '../voice/pipeline.js';

const AUDIO_MIMES = ['audio/webm', 'audio/ogg', 'audio/mp4', 'audio/m4a', 'audio/x-m4a', 'audio/aac', 'audio/wav', 'audio/x-wav', 'audio/wave', 'audio/mpeg', 'audio/mp3'];

/** 'audio/webm;codecs=opus' -> 'audio/webm' (browsers add codec parameters). */
export function cleanMime(m: string | undefined): string {
  return (m ?? '').split(';')[0].trim().toLowerCase();
}

function lang(v: unknown, fallback: Lang = 'kn-IN'): Lang {
  return LANGS.includes(v as Lang) ? (v as Lang) : fallback;
}

function parseContext(v: unknown): TripIntent | null {
  if (typeof v === 'object' && v !== null) return v as TripIntent;
  if (typeof v !== 'string' || !v) return null;
  try { return JSON.parse(v) as TripIntent; } catch { return null; }
}

function turn(deps: VoiceDeps, req: FastifyRequest, language: Lang, refDate: unknown, context: unknown): TurnInput {
  return {
    identity: identityOf(req.headers['x-prasthan-identity']), language,
    refDate: typeof refDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(refDate) ? refDate : deps.config.demoToday,
    context: parseContext(context), loadTest: req.headers['x-load-test'] === '1',
  };
}

async function readMultipart(req: FastifyRequest): Promise<{ audio: Buffer; mime: string; name?: string; fields: Record<string, string> }> {
  const fields: Record<string, string> = {};
  let audio: Buffer = Buffer.alloc(0);
  let mime = 'audio/wav';
  let name: string | undefined;
  for await (const part of req.parts()) {
    if (part.type === 'file') {
      audio = await part.toBuffer();
      mime = part.mimetype;
      name = part.filename;
    } else if (typeof part.value === 'string') fields[part.fieldname] = part.value;
  }
  return { audio, mime, name, fields };
}

export default async function voiceRoutes(app: FastifyInstance, deps: VoiceDeps): Promise<void> {
  const flagsFor = (req: FastifyRequest) => {
    const id = identityOf(req.headers['x-prasthan-identity']);
    return deps.flags.getFlags(id, traitsFor(deps, id));
  };

  app.post('/v1/voice/intent', async (req) => {
    if (!req.isMultipart()) throw new HttpError(400, 'bad_request', 'multipart with an audio file is required');
    let data;
    try { data = await readMultipart(req); } catch { throw new HttpError(413, 'too_large', 'Audio must be under 2 MB (about 20 s)'); }
    const flags = await flagsFor(req);
    const language = lang(data.fields.language, lang(traitsFor(deps, identityOf(req.headers['x-prasthan-identity'])).language));
    const bare = cleanMime(data.mime);
    const mime = AUDIO_MIMES.includes(bare) ? bare : 'audio/wav';
    return audioTurn(deps, flags, data.audio, mime, data.name, turn(deps, req, language, data.fields.refDate, data.fields.context));
  });

  app.post('/v1/intent/parse', async (req) => {
    const b = (req.body ?? {}) as Partial<IntentParseRequest>;
    if (typeof b.text !== 'string' || !b.text.trim()) throw new HttpError(400, 'bad_request', 'text is required');
    const flags = await flagsFor(req);
    return textTurn(deps, flags, b.text.slice(0, 500), turn(deps, req, lang(b.language, 'en-IN'), b.refDate, b.context), 'fallback');
  });

  app.post('/v1/tts', async (req): Promise<TtsResponse> => {
    const b = (req.body ?? {}) as Partial<TtsRequest>;
    if (typeof b.text !== 'string' || !b.text.trim()) throw new HttpError(400, 'bad_request', 'text is required');
    const flags = await flagsFor(req);
    if (useFallback(flags)) return { audioBase64: null, mime: null, source: 'fallback' };
    try {
      const speaker = flags.tts_speaker[flags.tts_model] ?? 'priya';
      const out = await deps.voice.tts(b.text.slice(0, 2500), lang(b.language), flags.tts_model, speaker, req.headers['x-load-test'] === '1');
      return { audioBase64: out.audioBase64, mime: out.audioBase64 ? 'audio/wav' : null, source: out.source };
    } catch {
      deps.metrics.voiceErrors.inc({ kind: 'tts' });
      return { audioBase64: null, mime: null, source: 'fallback' };
    }
  });

  app.get('/v1/audio/:key', async (req, reply) => {
    const key = basename((req.params as { key: string }).key);
    const path = join(AUDIO_DIR, key);
    if (!/^[\w.-]+\.(mp3|wav)$/.test(key) || !existsSync(path)) throw new HttpError(404, 'not_found', 'No such clip');
    reply.header('content-type', key.endsWith('.mp3') ? 'audio/mpeg' : 'audio/wav');
    return reply.send(createReadStream(path));
  });
}
