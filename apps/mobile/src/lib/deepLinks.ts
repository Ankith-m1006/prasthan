// Route pages on public booking sites. Only patterns we checked by hand (25 Nov 2026: real URLs gave 200
// and a route page, not the homepage). Anything else keeps the homepage link the api sent.
// redBus: https://www.redbus.in/bus-tickets/<from>-to-<to> with redBus's own lowercase city slugs.
const REDBUS_SLUG: Record<string, string> = {
  'BLR-HBL': 'bangalore-to-hubli',
  'BLR-BGM': 'bangalore-to-belagavi',
  'BLR-KLB': 'bangalore-to-gulbarga',
  'BLR-MLR': 'bangalore-to-mangalore',
  'BLR-MDU': 'bangalore-to-madurai',
  'BLR-TEN': 'bangalore-to-tirunelveli',
  'BLR-BZA': 'bangalore-to-vijayawada',
  'BLR-BBI': 'bangalore-to-bhubaneswar',
  'BLR-PNBE': 'bangalore-to-patna',
  // BLR-CCU (Kolkata): redBus has no route page at bangalore-to-kolkata, so it stays on the homepage.
};

/** The route page for this provider + route if we know one, else the link we were given. */
export function routeLink(providerId: string, fallbackUrl: string, routeId: string | null): string {
  if (!routeId) return fallbackUrl;
  if (providerId === 'redbus' && REDBUS_SLUG[routeId]) return `https://www.redbus.in/bus-tickets/${REDBUS_SLUG[routeId]}`;
  return fallbackUrl;
}

/** True when routeLink would open a route page (so the button can say "opens route page"). */
export function hasRoutePage(providerId: string, routeId: string | null): boolean {
  return Boolean(routeId && providerId === 'redbus' && REDBUS_SLUG[routeId]);
}
