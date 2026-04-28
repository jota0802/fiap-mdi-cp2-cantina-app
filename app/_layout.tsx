import { useCallback, useEffect, useState } from 'react';
import { LogBox, Platform } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';

if (Platform.OS === 'web') {
  // RN Web emite warnings deprecation/runtime sem impacto funcional.
  // Silenciar pra console limpo no dev.
  LogBox.ignoreLogs([
    'useNativeDriver',
    '"shadow*" style props are deprecated',
    '[expo-notifications]',
    'pointerEvents is deprecated',
  ]);
  // No web também sobrescreve console.warn pra esses padrões (LogBox não cobre 100%)
  const origWarn = console.warn;
  console.warn = (...args: unknown[]) => {
    const first = typeof args[0] === 'string' ? args[0] : '';
    if (
      first.includes('useNativeDriver') ||
      first.includes('"shadow*"') ||
      first.includes('[expo-notifications]') ||
      first.includes('pointerEvents is deprecated')
    ) {
      return;
    }
    origWarn(...args);
  };
}
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
import { FavoritesProvider } from '@/context/FavoritesContext';
import { OrdersProvider } from '@/context/OrdersContext';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';
import LoadingScreen from '@/components/LoadingScreen';
import Onboarding from '@/components/Onboarding';
import { STORAGE_KEYS } from '@/constants/storage-keys';

function useOnboarded() {
  const [onboarded, setOnboarded] = useState<boolean | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEYS.ONBOARDED)
      .then((v) => setOnboarded(v === 'true'))
      .catch(() => setOnboarded(true));
  }, []);

  const markOnboarded = useCallback(async () => {
    setOnboarded(true);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDED, 'true');
    } catch {
      // armazenamento falha silenciosamente — não bloqueia o app
    }
  }, []);

  return { onboarded, markOnboarded };
}

function RootStack() {
  const { mode } = useTheme();
  const { isHydrating } = useAuth();
  const { onboarded, markOnboarded } = useOnboarded();

  if (isHydrating || onboarded === null) {
    return <LoadingScreen label="App Cantina" subtitle="Verificando sessão" />;
  }

  if (!onboarded) {
    return (
      <>
        <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
        <Onboarding onComplete={markOnboarded} />
      </>
    );
  }

  return (
    <>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="carrinho"
          options={{ animation: 'slide_from_bottom' }}
        />
        <Stack.Screen
          name="confirmacao"
          options={{ animation: 'slide_from_bottom' }}
        />
        <Stack.Screen
          name="sobre"
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="perfil-editar"
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="pedido/[id]"
          options={{ animation: 'slide_from_right' }}
        />
      </Stack>
    </>
  );
}

function ThemedSplash() {
  return <LoadingScreen label="App Cantina" subtitle="Preparando o ambiente" />;
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
            <FavoritesProvider>
              {fontsLoaded ? <RootStack /> : <ThemedSplash />}
            </FavoritesProvider>
          </OrdersProvider>
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
