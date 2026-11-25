// About: what this is, sponsors as plain text, honesty lines, AI-use line.
import { router } from 'expo-router';
import { Linking, Text } from 'react-native';
import { api, isForcedMock } from '../../src/api';
import { DemoSwitches } from '../../src/screens/DemoSwitches';
import { LiveFlagValues } from '../../src/screens/LiveFlags';
import { useFlags } from '../../src/state/flags';
import { useProfile } from '../../src/state/profile';
import { ROUTES } from '../../src/screens/profile/options';
import { Body, Button, H2, Screen, Section, Small, s as ks } from '../../src/ui/kit';

export default function About() {
  const { source } = useFlags();
  const profile = useProfile();
  const town = ROUTES.find((r) => r.id === profile?.homeRouteId)?.to;
  return (
    <Screen demoTag title="ಪ್ರಸ್ಥಾನ Prasthan" subtitle="Say your festival trip home, in your own language.">
      <Section>
        <Body>Prasthan understands your trip, sends you to the official booking sites, warns you about rush nights and touts, and tells you when a new bus opens. It shows bus operators the buses that are missing.</Body>
      </Section>
      <H2>Profile</H2>
      <Section>
        <Body>{profile ? `${profile.name || 'Guest'} - home ${town ?? ''}, ${profile.homeState}` : 'No profile yet.'}</Body>
        <Small>Saved only on this phone. Operators only see totals, never your details.</Small>
        <Button tone="plain" label="View or edit profile" onPress={() => router.push('/profile')} />
      </Section>
      {source === 'live' ? <LiveFlagValues /> : api.kind === 'mock' ? <DemoSwitches /> : null}
      <H2>Powered by</H2>
      <Section>
        <Body>Powered by Sarvam AI (speech to text, understanding, text to speech).</Body>
        <Body>Flagsmith runs festival modes, segments, kill switches and rollouts.</Body>
        <Body>NudgeBee watches the service on the rush night and drives the approved fix.</Body>
      </Section>
      <H2>Honest notes</H2>
      <Section>
        <Body>Seeded demo data: travellers, demand, operators and shops are invented for this demo.</Body>
        <Body>We never show prices, never scrape and never sell tickets. Booking links open the official or public sites.</Body>
        {isForcedMock() ? <Body>{source === 'live' ? 'This copy runs on bundled demo data and mock voice; its flags are read live from Flagsmith.' : 'This copy runs fully offline on bundled demo data (no live voice, no live flags).'}</Body> : null}
      </Section>
      <H2>AI use</H2>
      <Section>
        <Small>Built during Festive Hacks (25 Nov 2026) with help from AI coding assistants (OpenAI Codex, Claude Code). Prep docs and synthetic data were written before the event; all code was written during it.</Small>
        <Small style={{ marginTop: 8 }} >Fonts: Mukta, Tiro Kannada, Noto Sans Kannada (SIL Open Font License). Motifs and icons drawn by us.</Small>
        <Text accessibilityRole="link" style={[ks.small, { marginTop: 8, textDecorationLine: 'underline' }]} onPress={() => void Linking.openURL('https://github.com/Ankith-m1006/prasthan')}>Source code</Text>
      </Section>
    </Screen>
  );
}
