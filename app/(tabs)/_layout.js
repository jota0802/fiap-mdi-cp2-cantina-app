import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#ED145B',
        tabBarInactiveTintColor: '#444444',
        tabBarStyle: {
          backgroundColor: '#0A0A0A',
          borderTopColor: '#1A1A1A',
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 10,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontFamily: 'Manrope_600SemiBold',
          fontSize: 10,
          letterSpacing: 0.5,
          textTransform: 'uppercase',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'INICIO',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="cardapio"
        options={{
          title: 'CARDAPIO',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="restaurant-outline" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="sobre"
        options={{
          title: 'SOBRE',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="information-circle-outline" size={22} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
