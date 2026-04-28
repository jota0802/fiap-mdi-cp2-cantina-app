import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  useFonts,
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
} from '@expo-google-fonts/manrope';

import { AuthProvider, useAuth } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';
import LoadingScreen from '@/components/LoadingScreen';

function RootStack() {
  const { mode } = useTheme();
  const { isHydrating } = useAuth();

  if (isHydrating) {
    return <LoadingScreen label="APP CANTINA" subtitle="VERIFICANDO SESSÃO" />;
  }

  return (
    <>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="confirmacao"
          options={{ animation: 'slide_from_bottom' }}
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
      <AuthProvider>
        <CartProvider>
          {fontsLoaded ? <RootStack /> : <ThemedSplash />}
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
