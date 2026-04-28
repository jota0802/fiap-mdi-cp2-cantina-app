import { useMemo, useState } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import Button from '@/components/Button';
import Input from '@/components/Input';
import Toast from '@/components/Toast';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useShake } from '@/hooks/useShake';
import { haptic } from '@/lib/haptics';
import { validateEmail, validateNome } from '@/lib/validation';
import {
  fontFamily,
  fontSize,
  letterSpacing,
  radius,
  spacing,
} from '@/constants/theme';
import type { ThemeColors } from '@/types';

type Errors = {
  nome?: string;
  email?: string;
  geral?: string;
};

function validar(values: { nome: string; email: string }): Errors {
  const errors: Errors = {};
  const nome = validateNome(values.nome);
  if (nome) errors.nome = nome;
  const email = validateEmail(values.email);
  if (email) errors.email = email;
  return errors;
}

export default function PerfilEditarScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { user, updateUser } = useAuth();
  const { translateX, shake } = useShake();

  const [nome, setNome] = useState(user?.nome ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ visible: boolean; message: string }>({
    visible: false,
    message: '',
  });

  const errors = useMemo(() => validar({ nome, email }), [nome, email]);
  const visibleErrors: Errors = submitted
    ? { ...errors, geral: serverError ?? undefined }
    : {};
  const hasErrors = Object.keys(errors).length > 0;
  const semMudancas = nome.trim() === user?.nome && email.trim() === user?.email;
  const buttonDisabled = (submitted && hasErrors) || semMudancas;

  const handleSalvar = async () => {
    setSubmitted(true);
    setServerError(null);
    if (hasErrors) {
      haptic.error();
      shake();
      return;
    }
    setLoading(true);
    try {
      await updateUser({ nome: nome.trim(), email: email.trim() });
      haptic.success();
      setToast({ visible: true, message: 'Dados atualizados' });
      setTimeout(() => router.back(), 700);
    } catch (e) {
      haptic.error();
      setServerError(e instanceof Error ? e.message : 'Não foi possível salvar');
      shake();
    } finally {
      setLoading(false);
    }
  };

  const handleVoltar = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/perfil');
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.headerNav, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable
          onPress={handleVoltar}
          hitSlop={12}
          style={({ pressed }) => [styles.iconButton, pressed && styles.pressedSoft]}
        >
          <Ionicons name="chevron-back" size={20} color={colors.text} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerEyebrow}>SEUS DADOS</Text>
          <Text style={styles.headerTitulo}>Editar perfil</Text>
        </View>
        <View style={styles.iconButtonSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + spacing['3xl'] },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.form, { transform: [{ translateX }] }]}>
          <Input
            label="Nome completo"
            placeholder="Seu nome"
            icon="person-outline"
            value={nome}
            onChangeText={setNome}
            autoCapitalize="words"
            autoComplete="name"
            error={visibleErrors.nome}
          />
          <Input
            label="E-mail"
            placeholder="seu@email.com"
            icon="mail-outline"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            error={visibleErrors.email}
          />

          {visibleErrors.geral ? (
            <View style={styles.geralErrorBox}>
              <Text style={styles.geralErrorText}>{visibleErrors.geral}</Text>
            </View>
          ) : null}

          <Button
            title="Salvar alterações"
            onPress={handleSalvar}
            loading={loading}
            disabled={buttonDisabled}
            fullWidth
            style={styles.botaoSubmit}
          />

          <View style={styles.dica}>
            <Ionicons name="information-circle-outline" size={14} color={colors.textMuted} />
            <Text style={styles.dicaTexto}>
              A senha é alterada em uma seção separada (em breve).
            </Text>
          </View>
        </Animated.View>
      </ScrollView>

      <Toast
        message={toast.message}
        variant="success"
        visible={toast.visible}
        onHide={() => setToast((p) => ({ ...p, visible: false }))}
      />
    </KeyboardAvoidingView>
  );
}

const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1 },
    headerNav: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingBottom: spacing.lg,
      paddingHorizontal: spacing.xl,
    },
    iconButton: {
      width: 40,
      height: 40,
      borderRadius: radius.full,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
    },
    iconButtonSpacer: { width: 40 },
    headerCenter: {
      alignItems: 'center',
      flex: 1,
    },
    headerEyebrow: {
      fontFamily: fontFamily.semibold,
      fontSize: fontSize.xs,
      color: c.textSubtle,
      letterSpacing: letterSpacing.widest,
    },
    headerTitulo: {
      fontFamily: fontFamily.bold,
      fontSize: fontSize.xl,
      color: c.text,
      marginTop: 2,
    },
    scroll: {
      paddingHorizontal: spacing.xl,
    },
    form: {
      width: '100%',
    },
    geralErrorBox: {
      borderWidth: 1,
      borderColor: c.error,
      backgroundColor: c.surface,
      borderRadius: radius.md,
      padding: spacing.md,
      marginTop: spacing.xs,
      marginBottom: spacing.md,
    },
    geralErrorText: {
      fontFamily: fontFamily.semibold,
      fontSize: fontSize.md,
      color: c.error,
      textAlign: 'center',
    },
    botaoSubmit: {
      marginTop: spacing.md,
    },
    dica: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginTop: spacing.xl,
      paddingHorizontal: spacing.sm,
    },
    dicaTexto: {
      fontFamily: fontFamily.medium,
      fontSize: fontSize.md,
      color: c.textMuted,
      flex: 1,
    },
    pressedSoft: {
      opacity: 0.85,
      transform: [{ scale: 0.98 }],
    },
  });
