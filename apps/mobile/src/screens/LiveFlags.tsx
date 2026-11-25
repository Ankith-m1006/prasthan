// Read-only view of the flags the app is running on right now, read live from Flagsmith.
// Flip them in the Flagsmith dashboard; this list (and the whole app) follows within ~10 s.
import { View } from 'react-native';
import type { FlagsView } from '@contract';
import { useFlags } from '../state/flags';
import { getIdentity, currentIdentity } from '../state/identity';
import { traitsOf } from '../api/mock';
import { Glass, H2, Small } from '../ui/kit';

function show(f: FlagsView): Array<[string, string]> {
  const on = (b: boolean) => (b ? 'on' : 'off');
  return [
    ['festival_mode', `${f.festival_mode.title} (${f.festival_mode.theme})`],
    ['voice_fallback_offline', on(f.voice_fallback_offline)],
    ['voice_enabled', on(f.voice_enabled)],
    ['gifting_enabled', on(f.gifting_enabled)],
    ['operator_add_service', on(f.operator_add_service)],
    ['shop_orders_view', on(f.shop_orders_view)],
    ['quick_commerce_view', on(f.quick_commerce_view)],
    ['special_service_announcements', `${f.special_service_announcements.length} active`],
    ['surge_warning', `warn at ${f.surge_warning.warnAtMultiplier}x, tout warning ${on(f.surge_warning.showToutWarning)}`],
    ['tts_model', f.tts_model],
    ['stt_mode', f.stt_mode],
    ['reply_style', f.reply_style],
    ['live_data_source', f.live_data_source],
    ['alert_poll_seconds', String(f.alert_poll_seconds)],
  ];
}

export function LiveFlagValues() {
  const { flags } = useFlags();
  const id = currentIdentity();
  const t = traitsOf(id);
  const who = getIdentity().mode === 'partner' ? `partner ${t.partner_type ?? ''}` : `traveller, ${t.home_state ?? ''}, ${t.language ?? ''}`;
  return (
    <Glass>
      <H2>Live flag values (Flagsmith)</H2>
      <Small>Read live from Flagsmith for identity {id} ({who}), refreshed every 10 seconds. Change these in the Flagsmith dashboard; the app follows within seconds.</Small>
      <View style={{ marginTop: 10, gap: 4 }}>
        {show(flags).map(([k, v]) => <Small key={k}>{k}: {v}</Small>)}
      </View>
    </Glass>
  );
}
