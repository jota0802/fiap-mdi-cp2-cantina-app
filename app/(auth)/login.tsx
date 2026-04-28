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
import { Link, useRouter } from 'expo-router';

import Button from '@/components/Button';
import FiapLogo from '@/components/FiapLogo';
import Input from '@/components/Input';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useFadeIn } from '@/hooks/useFadeIn';
import { useShake } from '@/hooks/useShake';
import { fontFamily, fontSize, letterSpacing, spacing } from '@/constants/theme';
import type { ThemeColors } from '@/types';

type Errors = {
  email?: string;
  senha?: string;
  geral?: string;
};

function validar(values: { email: string; senha: string }): Errors {
  const errors: Errors = {};
  const email = values.email.trim();
  if (!email) {
    errors.email = 'O e-mail é obrigatório';
  } else if (!email.includes('@') || !email.includes('.')) {
    errors.email = 'E-mail inválido';
  }
  if (!values.senha) {
    errors.senha = 'A senha é obrigatória';
  } else if (values.senha.length < 6) {
    errors.senha = 'A senha deve ter no mínimo 6 caracteres';
  }
  return errors;
}

export default function LoginScreen() {
  const { colors } = useTheme();
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
      shake();
      return;
    }
    setLoading(true);
    const result = await signIn({ email, senha });
    setLoading(false);
    if (!result.success) {
      setServerError(result.error);
      shake();
      return;
    }
    router.replace('/');
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.header, { opacity, transform: [{ translateY }] }]}>
          <FiapLogo width={70} color={colors.primary} />
          <Text style={styles.titulo}>BEM-VINDO</Text>
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

          <View style={styles.linkRow}>
            <Text style={styles.linkText}>Ainda não tem conta?</Text>
            <Link href="/cadastro" asChild>
              <Pressable hitSlop={8}>
                <Text style={styles.linkAccent}>CADASTRE-SE</Text>
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
      paddingTop: spacing['6xl'],
      paddingBottom: spacing['4xl'],
      justifyContent: 'center',
    },
    header: {
      alignItems: 'center',
      marginBottom: spacing['3xl'],
    },
    titulo: {
      fontFamily: fontFamily.extrabold,
      fontSize: fontSize['3xl'],
      color: c.text,
      letterSpacing: letterSpacing.ultra,
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
      backgroundColor: c.card,
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
      letterSpacing: letterSpacing.normal,
    },
  });
