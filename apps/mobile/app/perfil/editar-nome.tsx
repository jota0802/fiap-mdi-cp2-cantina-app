import { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Button from '@/components/Button';
import Input from '@/components/Input';
import { fontFamily, fontSize, spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import type { ThemeColors } from '@/types';

export default function EditarNome() {
  const { user, updateMe } = useAuth();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [name, setName] = useState(user?.name ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trimmed = name.trim();
  const disabled = trimmed.length < 2 || trimmed === (user?.name ?? '');

  async function handleSave() {
    if (disabled) return;
    setLoading(true);
    setError(null);
    try {
      await updateMe({ name: trimmed });
      if (router.canGoBack()) router.back();
      else router.replace('/(tabs)/perfil');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar nome');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top + spacing.lg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Text style={styles.title}>Editar nome</Text>

      <Input
        label="Nome"
        placeholder="Seu nome completo"
        value={name}
        onChangeText={setName}
        autoCapitalize="words"
        autoComplete="name"
        error={error ?? undefined}
      />

      <Button
        title="Salvar"
        onPress={handleSave}
        loading={loading}
        disabled={disabled}
        fullWidth
      />
    </KeyboardAvoidingView>
  );
}

function createStyles(c: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      padding: spacing.xl,
      backgroundColor: c.bg,
      gap: spacing.lg,
    },
    title: {
      fontFamily: fontFamily.extrabold,
      fontSize: fontSize['3xl'],
      color: c.text,
      marginBottom: spacing.md,
    },
  });
}
