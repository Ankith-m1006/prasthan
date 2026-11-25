// Official booking links (big text buttons, no prices, order from the deep_link_providers flag) + warnings + demand line.
import { Linking, Platform, useWindowDimensions, View } from 'react-native';
import type { Lang, OptionsResponse } from '@contract';
import { colors, fonts } from '../../theme/tokens';
import { Body, Button, Glass, H2, Small } from '../../ui/kit';
import { Icon } from '../../ui/icons';

export function openLink(url: string): void {
  if (Platform.OS === 'web' && typeof window !== 'undefined') window.open(url, '_blank', 'noopener,noreferrer');
  else void Linking.openURL(url);
}

export function Options({ options, lang }: { options: OptionsResponse; lang: Lang }) {
  const wide = useWindowDimensions().width >= 760;
  return (
    <View>
      {options.warnings.length > 0 ? (
        <Glass tintColor={colors.kumkum}>
          <Small style={{ color: colors.kumkum, fontFamily: fonts.bodyBold, letterSpacing: 1 }}>HEADS UP</Small>
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
        </Glass>
      ) : null}
      <H2>Book on the official sites</H2>
      <Small>We only link out. No prices, no ranking, no tickets sold here.</Small>
      <View style={wide ? { flexDirection: 'row', flexWrap: 'wrap', columnGap: 12, marginTop: 8 } : { marginTop: 8 }}>
      {options.links.map((l) => (
        <Button key={l.providerId} tone="plain" label={l.name} hint="opens official site" onPress={() => openLink(l.url)}
          icon={<Icon size={20} name={l.mode === 'train' ? 'train' : l.mode === 'air' ? 'plane' : 'bus'} />} />
      ))}
      </View>
    </View>
  );
}
