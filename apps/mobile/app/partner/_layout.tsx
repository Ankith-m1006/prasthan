// Partner portal: its own tabs (Dashboard, Orders/Customers, Festivals, Profile). No partner chosen -> welcome.
import { Redirect, Tabs } from 'expo-router';
import { useEffect } from 'react';
import { useWindowDimensions } from 'react-native';
import { Icon, type IconName } from '../../src/ui/icons';
import { colors, fonts } from '../../src/theme/tokens';
import { frost } from '../../src/ui/glass';
import { useRole } from '../../src/state/role';
import { restorePartnerIdentity } from '../../src/screens/partner/session';

const icon = (name: IconName) => ({ color }: { color: unknown }) => <Icon name={name} color={typeof color === 'string' ? color : colors.ink} />;

export default function PartnerLayout() {
  const { role, partner } = useRole();
  const wide = useWindowDimensions().width >= 760;
  useEffect(() => { if (partner) restorePartnerIdentity(partner); }, [partner]);
  if (role !== 'partner' || !partner) return <Redirect href="/welcome" />;
  const ordersTitle = partner.type === 'sweet_shop' ? 'Orders' : 'Customers';
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.ink,
        tabBarInactiveTintColor: colors.inkSoft,
        tabBarStyle: [{ ...frost(0.72, 20), position: 'absolute', borderTopWidth: 0, height: 76, paddingBottom: 12, paddingTop: 8, elevation: 0 },
          wide ? { left: '50%', width: 600, marginLeft: -300, bottom: 18, height: 72, paddingBottom: 8, borderRadius: 36 } : null],
        tabBarLabelStyle: { fontFamily: fonts.bodyBold, fontSize: 13 },
        tabBarActiveBackgroundColor: 'rgba(47, 107, 69, 0.12)',
        tabBarItemStyle: { borderRadius: 28, marginHorizontal: 8, overflow: 'hidden' },
        sceneStyle: { backgroundColor: colors.paper },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Dashboard', tabBarIcon: icon(partner.type === 'bus_operator' ? 'bus' : 'shop') }} />
      <Tabs.Screen name="orders" options={{ title: ordersTitle, tabBarIcon: icon('gift') }} />
      <Tabs.Screen name="festivals" options={{ title: 'Festivals', tabBarIcon: icon('bell') }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: icon('info') }} />
    </Tabs>
  );
}
