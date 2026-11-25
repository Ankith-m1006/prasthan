// Four tabs: Speak (traveller), Alerts, Partners, About.
import { Tabs } from 'expo-router';
import { Icon, type IconName } from '../../src/ui/icons';
import { colors, fonts } from '../../src/theme/tokens';
import { useEffect } from 'react';
import { startAlerts, useAlertsBadge } from '../../src/state/alerts';
import { useFlags } from '../../src/state/flags';

const icon = (name: IconName) => ({ color }: { color: unknown }) => <Icon name={name} color={typeof color === 'string' ? color : colors.ink} />;

export default function TabsLayout() {
  const unseen = useAlertsBadge();
  const { flags } = useFlags();
  useEffect(() => startAlerts(flags.alert_poll_seconds), [flags.alert_poll_seconds]);
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.ink,
        tabBarInactiveTintColor: colors.inkSoft,
        tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.line, height: 62, paddingBottom: 8 },
        tabBarLabelStyle: { fontFamily: fonts.body, fontSize: 13 },
        sceneStyle: { backgroundColor: colors.paper },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Speak', tabBarIcon: icon('mic') }} />
      <Tabs.Screen name="alerts" options={{ title: 'Alerts', tabBarIcon: icon('bell'), tabBarBadge: unseen > 0 ? unseen : undefined, tabBarBadgeStyle: { backgroundColor: colors.kumkum } }} />
      <Tabs.Screen name="partners" options={{ title: 'Partners', tabBarIcon: icon('shop') }} />
      <Tabs.Screen name="about" options={{ title: 'About', tabBarIcon: icon('info') }} />
    </Tabs>
  );
}
