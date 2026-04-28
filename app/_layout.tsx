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
import { OrdersProvider } from '@/context/OrdersContext';
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
        <Stack.Screen
          name="sobre"
          options={{ animation: 'slide_from_right' }}
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
          <OrdersProvider>
            {fontsLoaded ? <RootStack /> : <ThemedSplash />}
          </OrdersProvider>
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
