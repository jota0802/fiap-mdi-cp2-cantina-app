import { Redirect, Stack } from 'expo-router';

import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';

export default function AuthLayout() {
  const { colors } = useTheme();
  const { user } = useAuth();

  if (user) {
    return <Redirect href="/" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg },
        animation: 'fade',
      }}
    />
  );
}
