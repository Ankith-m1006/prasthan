// Partner first steps: choose a type -> pick an existing business of that type, or register yours (no password, demo).
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import type { Partner, PartnerType } from '@contract';
import { api } from '../../api';
import { Banner, Body, Button, Chip, H2, Screen, Small } from '../../ui/kit';
import { Icon } from '../../ui/icons';
import { Monogram, partnerName } from '../../ui/logos';
import { mergePartners, roleStore, useRole } from '../../state/role';
import { RegisterForm } from './RegisterForm';
import { enterPartner } from './session';

export const TYPE_NAME: Record<PartnerType, string> = { bus_operator: 'Bus operator', sweet_shop: 'Sweet shop', quick_commerce: 'Quick commerce' };
const TYPE_ICON: Record<PartnerType, 'bus' | 'gift' | 'shop'> = { bus_operator: 'bus', sweet_shop: 'gift', quick_commerce: 'shop' };
const TYPE_HINT: Record<PartnerType, string> = {
  bus_operator: 'see demand with no seats yet, add buses',
  sweet_shop: 'pre-orders per pickup point and day',
  quick_commerce: 'where departing travellers need things',
};

export function PartnerOnboard({ onBack }: { onBack: () => void }) {
  const [type, setType] = useState<PartnerType | null>(null);
  const [registering, setRegistering] = useState(false);
  if (type && registering) {
    return <RegisterForm type={type} onBack={() => setRegistering(false)} onDone={(p) => { roleStore.addRegistered(p); enterPartner(p); }} />;
  }
  if (type) return <PickPartner type={type} onBack={() => setType(null)} onRegister={() => setRegistering(true)} />;
  return (
    <Screen demoTag title="I'm a partner" subtitle="What kind of business do you run?">
      <View style={{ alignItems: 'center', gap: 4, marginTop: 8 }}>
        {(Object.keys(TYPE_NAME) as PartnerType[]).map((t) => (
          <Button key={t} tone={t === 'bus_operator' ? 'primary' : 'plain'} label={TYPE_NAME[t]} hint={TYPE_HINT[t]} icon={<Icon name={TYPE_ICON[t]} />} onPress={() => setType(t)} />
        ))}
        <Button tone="plain" label="Back" onPress={onBack} />
      </View>
    </Screen>
  );
}

function PickPartner({ type, onBack, onRegister }: { type: PartnerType; onBack: () => void; onRegister: () => void }) {
  const { registered } = useRole();
  const [list, setList] = useState<Partner[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    void api.partners(type).then((r) => setList(r.partners)).catch(() => { setList([]); setError('Could not load businesses just now. You can still register yours.'); });
  }, [type]);
  const all = mergePartners(list ?? [], registered).filter((p) => p.type === type);
  return (
    <Screen demoTag title={TYPE_NAME[type]} subtitle="Pick your business to open its dashboard. No password in this demo.">
      {error ? <Banner text={error} /> : null}
      {list === null ? <Body>Loading businesses...</Body> : null}
      <View style={s.list}>
        {all.map((p) => (
          <View key={p.id} style={s.row}>
            <Monogram name={p.name} id={p.id} size={38} />
            <Chip label={partnerName(p.name) + (p.registered ? '  (registered)' : '')} onPress={() => enterPartner(p)} />
          </View>
        ))}
      </View>
      <H2>New here?</H2>
      <Small>Register in under a minute: name, nearest boarding point{type === 'sweet_shop' ? ', a few sweets with prices' : type === 'bus_operator' ? ', routes and seats per night' : ''}.</Small>
      <View style={{ alignItems: 'center', marginTop: 10 }}>
        <Button label="Register my business" onPress={onRegister} />
        <Button tone="plain" label="Back" onPress={onBack} />
      </View>
    </Screen>
  );
}

const s = StyleSheet.create({
  list: { gap: 6, marginTop: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
});
