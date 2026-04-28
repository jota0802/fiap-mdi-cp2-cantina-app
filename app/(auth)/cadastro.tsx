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
import { haptic } from '@/lib/haptics';
import { fontFamily, fontSize, letterSpacing, spacing } from '@/constants/theme';
import type { ThemeColors } from '@/types';

type FormValues = {
  nome: string;
  email: string;
  senha: string;
  confirmaSenha: string;
};

type Errors = Partial<Record<keyof FormValues | 'geral', string>>;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validar(values: FormValues): Errors {
  const errors: Errors = {};
  if (!values.nome.trim()) {
    errors.nome = 'O nome é obrigatório';
  } else if (values.nome.trim().length < 2) {
    errors.nome = 'Nome muito curto';
  }
  const email = values.email.trim();
  if (!email) {
    errors.email = 'O e-mail é obrigatório';
  } else if (!EMAIL_REGEX.test(email)) {
    errors.email = 'E-mail inválido';
  }
  if (!values.senha) {
    errors.senha = 'A senha é obrigatória';
  } else if (values.senha.length < 6) {
    errors.senha = 'A senha deve ter no mínimo 6 caracteres';
  }
  if (!values.confirmaSenha) {
    errors.confirmaSenha = 'Confirme sua senha';
  } else if (values.confirmaSenha !== values.senha) {
    errors.confirmaSenha = 'As senhas não coincidem';
  }
  return errors;
}

export default function CadastroScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();
  const { signUp } = useAuth();
  const { translateX, shake } = useShake();
  const { opacity, translateY } = useFadeIn(400);

  const [values, setValues] = useState<FormValues>({
    nome: '',
    email: '',
    senha: '',
    confirmaSenha: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const errors = useMemo(() => validar(values), [values]);
  const visibleErrors: Errors = submitted
    ? { ...errors, geral: serverError ?? undefined }
    : {};
  const hasErrors = Object.keys(errors).length > 0;
  const buttonDisabled = submitted && hasErrors;

  const setField = <K extends keyof FormValues>(field: K, value: FormValues[K]) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  };

  const handleCadastro = async () => {
    setSubmitted(true);
    setServerError(null);
    if (hasErrors) {
      haptic.error();
      shake();
      return;
    }
    setLoading(true);
    const result = await signUp({
      nome: values.nome,
      email: values.email,
      senha: values.senha,
    });
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
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.header, { opacity, transform: [{ translateY }] }]}>
          <FiapLogo width={70} color={colors.primary} />
          <Text style={styles.titulo}>CRIAR CONTA</Text>
          <Text style={styles.subtitulo}>Cadastre-se para começar a usar</Text>
        </Animated.View>

        <Animated.View style={[styles.form, { transform: [{ translateX }] }]}>
          <Input
            label="Nome completo"
            placeholder="Seu nome"
            icon="person-outline"
            value={values.nome}
            onChangeText={(v) => setField('nome', v)}
            autoCapitalize="words"
            autoComplete="name"
            error={visibleErrors.nome}
          />
          <Input
            label="E-mail"
            placeholder="seu@email.com"
            icon="mail-outline"
            value={values.email}
            onChangeText={(v) => setField('email', v)}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            error={visibleErrors.email}
          />
          <Input
            label="Senha"
            placeholder="Mínimo 6 caracteres"
            icon="lock-closed-outline"
            value={values.senha}
            onChangeText={(v) => setField('senha', v)}
            secureTextEntry
            autoCapitalize="none"
            error={visibleErrors.senha}
          />
          <Input
            label="Confirmar senha"
            placeholder="Repita a senha"
            icon="lock-closed-outline"
            value={values.confirmaSenha}
            onChangeText={(v) => setField('confirmaSenha', v)}
            secureTextEntry
            autoCapitalize="none"
            error={visibleErrors.confirmaSenha}
          />

          {visibleErrors.geral ? (
            <View style={styles.geralErrorBox}>
              <Text style={styles.geralErrorText}>{visibleErrors.geral}</Text>
            </View>
          ) : null}

          <Button
            title="Cadastrar"
            onPress={handleCadastro}
            loading={loading}
            disabled={buttonDisabled}
            fullWidth
            style={styles.botaoSubmit}
          />

          <View style={styles.linkRow}>
            <Text style={styles.linkText}>Já tem conta?</Text>
            <Link href="/login" asChild>
              <Pressable hitSlop={8}>
                <Text style={styles.linkAccent}>FAZER LOGIN</Text>
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
