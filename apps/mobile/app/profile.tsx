// Profile: create (after welcome), view and edit, or reset. Saved on this device only.
import { router } from 'expo-router';
import { View } from 'react-native';
import { ProfileForm } from '../src/screens/profile/ProfileForm';
import { syncIdentityWithProfile } from '../src/state/identity';
import { profileStore, useProfile, type Profile } from '../src/state/profile';
import { Button, Screen } from '../src/ui/kit';

export default function ProfileScreen() {
  const profile = useProfile();
  const save = (p: Profile) => {
    profileStore.save(p);
    syncIdentityWithProfile();
    router.replace('/');
  };
  const reset = () => {
    profileStore.reset();
    syncIdentityWithProfile();
    router.replace('/welcome');
  };
  return (
    <Screen title={profile ? 'Your profile' : 'About your trip home'} subtitle="One screen. Change it any time.">
      <ProfileForm key={profile?.id ?? 'new'} initial={profile} onSave={save} />
      {profile ? (
        <View style={{ alignItems: 'center', marginTop: 8 }}>
          <Button tone="plain" label="Back" onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} />
          <Button tone="plain" label="Reset profile" hint="forget everything saved on this phone" onPress={reset} />
        </View>
      ) : null}
    </Screen>
  );
}
