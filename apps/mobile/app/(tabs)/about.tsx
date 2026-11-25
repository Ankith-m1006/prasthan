// About: what this is, sponsors as plain text, honesty lines, AI-use line.
import { Linking, Text } from 'react-native';
import { api, isForcedMock } from '../../src/api';
import { DemoSwitches } from '../../src/screens/DemoSwitches';
import { Body, Card, H2, Screen, Small, s as ks } from '../../src/ui/kit';

export default function About() {
  return (
    <Screen title="ಪ್ರಸ್ಥಾನ Prasthan" subtitle="Say your festival trip home, in your own language.">
      <Card>
        <Body>Prasthan understands your trip, sends you to the official booking sites, warns you about rush nights and touts, and tells you when a new bus opens. It shows bus operators the buses that are missing.</Body>
      </Card>
      {api.kind === 'mock' ? <DemoSwitches /> : null}
      <H2>Powered by</H2>
      <Card>
        <Body>Powered by Sarvam AI (speech to text, understanding, text to speech).</Body>
        <Body>Flagsmith runs festival modes, segments, kill switches and rollouts.</Body>
        <Body>NudgeBee watches the service on the rush night and drives the approved fix.</Body>
      </Card>
      <H2>Honest notes</H2>
      <Card>
        <Body>Seeded demo data: travellers, demand, operators and shops are invented for this demo.</Body>
        <Body>We never show prices, never scrape and never sell tickets. Booking links open the official or public sites.</Body>
        {isForcedMock() ? <Body>This copy runs fully offline on bundled demo data (no live voice, no live flags).</Body> : null}
      </Card>
      <H2>AI use</H2>
      <Card>
        <Small>Built during Festive Hacks (25 Nov 2026) with help from AI coding assistants (OpenAI Codex, Claude Code). Prep docs and synthetic data were written before the event; all code was written during it.</Small>
        <Small style={{ marginTop: 8 }} >Fonts: Mukta, Tiro Kannada, Noto Sans Kannada (SIL Open Font License). Motifs and icons drawn by us.</Small>
        <Text accessibilityRole="link" style={[ks.small, { marginTop: 8, textDecorationLine: 'underline' }]} onPress={() => void Linking.openURL('https://github.com/Ankith-m1006/prasthan')}>Source code</Text>
      </Card>
    </Screen>
  );
}
