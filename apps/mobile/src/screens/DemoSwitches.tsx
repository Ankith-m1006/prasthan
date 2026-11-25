// Offline demo only: the switches Flagsmith would flip live (festival mode, offline voice fallback, gifting rollout).
// In the real setup these are Flagsmith flags/segments evaluated by the api; here they flip the bundled mock flags.
import { useState } from 'react';
import { View } from 'react-native';
import { mockState } from '../api/mock';
import type { DemoSwitches as Sw } from '../api/mockFlags';
import { useFlags } from '../state/flags';
import { Chip, Glass, H2, Small } from '../ui/kit';

export function DemoSwitches() {
  const { refresh, flags } = useFlags();
  const [sw, setSw] = useState<Sw>(mockState.switches);
  const set = (patch: Sw) => {
    const next = { ...sw, ...patch };
    mockState.switches = next;
    setSw(next);
    void refresh();
  };
  return (
    <Glass>
      <H2>Demo switches (Flagsmith, simulated offline)</H2>
      <Small>In the live setup these are Flagsmith flags with segments, changed from the dashboard or by the NudgeBee runbook. This offline copy flips them in the browser so you can see what each one does.</Small>
      <Small style={{ marginTop: 10 }}>festival_mode (now: {flags.festival_mode.title})</Small>
      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
        <Chip label="Sankranti" selected={!sw.festival || sw.festival === 'default'} onPress={() => set({ festival: 'default' })} />
        <Chip label="Pongal" selected={sw.festival === 'pongal'} onPress={() => set({ festival: 'pongal' })} />
        <Chip label="Republic Day" selected={sw.festival === 'republic'} onPress={() => set({ festival: 'republic' })} />
      </View>
      <Small style={{ marginTop: 10 }}>voice_fallback_offline (the switch NudgeBee flips when the voice service falls over)</Small>
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
        <Chip label="Off" selected={!sw.fallback} onPress={() => set({ fallback: false })} />
        <Chip label="On" tone="warn" selected={Boolean(sw.fallback)} onPress={() => set({ fallback: true })} />
      </View>
      <Small style={{ marginTop: 10 }}>gifting_enabled rollout (20% pilot segment, then everyone)</Small>
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
        <Chip label="20% pilot" selected={!sw.giftingAll} onPress={() => set({ giftingAll: false })} />
        <Chip label="100%" selected={Boolean(sw.giftingAll)} onPress={() => set({ giftingAll: true })} />
      </View>
    </Glass>
  );
}
