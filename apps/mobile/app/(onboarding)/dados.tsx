import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import Button from '@/components/Button';
import Input from '@/components/Input';
import { useTheme } from '@/context/ThemeContext';
import type { ThemeColors } from '@/types';

export default function Dados() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [name, setName] = useState('');
  const [rm, setRm] = useState('');

  const nameValid = name.trim().length >= 2;
  const rmValid = /^[0-9]{6}$/.test(rm);
  const canContinue = nameValid && rmValid;

  function handleRmChange(text: string) {
    const clean = text.replace(/[^0-9]/g, '').slice(0, 6);
    setRm(clean);
  }

  function handleContinue() {
    router.push({
      pathname: '/(onboarding)/cantina',
      params: { name: name.trim(), rm },
    });
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Sobre você</Text>
        <Input
          label="Nome"
          value={name}
          onChangeText={setName}
          placeholder="Como podemos te chamar?"
          error={name.length > 0 && !nameValid ? 'Mínimo 2 caracteres' : undefined}
        />
        <Input
          label="RM"
          value={rm}
          onChangeText={handleRmChange}
          placeholder="6 dígitos"
          keyboardType="number-pad"
          maxLength={6}
          error={rm.length > 0 && !rmValid ? 'RM precisa ter exatamente 6 dígitos' : undefined}
        />
      </View>
      <Button title="Continuar" onPress={handleContinue} disabled={!canContinue} />
    </View>
  );
}

function createStyles(c: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.bg, padding: 24, justifyContent: 'space-between' },
    content: { flex: 1, justifyContent: 'center', gap: 16 },
    title: { fontSize: 28, fontWeight: '700', color: c.text, marginBottom: 24 },
  });
}
