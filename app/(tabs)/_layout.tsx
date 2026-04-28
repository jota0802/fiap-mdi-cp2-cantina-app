import { Platform, StyleSheet } from 'react-native';
import { Redirect, Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { fontFamily } from '@/constants/theme';

export default function TabsLayout() {
  const { colors, mode } = useTheme();
  const { user } = useAuth();

  if (!user) {
    return <Redirect href="/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSubtle,
        tabBarBackground: () => (
          <BlurView
            tint={mode === 'dark' ? 'dark' : 'light'}
            intensity={Platform.OS === 'ios' ? 80 : 100}
            style={StyleSheet.absoluteFill}
          />
        ),
        tabBarStyle: {
          backgroundColor: 'transparent',
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 68,
          paddingBottom: 10,
          paddingTop: 8,
          position: 'absolute',
        },
        tabBarLabelStyle: {
          fontFamily: fontFamily.semibold,
          fontSize: 10,
          letterSpacing: 0.5,
          textTransform: 'uppercase',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'INÍCIO',
          tabBarIcon: ({ color }: { color: string }) => (
            <Ionicons name="home-outline" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="cardapio"
        options={{
          title: 'CARDÁPIO',
          tabBarIcon: ({ color }: { color: string }) => (
            <Ionicons name="restaurant-outline" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="pedidos"
        options={{
          title: 'PEDIDOS',
          tabBarIcon: ({ color }: { color: string }) => (
            <Ionicons name="receipt-outline" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: 'PERFIL',
          tabBarIcon: ({ color }: { color: string }) => (
            <Ionicons name="person-outline" size={22} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
