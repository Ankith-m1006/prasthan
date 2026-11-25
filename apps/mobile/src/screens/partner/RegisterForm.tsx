// Register a business (demo, no password): name, nearest boarding point, sweets + prices (shops) or routes + seats (operators).
import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import type { Partner, PartnerType } from '@contract';
import bpJson from '../../../../../seed/boarding-points.json';
import routesJson from '../../../../../seed/routes.json';
import { colors, fonts, type as t } from '../../theme/tokens';
import { Banner, Button, Chip, Screen, Small } from '../../ui/kit';
import { frost } from '../../ui/glass';
import { registerPartner } from './api';
import { checkRegistration, type ItemDraft, type RegisterDraft } from './logic';

const POINTS = bpJson.boardingPoints.map((b) => ({ id: b.id, name: b.name.split(' (')[0] }));
const ROUTES = routesJson.routes.map((r) => ({ id: r.id, to: r.to }));
const NEW_ITEM: ItemDraft = { name: '', price: '', unit: 'kg' };
const TITLE: Record<PartnerType, string> = { bus_operator: 'Register your buses', sweet_shop: 'Register your sweet shop', quick_commerce: 'Register your store' };

export function RegisterForm({ type, onBack, onDone }: { type: PartnerType; onBack: () => void; onDone: (p: Partner) => void }) {
  const [d, setD] = useState<RegisterDraft>({ type, name: '', boardingPoint: null, items: [{ ...NEW_ITEM }], routes: [], seatsPerNight: '' });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (patch: Partial<RegisterDraft>) => setD((x) => ({ ...x, ...patch }));
  const setItem = (n: number, patch: Partial<ItemDraft>) => set({ items: d.items.map((it, i) => (i === n ? { ...it, ...patch } : it)) });
  const toggleRoute = (id: string) => set({ routes: d.routes.includes(id) ? d.routes.filter((r) => r !== id) : [...d.routes, id] });

  const submit = async () => {
    const c = checkRegistration(d);
    if (!c.ok) { setError(c.error); return; }
    setBusy(true); setError(null);
    try {
      const { partner } = await registerPartner(c.req);
      onDone(partner);
    } catch (e) {
      setError((e as Error).message || 'Could not register just now. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen demoTag title={TITLE[type]} subtitle="No password in this demo. Your business shows up for travellers right away.">
      <Small style={s.label}>Business name</Small>
      <TextInput value={d.name} onChangeText={(name) => set({ name })} placeholder="e.g. Amma Sweets" placeholderTextColor={colors.inkSoft} style={s.input} accessibilityLabel="Business name" maxLength={60} testID="reg-name" />
      <Small style={s.label}>{type === 'sweet_shop' ? 'Nearest boarding point (where travellers pick up)' : 'Main boarding point (optional)'}</Small>
      <View style={s.chips}>{POINTS.map((p) => <Chip key={p.id} label={p.name} selected={d.boardingPoint === p.id} onPress={() => set({ boardingPoint: p.id })} />)}</View>
      {type === 'sweet_shop' ? (
        <>
          <Small style={s.label}>Sweets you sell (name, price in Rs, unit)</Small>
          {d.items.map((it, n) => (
            <View key={n} style={s.itemRow}>
              <TextInput value={it.name} onChangeText={(name) => setItem(n, { name })} placeholder="Mysore pak" placeholderTextColor={colors.inkSoft} style={[s.input, { flex: 2 }]} accessibilityLabel={`Item ${n + 1} name`} testID={`reg-item-${n}`} />
              <TextInput value={it.price} onChangeText={(price) => setItem(n, { price: price.replace(/[^0-9]/g, '') })} placeholder="640" keyboardType="number-pad" placeholderTextColor={colors.inkSoft} style={[s.input, { flex: 1 }]} accessibilityLabel={`Item ${n + 1} price`} testID={`reg-price-${n}`} />
              <TextInput value={it.unit} onChangeText={(unit) => setItem(n, { unit })} placeholder="kg" placeholderTextColor={colors.inkSoft} style={[s.input, { flex: 1 }]} accessibilityLabel={`Item ${n + 1} unit`} />
            </View>
          ))}
          {d.items.length < 8 ? <Chip label="+ Add another sweet" onPress={() => set({ items: [...d.items, { ...NEW_ITEM }] })} /> : null}
        </>
      ) : null}
      {type === 'bus_operator' ? (
        <>
          <Small style={s.label}>Routes you run from Bengaluru</Small>
          <View style={s.chips}>{ROUTES.map((r) => <Chip key={r.id} label={`BLR -> ${r.to}`} selected={d.routes.includes(r.id)} onPress={() => toggleRoute(r.id)} />)}</View>
          <Small style={s.label}>Seats you run per night (all routes)</Small>
          <TextInput value={d.seatsPerNight} onChangeText={(v) => set({ seatsPerNight: v.replace(/[^0-9]/g, '') })} placeholder="400" keyboardType="number-pad" placeholderTextColor={colors.inkSoft} style={s.input} accessibilityLabel="Seats per night" testID="reg-seats" />
        </>
      ) : null}
      {error ? <View style={{ marginTop: 12 }}><Banner text={error} /></View> : null}
      <View style={{ alignItems: 'center', marginTop: 16 }}>
        <Button label={busy ? 'Registering...' : 'Register and open dashboard'} disabled={busy} onPress={() => void submit()} />
        <Button tone="plain" label="Back" onPress={onBack} />
      </View>
    </Screen>
  );
}

const s = StyleSheet.create({
  label: { marginTop: 16, marginBottom: 6, letterSpacing: 0.5 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  itemRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  input: { ...frost(0.7, 12), borderRadius: 24, minHeight: 48, paddingHorizontal: 18, fontFamily: fonts.body, fontSize: t.body, color: colors.ink },
});
