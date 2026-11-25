// "Share on WhatsApp" under the trip card: opens wa.me with the trip summary in the traveller's language.
import { Linking, Platform } from 'react-native';
import type { Lang, TripIntent } from '@contract';
import { tripSummary, whatsappUrl } from '../../lib/share';
import { Button } from '../../ui/kit';

export function ShareTrip({ intent, reply, lang }: { intent: TripIntent; reply: string | null; lang: Lang }) {
  const open = () => {
    const url = whatsappUrl(tripSummary(intent, reply, lang));
    if (Platform.OS === 'web' && typeof window !== 'undefined') window.open(url, '_blank', 'noopener');
    else void Linking.openURL(url);
  };
  return <Button tone="plain" label="Share on WhatsApp" onPress={open} hint="Opens WhatsApp with your trip" />;
}
