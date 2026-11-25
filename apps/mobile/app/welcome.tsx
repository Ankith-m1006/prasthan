// First launch: what Prasthan is + "Continue as guest". No login, no OTP, no SMS.
import { router } from 'expo-router';
import { View } from 'react-native';
import { Body, Button, Screen, Section, Small } from '../src/ui/kit';
import { PRIVACY_LINE } from '../src/screens/profile/ProfileForm';

export default function Welcome() {
  return (
    <Screen title="ಪ್ರಸ್ಥಾನ Prasthan" subtitle="Your festival trip home, in your own language.">
      <Section>
        <Body>Tell us your home town once. Then just say "Friday night" and we fill in the rest, link you to the official booking sites, and tell you when a new bus opens.</Body>
      </Section>
      <View style={{ alignItems: 'center' }}>
        <Button label="Continue as guest" hint="no sign-up, no OTP" onPress={() => router.push('/profile')} />
        <Small style={{ textAlign: 'center', marginTop: 8 }}>{PRIVACY_LINE}</Small>
      </View>
    </Screen>
  );
}
