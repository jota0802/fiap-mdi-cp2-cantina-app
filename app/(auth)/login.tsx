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
import { Link, useRouter } from 'expo-router';

import Button from '@/components/Button';
import FiapLogo from '@/components/FiapLogo';
import Input from '@/components/Input';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useFadeIn } from '@/hooks/useFadeIn';
import { useShake } from '@/hooks/useShake';
import { haptic } from '@/lib/haptics';
import { validateEmail, validateSenha } from '@/lib/validation';
import { fontFamily, fontSize, spacing } from '@/constants/theme';
import type { ThemeColors } from '@/types';

type Errors = {
  email?: string;
  senha?: string;
  geral?: string;
};

function validar(values: { email: string; senha: string }): Errors {
  const errors: Errors = {};
  const email = validateEmail(values.email);
  if (email) errors.email = email;
  const senha = validateSenha(values.senha);
  if (senha) errors.senha = senha;
  return errors;
}

export default function LoginScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();
  const { signIn } = useAuth();
  const { translateX, shake } = useShake();
  const { opacity, translateY } = useFadeIn(400);

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const errors = useMemo(() => validar({ email, senha }), [email, senha]);
  const visibleErrors: Errors = submitted
    ? { ...errors, geral: serverError ?? undefined }
    : {};
  const hasErrors = Object.keys(errors).length > 0;
  const buttonDisabled = submitted && hasErrors;

  const handleLogin = async () => {
    setSubmitted(true);
    setServerError(null);
    if (hasErrors) {
      haptic.error();
      shake();
      return;
    }
    setLoading(true);
    const result = await signIn({ email, senha });
    setLoading(false);
    if (!result.success) {
      haptic.error();
      setServerError(result.error);
      shake();
      return;
    }
    haptic.success();
    router.replace('/');
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + spacing['4xl'], paddingBottom: insets.bottom + spacing['4xl'] },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.header, { opacity, transform: [{ translateY }] }]}>
          <FiapLogo width={64} color={colors.primary} />
          <Text style={styles.titulo}>Bem-vindo</Text>
          <Text style={styles.subtitulo}>Entre para fazer seus pedidos</Text>
        </Animated.View>

        <Animated.View style={[styles.form, { transform: [{ translateX }] }]}>
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
          <Input
            label="Senha"
            placeholder="••••••"
            icon="lock-closed-outline"
            value={senha}
            onChangeText={setSenha}
            secureTextEntry
            autoCapitalize="none"
            autoComplete="password"
            error={visibleErrors.senha}
          />

          {visibleErrors.geral ? (
            <View style={styles.geralErrorBox}>
              <Text style={styles.geralErrorText}>{visibleErrors.geral}</Text>
            </View>
          ) : null}

          <Button
            title="Entrar"
            onPress={handleLogin}
            loading={loading}
            disabled={buttonDisabled}
            fullWidth
            style={styles.botaoSubmit}
          />

          <Link href="/recover-senha" asChild>
            <Pressable
              hitSlop={8}
              style={styles.esqueceuRow}
              accessibilityRole="link"
              accessibilityLabel="Recuperar senha"
            >
              <Text style={styles.esqueceuTexto}>Esqueceu sua senha?</Text>
            </Pressable>
          </Link>

          <View style={styles.linkRow}>
            <Text style={styles.linkText}>Ainda não tem conta?</Text>
            <Link href="/cadastro" asChild>
              <Pressable
                hitSlop={8}
                accessibilityRole="link"
                accessibilityLabel="Ir para a tela de cadastro"
              >
                <Text style={styles.linkAccent}>Cadastre-se</Text>
              </Pressable>
            </Link>
          </View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1 },
    scroll: {
      flexGrow: 1,
      paddingHorizontal: spacing['2xl'],
      justifyContent: 'center',
    },
    header: {
      alignItems: 'center',
      marginBottom: spacing['2xl'],
    },
    titulo: {
      fontFamily: fontFamily.extrabold,
      fontSize: fontSize['3xl'],
      color: c.text,
      marginTop: spacing.lg,
    },
    subtitulo: {
      fontFamily: fontFamily.medium,
      fontSize: fontSize.base,
      color: c.textMuted,
      marginTop: spacing.sm,
    },
    form: {
      width: '100%',
    },
    geralErrorBox: {
      borderWidth: 1,
      borderColor: c.error,
      backgroundColor: c.surface,
      borderRadius: 12,
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
    esqueceuRow: {
      alignItems: 'center',
      paddingVertical: spacing.md,
      marginTop: spacing.sm,
    },
    esqueceuTexto: {
      fontFamily: fontFamily.semibold,
      fontSize: fontSize.md,
      color: c.textMuted,
    },
    linkRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: spacing.sm,
      marginTop: spacing['2xl'],
    },
    linkText: {
      fontFamily: fontFamily.regular,
      fontSize: fontSize.md,
      color: c.textMuted,
    },
    linkAccent: {
      fontFamily: fontFamily.bold,
      fontSize: fontSize.md,
      color: c.primary,
    },
  });
