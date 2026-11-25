// Alerts: toran header, newest first, new ones glow once and are spoken in the traveller's language.
import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Alert } from '@contract';
import { openLink } from '../../src/screens/speak/Options';
import { speakText } from '../../src/lib/speak';
import { dateLabel } from '../../src/lib/format';
import { markSeen, useAlerts } from '../../src/state/alerts';
import { getIdentity } from '../../src/state/identity';
import { colors, fonts, type as t } from '../../src/theme/tokens';
import { Card, Chip, Screen, Small } from '../../src/ui/kit';
import { Icon } from '../../src/ui/icons';
import { Toran } from '../../src/ui/motifs';

const KIND: Record<Alert['kind'], string> = {
  new_service: 'New buses', special_bus: 'Special bus', special_train: 'Special train', surge_warning: 'Fare surge', tout_warning: 'Safety', info: 'Announcement',
};

export default function Alerts() {
  const { alerts, fresh } = useAlerts();
  useEffect(() => { markSeen(); }, [alerts.length]);
  const lang = getIdentity().language;
  return (
    <Screen title="Alerts" subtitle="New buses, special trains and warnings, in your language">
      <Toran />
      {alerts.length === 0 ? <Small>No alerts yet.</Small> : null}
      {alerts.map((a) => {
        const local = a.textLocal?.[lang];
        const isNew = fresh.has(a.id);
        return (
          <Card key={a.id} edge={a.kind === 'new_service' || a.kind === 'special_bus' ? colors.mangoLeaf : a.kind === 'info' ? colors.marigold : colors.kumkum}
            style={isNew ? s.glow : undefined}>
            <View style={s.row}>
              <Chip label={KIND[a.kind]} tone={a.kind === 'new_service' ? 'ok' : a.kind === 'tout_warning' || a.kind === 'surge_warning' ? 'warn' : 'normal'} />
              {a.date ? <Small>{dateLabel(a.date)}</Small> : null}
              {isNew ? <Chip label="new" tone="soft" /> : null}
            </View>
            <View style={[s.row, { marginTop: 8 }]}>
              <Pressable accessibilityRole="button" accessibilityLabel="Play this alert" onPress={() => void speakText(local ?? a.text, local ? lang : 'en-IN')}>
                <Icon name="speaker" size={28} />
              </Pressable>
              <View style={{ flex: 1 }}>
                <Text style={s.text}>{local ?? a.text}</Text>
                {local ? <Small>{a.text}</Small> : null}
              </View>
            </View>
            <View style={[s.row, { marginTop: 6 }]}>
              <Small>source: {a.source === 'seeded' ? 'seeded demo data' : a.source === 'context_dev' ? 'news' : a.source}</Small>
              {a.sourceUrl ? <Text style={s.link} onPress={() => openLink(a.sourceUrl!)}>open source</Text> : null}
            </View>
          </Card>
        );
      })}
    </Screen>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  text: { fontFamily: fonts.kannada, fontSize: t.label, color: colors.ink, lineHeight: 30 },
  glow: { borderColor: colors.marigold, borderWidth: 2, shadowColor: colors.marigold, shadowOpacity: 0.5, shadowRadius: 12, elevation: 4 },
  link: { fontFamily: fonts.body, color: colors.ink, textDecorationLine: 'underline' },
});
