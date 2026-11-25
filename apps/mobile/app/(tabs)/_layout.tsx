// Five tabs: Speak (traveller), Calendar (festivals), Alerts, Partners, About. No saved profile yet -> the welcome screen first.
import { Redirect, Tabs } from 'expo-router';
import { Icon, type IconName } from '../../src/ui/icons';
import { CalendarIcon } from '../../src/screens/calendar/CalendarIcon';
import { colors, fonts } from '../../src/theme/tokens';
import { frost } from '../../src/ui/glass';
import { useEffect } from 'react';
import { useWindowDimensions } from 'react-native';
import { startAlerts, useAlertsBadge } from '../../src/state/alerts';
import { useFlags } from '../../src/state/flags';
import { useProfile } from '../../src/state/profile';

const icon = (name: IconName) => ({ color }: { color: unknown }) => <Icon name={name} color={typeof color === 'string' ? color : colors.ink} />;

export default function TabsLayout() {
  const unseen = useAlertsBadge();
  const { flags } = useFlags();
  const wide = useWindowDimensions().width >= 760;
  const profile = useProfile();
  useEffect(() => startAlerts(flags.alert_poll_seconds), [flags.alert_poll_seconds]);
  if (!profile) return <Redirect href="/welcome" />; // first launch: welcome -> guest profile
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.ink,
        tabBarInactiveTintColor: colors.inkSoft,
        tabBarStyle: [{ ...frost(0.72, 20), position: 'absolute', borderTopWidth: 0, height: 76, paddingBottom: 12, paddingTop: 8, elevation: 0 },
          wide ? { left: '50%', width: 600, marginLeft: -300, bottom: 18, height: 72, paddingBottom: 8, borderRadius: 36 } : null],
        tabBarLabelStyle: { fontFamily: fonts.bodyBold, fontSize: 13 },
        tabBarActiveBackgroundColor: 'rgba(242, 158, 31, 0.14)',
        tabBarItemStyle: { borderRadius: 28, marginHorizontal: 8, overflow: 'hidden' },
        sceneStyle: { backgroundColor: colors.paper },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Speak', tabBarIcon: icon('mic') }} />
      <Tabs.Screen name="calendar" options={{ title: 'Calendar', tabBarIcon: ({ color }: { color: unknown }) => <CalendarIcon color={typeof color === 'string' ? color : colors.ink} /> }} />
      <Tabs.Screen name="alerts" options={{ title: 'Alerts', tabBarIcon: icon('bell'), tabBarBadge: unseen > 0 ? unseen : undefined, tabBarBadgeStyle: { backgroundColor: colors.kumkum } }} />
      <Tabs.Screen name="partners" options={{ title: 'Partners', tabBarIcon: icon('shop') }} />
      <Tabs.Screen name="about" options={{ title: 'About', tabBarIcon: icon('info') }} />
    </Tabs>
  );
}
