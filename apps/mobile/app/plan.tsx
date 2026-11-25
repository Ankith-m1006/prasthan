// "Plan my trip home" from the Calendar: the usual trip from the profile, the day before the festival, with booking
// links, rush warnings and Alert me. Same TripCard + Options as Speak.
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import type { OptionsResponse, TripIntent } from '@contract';
import { api } from '../src/api';
import { askNotifyPermission } from '../src/lib/notify';
import { BUNDLED, dayLabel, planTrip, todayIST } from '../src/lib/festivals';
import { travelHints } from '../src/lib/profileUse';
import { Options } from '../src/screens/speak/Options';
import { TripCard } from '../src/screens/speak/TripCard';
import { useFestivals } from '../src/state/festivals';
import { getIdentity } from '../src/state/identity';
import { useProfile } from '../src/state/profile';
import { colors } from '../src/theme/tokens';
import { Body, Button, Screen, Section } from '../src/ui/kit';

export default function Plan() {
  const { festival: id } = useLocalSearchParams<{ festival?: string }>();
  const profile = useProfile();
  const { list } = useFestivals();
  const fest = useMemo(() => list.find((f) => f.id === id) ?? BUNDLED.find((f) => f.id === id) ?? null, [list, id]);
  const [intent, setIntent] = useState<TripIntent | null>(null);
  const [options, setOptions] = useState<OptionsResponse | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  useEffect(() => { if (profile && fest && !intent) setIntent(planTrip(profile, fest, getIdentity().traveller, todayIST())); }, [profile, fest, intent]);
  useEffect(() => {
    if (!intent?.routeId) return;
    void api.options(intent.routeId, intent.dateFrom, intent.mode, intent.people).then(setOptions).catch(() => setOptions(null));
  }, [intent?.routeId, intent?.dateFrom, intent?.mode, intent?.people]);

  const alertMe = async () => {
    if (!intent) return;
    void askNotifyPermission();
    try { await api.saveTrip({ ...intent, travellerId: getIdentity().traveller }); setSaved('Done. I will tell you when a new bus opens.'); }
    catch { setSaved('Could not save the alert just now. Please try again in a moment.'); }
  };

  if (!fest || !profile) {
    return <Screen title="Plan my trip home"><Body>Pick a festival in the Calendar first.</Body><Button label="Open Calendar" onPress={() => router.replace('/calendar')} /></Screen>;
  }
  return (
    <Screen title={`Home for ${fest.name}`} subtitle={`${dayLabel(fest.date)}. Travel the day before${intent?.dateFrom ? `: ${dayLabel(intent.dateFrom)}` : ''}.`}>
      {intent ? <TripCard intent={intent} onChange={setIntent} /> : null}
      {options && intent ? <Options options={options} lang={profile.language} hints={travelHints(profile, options.mode)} /> : null}
      {intent?.routeId ? (
        <Section>
          <Button tone="leaf" label={saved?.startsWith('Done') ? 'Alert is on' : 'Alert me when a new bus opens'} onPress={() => void alertMe()} />
          {saved ? <Body style={{ textAlign: 'center', color: saved.startsWith('Done') ? colors.mangoLeaf : colors.kumkum }}>{saved}</Body> : null}
        </Section>
      ) : null}
      <Button tone="plain" label="Or say it in your own words (Speak)" onPress={() => router.push('/')} />
    </Screen>
  );
}
