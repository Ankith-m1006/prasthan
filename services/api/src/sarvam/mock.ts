// Mock Sarvam: no network. STT picks a seed utterance (by file-name hint like "u-kn-03", else the language's hero line);
// chat answers with the rule parser's JSON; TTS returns no audio (the app shows big text); translate uses templates.
import type { Lang } from '../../../../shared/contract/src/index.js';
import type { Utterance } from '../seed.js';
import type { ChatMessage, SarvamClient } from './client.js';

export class MockSarvamClient implements SarvamClient {
  readonly mode = 'mock' as const;
  constructor(private readonly utterances: Utterance[], private readonly chatFn: (messages: ChatMessage[]) => string) {}

  async stt(_audio: Buffer, _mime: string, _mode: string, lang?: Lang, nameHint?: string): Promise<{ transcript: string; language: Lang | null }> {
    const hint = (nameHint ?? '').toLowerCase();
    const byName = this.utterances.find((u) => hint.includes(u.id.toLowerCase()));
    const byLang = this.utterances.filter((u) => u.language === (lang ?? 'kn-IN'));
    const u = byName ?? byLang.find((x) => x.demoHero) ?? byLang[0] ?? this.utterances[0];
    return { transcript: u.text, language: u.language };
  }

  async chat(messages: ChatMessage[]): Promise<string> {
    return this.chatFn(messages);
  }

  async tts(): Promise<string | null> {
    return null;
  }

  async translate(text: string): Promise<string> {
    return text;
  }
}
