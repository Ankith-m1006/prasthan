// Official booking links (big text buttons, no prices, order from the deep_link_providers flag) + warnings + demand line.
import { Linking, Platform, View } from 'react-native';
import type { Lang, OptionsResponse } from '@contract';
import { colors } from '../../theme/tokens';
import { Body, Button, Card, H2, Small } from '../../ui/kit';
import { Icon } from '../../ui/icons';

export function openLink(url: string): void {
  if (Platform.OS === 'web' && typeof window !== 'undefined') window.open(url, '_blank', 'noopener,noreferrer');
  else void Linking.openURL(url);
}

export function Options({ options, lang }: { options: OptionsResponse; lang: Lang }) {
  return (
    <View>
      {options.warnings.length > 0 ? (
        <Card edge={colors.kumkum}>
          {options.warnings.map((w) => (
            <View key={w.kind} style={{ marginBottom: 6 }}>
              <Body style={{ fontWeight: '700' }}>{w.textLocal?.[lang] ?? w.text}</Body>
              {w.textLocal?.[lang] ? <Small>{w.text}</Small> : null}
            </View>
          ))}
          {options.demand ? (
            <Small style={{ color: colors.kumkum }}>
              {options.demand.want.toLocaleString('en-IN')} want, {options.demand.have.toLocaleString('en-IN')} seats - {options.demand.label.toLowerCase()}
            </Small>
          ) : null}
        </Card>
      ) : null}
      <H2>Book on the official sites</H2>
      <Small>We only link out. No prices, no ranking, no tickets sold here.</Small>
      {options.links.map((l) => (
        <Button key={l.providerId} tone="plain" label={l.name} hint="opens official site" onPress={() => openLink(l.url)}
          icon={<Icon name={l.mode === 'train' ? 'train' : l.mode === 'air' ? 'plane' : 'bus'} />} />
      ))}
    </View>
  );
}
