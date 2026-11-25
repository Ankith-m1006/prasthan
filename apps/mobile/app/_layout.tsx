// Root: fonts (fall back to system fonts if they fail), flags provider, stack.
import { useFonts, Mukta_400Regular, Mukta_700Bold } from '@expo-google-fonts/mukta';
import { TiroKannada_400Regular } from '@expo-google-fonts/tiro-kannada';
import { NotoSansKannada_400Regular } from '@expo-google-fonts/noto-sans-kannada';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { FlagsProvider } from '../src/state/flags';
import { colors } from '../src/theme/tokens';

export default function RootLayout() {
  const [loaded, error] = useFonts({ Mukta_400Regular, Mukta_700Bold, TiroKannada_400Regular, NotoSansKannada_400Regular });
  const [timedOut, setTimedOut] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setTimedOut(true), 2500);
    return () => clearTimeout(t);
  }, []);
  if (!loaded && !error && !timedOut) return null;
  return (
    <FlagsProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.paper } }} />
    </FlagsProvider>
  );
}
