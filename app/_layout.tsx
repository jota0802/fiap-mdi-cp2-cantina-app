import { Stack } from 'expo-router';
import {
  useFonts,
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
} from '@expo-google-fonts/manrope';
import { StatusBar } from 'expo-status-bar';

import { ThemeProvider, useTheme } from '@/context/ThemeContext';
import LoadingScreen from '@/components/LoadingScreen';

function RootStack() {
  const { mode } = useTheme();

  return (
    <>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="confirmacao"
          options={{
            animation: 'slide_from_bottom',
          }}
        />
      </Stack>
    </>
  );
}

function ThemedSplash() {
  return <LoadingScreen label="APP CANTINA" subtitle="PREPARANDO O AMBIENTE" />;
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
  });

  return (
    <ThemeProvider>
      {fontsLoaded ? <RootStack /> : <ThemedSplash />}
    </ThemeProvider>
  );
}
