import { Link, useRouter } from 'expo-router';
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

import Button from '@/components/Button';
import FiapLogo from '@/components/FiapLogo';
import Input from '@/components/Input';
import { fontFamily, fontSize, spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useLocale } from '@/context/LocaleContext';
import { useTheme } from '@/context/ThemeContext';
import { useFadeIn } from '@/hooks/useFadeIn';
import { useShake } from '@/hooks/useShake';
import { haptic } from '@/lib/haptics';
import {
  validateConfirmaSenha,
  validateEmail,
  validateNome,
  validateSenha,
  type ValidationError,
} from '@/lib/validation';
import type { ThemeColors } from '@/types';

type FormValues = {
  nome: string;
  email: string;
  senha: string;
  confirmaSenha: string;
};

type FieldErrors = Partial<Record<keyof FormValues, ValidationError>>;
type Errors = FieldErrors & { geral?: string };

function validar(values: FormValues): FieldErrors {
  const errors: FieldErrors = {};
  const nome = validateNome(values.nome);
  if (nome) errors.nome = nome;
  const email = validateEmail(values.email);
  if (email) errors.email = email;
  const senha = validateSenha(values.senha);
  if (senha) errors.senha = senha;
  const confirma = validateConfirmaSenha(values.confirmaSenha, values.senha);
  if (confirma) errors.confirmaSenha = confirma;
  return errors;
}

export default function CadastroScreen() {
  const { colors } = useTheme();
  const { t } = useLocale();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();
  const { signUp } = useAuth();
  const { translateX, shake } = useShake();
  const { opacity, translateY } = useFadeIn(400);

  const tErr = (e: ValidationError | undefined) =>
    e ? t(e.key, e.vars) : undefined;

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
    ? { ...errors, ...(serverError ? { geral: serverError } : {}) }
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
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + spacing['3xl'], paddingBottom: insets.bottom + spacing['3xl'] },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.header, { opacity, transform: [{ translateY }] }]}>
          <FiapLogo width={64} color={colors.primary} />
          <Text style={styles.titulo}>{t('auth.signup_title')}</Text>
          <Text style={styles.subtitulo}>{t('auth.signup_subtitle')}</Text>
        </Animated.View>

        <Animated.View style={[styles.form, { transform: [{ translateX }] }]}>
          <Input
            label={t('auth.name')}
            placeholder={t('auth.name_placeholder')}
            icon="person-outline"
            value={values.nome}
            onChangeText={(v) => setField('nome', v)}
            autoCapitalize="words"
            autoComplete="name"
            error={tErr(visibleErrors.nome)}
          />
          <Input
            label={t('auth.email')}
            placeholder={t('auth.email_placeholder')}
            icon="mail-outline"
            value={values.email}
            onChangeText={(v) => setField('email', v)}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            error={tErr(visibleErrors.email)}
          />
          <Input
            label={t('auth.password')}
            placeholder={t('auth.password_placeholder')}
            icon="lock-closed-outline"
            value={values.senha}
            onChangeText={(v) => setField('senha', v)}
            secureTextEntry
            autoCapitalize="none"
            error={tErr(visibleErrors.senha)}
          />
          <Input
            label={t('auth.password_confirm')}
            placeholder={t('auth.password_confirm_placeholder')}
            icon="lock-closed-outline"
            value={values.confirmaSenha}
            onChangeText={(v) => setField('confirmaSenha', v)}
            secureTextEntry
            autoCapitalize="none"
            error={tErr(visibleErrors.confirmaSenha)}
          />

          {visibleErrors.geral ? (
            <View style={styles.geralErrorBox}>
              <Text style={styles.geralErrorText}>{visibleErrors.geral}</Text>
            </View>
          ) : null}

          <Button
            title={t('cta.signup')}
            onPress={handleCadastro}
            loading={loading}
            disabled={buttonDisabled}
            fullWidth
            style={styles.botaoSubmit}
          />

          <View style={styles.linkRow}>
            <Text style={styles.linkText}>{t('auth.have_account_text')}</Text>
            <Link href="/login" asChild>
              <Pressable
                hitSlop={8}
                accessibilityRole="link"
                accessibilityLabel={t('auth.login_link')}
              >
                <Text style={styles.linkAccent}>{t('auth.login_link')}</Text>
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
