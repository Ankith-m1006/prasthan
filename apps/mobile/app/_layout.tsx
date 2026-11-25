// Root: fonts (fall back to system fonts if they fail), flags provider, stack.
import { useFonts } from 'expo-font';
import { Mukta_400Regular } from '@expo-google-fonts/mukta/400Regular';
import { Mukta_700Bold } from '@expo-google-fonts/mukta/700Bold';
import { TiroKannada_400Regular } from '@expo-google-fonts/tiro-kannada/400Regular';
import { NotoSansKannada_400Regular } from '@expo-google-fonts/noto-sans-kannada/400Regular';
import { NotoSansKannada_700Bold } from '@expo-google-fonts/noto-sans-kannada/700Bold';
import { NotoSansTamil_400Regular } from '@expo-google-fonts/noto-sans-tamil/400Regular';
import { NotoSansTamil_700Bold } from '@expo-google-fonts/noto-sans-tamil/700Bold';
import { NotoSansTelugu_400Regular } from '@expo-google-fonts/noto-sans-telugu/400Regular';
import { NotoSansTelugu_700Bold } from '@expo-google-fonts/noto-sans-telugu/700Bold';
import { NotoSansDevanagari_400Regular } from '@expo-google-fonts/noto-sans-devanagari/400Regular';
import { NotoSansDevanagari_700Bold } from '@expo-google-fonts/noto-sans-devanagari/700Bold';
import { NotoSansOriya_400Regular } from '@expo-google-fonts/noto-sans-oriya/400Regular';
import { NotoSansOriya_700Bold } from '@expo-google-fonts/noto-sans-oriya/700Bold';
import { NotoSansBengali_400Regular } from '@expo-google-fonts/noto-sans-bengali/400Regular';
import { NotoSansBengali_700Bold } from '@expo-google-fonts/noto-sans-bengali/700Bold';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { FlagsProvider } from '../src/state/flags';
import { colors } from '../src/theme/tokens';

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Mukta_400Regular, Mukta_700Bold, TiroKannada_400Regular,
    // Noto Sans per Indian script, regular + bold only (keeps the bundle small): kn, ta, te, hi, or, bn
    NotoSansKannada_400Regular, NotoSansKannada_700Bold, NotoSansTamil_400Regular, NotoSansTamil_700Bold,
    NotoSansTelugu_400Regular, NotoSansTelugu_700Bold, NotoSansDevanagari_400Regular, NotoSansDevanagari_700Bold,
    NotoSansOriya_400Regular, NotoSansOriya_700Bold, NotoSansBengali_400Regular, NotoSansBengali_700Bold,
  });
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
