// Official booking links (big text buttons, no prices, order from the deep_link_providers flag) + warnings + demand line.
import { Linking, Platform, useWindowDimensions, View } from 'react-native';
import type { Lang, OptionsResponse } from '@contract';
import { colors, fonts } from '../../theme/tokens';
import { Body, Button, Glass, H2, Small } from '../../ui/kit';
import { Icon } from '../../ui/icons';
import { SiteLogo, siteLogoKey } from '../../ui/logos';
import { hasRoutePage, routeLink } from '../../lib/deepLinks';

export function openLink(url: string): void {
  if (Platform.OS === 'web' && typeof window !== 'undefined') window.open(url, '_blank', 'noopener,noreferrer');
  else void Linking.openURL(url);
}

export function Options({ options, lang, hints = [] }: { options: OptionsResponse; lang: Lang; hints?: string[] }) {
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
              {options.demand.want.toLocaleString('en-IN')} want, {options.demand.have.toLocaleString('en-IN')} seats
            </Small>
          ) : null}
        </Glass>
      ) : null}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}><Icon name={options.mode === 'train' ? 'train' : options.mode === 'air' ? 'plane' : 'bus'} size={26} /><H2>Book on the official sites</H2></View>
      <Small>We only link out. No prices, no ranking, no tickets sold here.</Small>
      <View style={wide ? { flexDirection: 'row', flexWrap: 'wrap', columnGap: 12, marginTop: 8 } : { marginTop: 8 }}>
      {options.links.map((l) => (
        <Button key={l.providerId} tone="plain" label={l.name} hint={hasRoutePage(l.providerId, options.routeId) ? 'opens the route page' : 'opens official site'}
          onPress={() => openLink(routeLink(l.providerId, l.url, options.routeId))}
          icon={siteLogoKey(l.providerId) ? <SiteLogo id={l.providerId} size={26} /> : <Icon size={20} name={l.mode === 'train' ? 'train' : l.mode === 'air' ? 'plane' : 'bus'} />} />
      ))}
      </View>
      {hints.length > 0 ? (
        <Glass tintColor={colors.mangoLeaf}>
          <Small style={{ color: colors.mangoLeaf, fontFamily: fonts.bodyBold, letterSpacing: 1 }}>WHEN YOU BOOK</Small>
          {hints.map((h) => <Body key={h}>{h}</Body>)}
          <Small>From your profile. Rules differ by operator, so please check on the booking site.</Small>
        </Glass>
      ) : null}
    </View>
  );
}
