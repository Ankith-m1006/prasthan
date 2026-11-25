// One-screen profile form: pill chips only, soft glass groups, privacy line at the bottom.
import { useState, type ReactNode } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { colors, fonts, type as t } from '../../theme/tokens';
import { Button, Chip, Glass, Small } from '../../ui/kit';
import { newGuestId, type Profile } from '../../state/profile';
import { subRegionsFor } from '../../lib/festivals';
import { AGE_CHOICES, boardingFor, GENDER_CHOICES, LANG_CHOICES, MODE_CHOICES, ROUTES, STATES, WITH_CHOICES } from './options';

export const PRIVACY_LINE = 'Saved only on this phone. Operators only see totals, never your details.';

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Small style={s.label}>{label}</Small>
      <View style={s.chips}>{children}</View>
    </View>
  );
}

function blank(): Profile {
  return { id: newGuestId(), name: '', language: 'kn-IN', homeState: 'Karnataka', region: null, homeRouteId: 'BLR-HBL', workCity: 'Bengaluru',
    boardingPoint: 'MAJESTIC', mode: 'bus', travellingWith: 'alone', ageGroup: null, gender: null };
}

export function ProfileForm({ initial, onSave }: { initial: Profile | null; onSave: (p: Profile) => void }) {
  const [p, setP] = useState<Profile>(initial ?? blank());
  const set = (patch: Partial<Profile>) => setP((old) => ({ ...old, ...patch }));
  const pickState = (homeState: string) => set({ homeState, region: null, homeRouteId: ROUTES.find((r) => r.state === homeState)?.id ?? p.homeRouteId });
  const pickMode = (mode: Profile['mode']) => {
    const fits = boardingFor(mode);
    set({ mode, boardingPoint: fits.some((b) => b.id === p.boardingPoint) ? p.boardingPoint : fits[0]?.id ?? p.boardingPoint });
  };
  return (
    <View>
      <Glass>
        <Small style={s.label}>Your name (only for greetings)</Small>
        <TextInput value={p.name} onChangeText={(name) => set({ name })} placeholder="e.g. Lakshmi" placeholderTextColor={colors.inkSoft}
          style={s.input} accessibilityLabel="Your name" maxLength={40} />
        <Row label="Language for replies">{LANG_CHOICES.map(([l, n]) => <Chip key={l} label={n} selected={p.language === l} onPress={() => set({ language: l })} />)}</Row>
        <Row label="Home state">{STATES.map((st) => <Chip key={st} label={st} selected={p.homeState === st} onPress={() => pickState(st)} />)}</Row>
        <Row label="Your region (optional, for festivals)">{subRegionsFor(p.homeState).map((r) => <Chip key={r} label={r} selected={p.region === r} onPress={() => set({ region: p.region === r ? null : r })} />)}</Row>
        <Row label="Home town">{ROUTES.filter((r) => r.state === p.homeState).map((r) => <Chip key={r.id} label={r.to} selected={p.homeRouteId === r.id} onPress={() => set({ homeRouteId: r.id })} />)}</Row>
      </Glass>
      <Glass>
        <Row label="Work city"><Chip label="Bengaluru" selected /></Row>
        <Row label="Usual way home">{MODE_CHOICES.map(([m, n]) => <Chip key={m} label={n} selected={p.mode === m} onPress={() => pickMode(m)} />)}</Row>
        <Row label="Usual boarding point">{boardingFor(p.mode).map((b) => <Chip key={b.id} label={b.label} selected={p.boardingPoint === b.id} onPress={() => set({ boardingPoint: b.id })} />)}</Row>
        <Row label="Travelling with">{WITH_CHOICES.map(([w, n]) => <Chip key={w} label={n} selected={p.travellingWith === w} onPress={() => set({ travellingWith: w })} />)}</Row>
      </Glass>
      <Glass>
        <Small>Optional. Only used for travel hints on this phone (for example lower berths). Tap again to clear.</Small>
        <View style={{ height: 10 }} />
        <Row label="Age group">{AGE_CHOICES.map(([a, n]) => <Chip key={a} label={n} selected={p.ageGroup === a} onPress={() => set({ ageGroup: p.ageGroup === a ? null : a })} />)}</Row>
        <Row label="Gender">{GENDER_CHOICES.map(([g, n]) => <Chip key={g} label={n} selected={p.gender === g} onPress={() => set({ gender: p.gender === g ? null : g })} />)}</Row>
      </Glass>
      <Small style={s.privacy}>{PRIVACY_LINE}</Small>
      <Button label={initial ? 'Save profile' : 'Save and start'} onPress={() => onSave({ ...p, name: p.name.trim() })} />
    </View>
  );
}

const s = StyleSheet.create({
  label: { fontFamily: fonts.bodyBold, color: colors.ink, marginBottom: 6 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  input: { borderRadius: 999, paddingHorizontal: 22, paddingVertical: 12, fontSize: t.body, fontFamily: fonts.body, color: colors.ink, backgroundColor: 'rgba(255, 255, 255, 0.9)', minHeight: 52, marginBottom: 14 },
  privacy: { textAlign: 'center', marginTop: 8, marginBottom: 4 },
});
