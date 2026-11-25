// Speak (traveller home): greeting, language chips, hold-to-talk mic, "or type", trip card, booking links, Alert me.
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { Lang, OptionsResponse, TripIntent, VoiceIntentResponse } from '@contract';
import { api } from '../../src/api';
import type { RecordedAudio } from '../../src/api/types';
import { UTTERANCES } from '../../src/lib/miniParse';
import { playReply } from '../../src/lib/speak';
import { useHoldToTalk } from '../../src/lib/useRecorder';
import { MicButton } from '../../src/screens/speak/MicButton';
import { Options } from '../../src/screens/speak/Options';
import { TripCard } from '../../src/screens/speak/TripCard';
import { GiftCard } from '../../src/screens/speak/GiftCard';
import { useFlags } from '../../src/state/flags';
import { getIdentity, setIdentity, travellerTraits } from '../../src/state/identity';
import { useProfile } from '../../src/state/profile';
import { fillFromProfile, travelHints, tripFromProfile } from '../../src/lib/profileUse';
import { colors, fonts, space, type as t } from '../../src/theme/tokens';
import { Body, Button, Chip, Glass, Screen, Section, Small } from '../../src/ui/kit';
import { alpha, frost } from '../../src/ui/glass';
import { SoftRule } from '../../src/ui/backdrop';
import { Diya } from '../../src/ui/motifs';
import { Icon } from '../../src/ui/icons';

const LANGS: Array<[Lang, string]> = [['kn-IN', 'ಕನ್ನಡ'], ['ta-IN', 'தமிழ்'], ['te-IN', 'తెలుగు'], ['hi-IN', 'हिन्दी'], ['od-IN', 'ଓଡ଼ିଆ'], ['bn-IN', 'বাংলা'], ['en-IN', 'English']];
const SOURCE_LABEL: Record<string, string> = { live: 'live voice', mock: 'demo voice', fallback: 'offline voice', seeded: 'seeded', context_dev: 'news' };

export default function Speak() {
  const { flags, accent, refresh } = useFlags();
  const profile = useProfile();
  const [lang, setLang] = useState<Lang>(getIdentity().language);
  const [busy, setBusy] = useState(false);
  const [typing, setTyping] = useState(false);
  const [text, setText] = useState('');
  const [turn, setTurn] = useState<VoiceIntentResponse | null>(null);
  const [intent, setIntent] = useState<TripIntent | null>(null);
  const [options, setOptions] = useState<OptionsResponse | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { void api.identify(getIdentity().traveller, travellerTraits(lang)).then(() => refresh()); }, [lang, refresh]);

  const handle = useCallback((res: VoiceIntentResponse) => {
    setTurn(res);
    setIntent(fillFromProfile(res.intent, profile)); // empty town / mode / boarding point come from the profile
    setSaved(null);
    playReply(res.reply);
  }, [profile]);

  const run = useCallback(async (job: () => Promise<VoiceIntentResponse>) => {
    setBusy(true);
    setError(null);
    try { handle(await job()); } catch { setError('Could not understand that just now. Try typing, or pick a sample.'); }
    setBusy(false);
  }, [handle]);

  const onClip = useCallback((clip: RecordedAudio) => void run(() => api.voiceIntent(clip, lang, intent?.needsFollowUp.length ? intent : null)), [run, lang, intent]);
  const rec = useHoldToTalk(onClip);
  const sendText = (s: string, l: Lang = lang) => { if (s.trim()) void run(() => api.parse(s.trim(), l, intent?.needsFollowUp.length ? intent : null)); };

  useEffect(() => {
    if (!intent?.routeId) { setOptions(null); return; }
    void api.options(intent.routeId, intent.dateFrom, intent.mode, intent.people).then(setOptions).catch(() => setOptions(null));
  }, [intent?.routeId, intent?.dateFrom, intent?.mode, intent?.people]);

  const pickLang = (l: Lang) => { setLang(l); setIdentity({ language: l, mode: 'traveller' }); };
  const alertMe = async () => {
    if (!intent) return;
    await api.saveTrip({ ...intent, travellerId: getIdentity().traveller });
    const msg = lang === 'kn-IN' ? 'ಸರಿ, ಹೊಸ ಬಸ್ ಬಂದಾಗ ತಿಳಿಸುತ್ತೇನೆ.' : 'Done. I will tell you when a new bus opens.';
    setSaved(msg);
    playReply({ text: msg, language: lang, audioBase64: null, mime: null });
  };
  const samples = UTTERANCES.filter((u) => u.language === lang || u.language === 'en-IN');
  const voiceOff = !flags.voice_enabled;

  return (
    <Screen title={flags.festival_mode.greeting[lang] ?? flags.festival_mode.greeting['en-IN'] ?? 'Prasthan'} subtitle={`${flags.festival_mode.title} - say your trip home in your own language`}>
      <View style={s.me}>
        <Chip label={`${profile?.name || 'Guest'} - profile`} onPress={() => router.push('/profile')} />
        {profile ? <Chip label="My usual trip home" tone="soft" onPress={() => { setTurn(null); setSaved(null); setIntent(tripFromProfile(profile, getIdentity().traveller)); }} /> : null}
      </View>
      <View style={s.langs}>{LANGS.map(([l, name]) => <Chip key={l} label={name} selected={l === lang} onPress={() => pickLang(l)} />)}</View>
      <MicButton state={rec.state} elapsed={rec.elapsed} busy={busy} accent={accent.accent} disabled={voiceOff} onPressIn={() => void rec.start()} onPressOut={() => void rec.stop()} />
      <Text style={s.powered}>Powered by Sarvam AI</Text>
      {voiceOff ? <Small style={{ textAlign: 'center' }}>Voice is switched off right now. Please type.</Small> : null}
      <Pressable accessibilityRole="button" onPress={() => setTyping(!typing)} style={[s.typeLink, frost(0.6, 12)]}>
        <Icon name="keyboard" size={20} /><Text style={s.typeText}>{typing ? 'hide typing' : 'or type'}</Text>
      </Pressable>
      {typing || voiceOff ? (
        <Glass>
          <TextInput value={text} onChangeText={setText} placeholder="Going home to Hubli for Sankranti, Friday night" placeholderTextColor={colors.inkSoft}
            style={s.input} onSubmitEditing={() => sendText(text)} accessibilityLabel="Type your trip" returnKeyType="send" />
          <Button label="Send" onPress={() => sendText(text)} disabled={busy} />
          <Small>Or tap a sample sentence (synthetic test lines):</Small>
          <View style={[s.chips, { marginTop: 6 }]}>{samples.map((u) => <Chip key={u.id} label={u.text} onPress={() => { setText(u.text); sendText(u.text, u.language); }} />)}</View>
        </Glass>
      ) : null}
      {error ? <Body style={{ color: colors.kumkum }}>{error}</Body> : null}
      {turn ? <ReplyCard turn={turn} /> : null}
      {intent ? <TripCard intent={intent} onChange={setIntent} /> : null}
      {options && intent ? <Options options={options} lang={lang} hints={travelHints(profile, options.mode)} /> : null}
      {intent?.routeId && intent.dateFrom ? (
        <Section>
          <SoftRule />
          <View style={s.alertRow}>
            <View style={s.diya}><Diya lit={Boolean(saved)} size={34} /></View>
            <View style={{ flexShrink: 1 }}><Button tone="leaf" label={saved ? 'Alert is on' : 'Alert me when a new bus opens'} onPress={() => void alertMe()} /></View>
          </View>
          {saved ? <Body style={{ textAlign: 'center', color: colors.mangoLeaf }}>{saved}</Body> : null}
        </Section>
      ) : null}
      {flags.gifting_enabled && intent?.routeId ? <GiftCard intent={intent} /> : null}
    </Screen>
  );
}

function ReplyCard({ turn }: { turn: VoiceIntentResponse }) {
  return (
    <Section>
      {turn.transcript ? <Small>You said: {turn.transcript}</Small> : null}
      <View style={{ flexDirection: 'row', gap: space.md, alignItems: 'center', marginTop: 8 }}>
        <Pressable accessibilityRole="button" accessibilityLabel="Play reply again" onPress={() => playReply(turn.reply)} style={[s.play, frost(0.75, 12)]}><Icon name="speaker" size={24} /></Pressable>
        <Text style={s.reply}>{turn.reply.text}</Text>
      </View>
      <View style={[s.chips, { marginTop: 8 }]}>
        <Chip label={`speech: ${SOURCE_LABEL[turn.source.stt]}`} tone={turn.source.stt === 'live' ? 'ok' : 'normal'} />
        <Chip label={`understanding: ${turn.intent.parser === 'llm' ? 'Sarvam LLM' : 'rules'}`} />
        <Chip label={`reply: ${SOURCE_LABEL[turn.source.tts]}`} tone={turn.source.tts === 'live' ? 'ok' : 'normal'} />
      </View>
    </Section>
  );
}

const s = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  me: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 6 },
  langs: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 4 },
  play: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  diya: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', backgroundColor: alpha(colors.marigold, 0.14) },
  powered: { textAlign: 'center', fontFamily: fonts.body, fontSize: t.small, color: colors.inkSoft },
  typeLink: { flexDirection: 'row', alignSelf: 'center', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingVertical: 10, minHeight: 48, borderRadius: 999, marginTop: 10, marginBottom: 4 },
  typeText: { fontFamily: fonts.bodyBold, fontSize: t.body, color: colors.ink },
  input: { borderRadius: 999, paddingHorizontal: 22, paddingVertical: 14, fontSize: t.body, fontFamily: fonts.body, color: colors.ink, backgroundColor: 'rgba(255, 255, 255, 0.9)', minHeight: 54, marginBottom: 6 },
  reply: { flex: 1, fontFamily: fonts.kannada, fontSize: t.card, color: colors.ink, lineHeight: 34 },
  alertRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 14, flexWrap: 'wrap' },
});
