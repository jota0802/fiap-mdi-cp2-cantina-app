import { router } from 'expo-router';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import Button from '@/components/Button';
import { useTheme } from '@/context/ThemeContext';
import type { ThemeColors } from '@/types';

export default function Welcome() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Bem-vindo!</Text>
        <Text style={styles.body}>
          Vamos personalizar seu cardápio. Conta um pouco sobre você?
        </Text>
      </View>
      <Button title="Continuar" onPress={() => router.push('/(onboarding)/dados')} />
    </View>
  );
}

function createStyles(c: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.bg, padding: 24, justifyContent: 'space-between' },
    content: { flex: 1, justifyContent: 'center' },
    title: { fontSize: 32, fontWeight: '700', color: c.text, marginBottom: 16 },
    body: { fontSize: 18, color: c.textMuted, lineHeight: 26 },
  });
}
