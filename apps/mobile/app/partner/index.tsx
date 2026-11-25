// Partner dashboard: one per business type.
import { useRole } from '../../src/state/role';
import { BusDashboard } from '../../src/screens/partner/BusDashboard';
import { ShopDashboard } from '../../src/screens/partner/ShopDashboard';
import { QcDashboard } from '../../src/screens/partner/QcDashboard';

export default function PartnerHome() {
  const { partner } = useRole();
  if (!partner) return null;
  if (partner.type === 'bus_operator') return <BusDashboard partner={partner} />;
  if (partner.type === 'sweet_shop') return <ShopDashboard partner={partner} />;
  return <QcDashboard partner={partner} />;
}
