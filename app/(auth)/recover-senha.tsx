import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
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
import Input from '@/components/Input';
import Toast from '@/components/Toast';
import {
  fontFamily,
  fontSize,
  radius,
  spacing,
} from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useLocale } from '@/context/LocaleContext';
import { useTheme } from '@/context/ThemeContext';
import { useShake } from '@/hooks/useShake';
import { haptic } from '@/lib/haptics';
import {
  validateConfirmaSenha,
  validateEmail,
  validateSenha,
  type ValidationError,
} from '@/lib/validation';
import type { ThemeColors } from '@/types';

type FieldErrors = {
  email?: ValidationError;
  novaSenha?: ValidationError;
  confirmaSenha?: ValidationError;
};
type Errors = FieldErrors & { geral?: string };

function validar(values: {
  email: string;
  novaSenha: string;
  confirmaSenha: string;
}): FieldErrors {
  const errors: FieldErrors = {};
  const email = validateEmail(values.email);
  if (email) errors.email = email;
  const senha = validateSenha(values.novaSenha);
  if (senha) errors.novaSenha = senha;
  const confirma = validateConfirmaSenha(values.confirmaSenha, values.novaSenha);
  if (confirma) errors.confirmaSenha = confirma;
  return errors;
}

export default function RecoverSenhaScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { t } = useLocale();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { resetSenha } = useAuth();
  const { translateX, shake } = useShake();

  const tErr = (e: ValidationError | undefined) =>
    e ? t(e.key, e.vars) : undefined;

  const [email, setEmail] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmaSenha, setConfirmaSenha] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ visible: boolean; message: string }>({
    visible: false,
    message: '',
  });

  const errors = useMemo(
    () => validar({ email, novaSenha, confirmaSenha }),
    [email, novaSenha, confirmaSenha],
  );
  const visibleErrors: Errors = submitted
    ? { ...errors, ...(serverError ? { geral: serverError } : {}) }
    : {};
  const hasErrors = Object.keys(errors).length > 0;
  const buttonDisabled = submitted && hasErrors;

  const handleSalvar = async () => {
    setSubmitted(true);
    setServerError(null);
    if (hasErrors) {
      haptic.error();
      shake();
      return;
    }
    setLoading(true);
    const result = await resetSenha({ email, novaSenha });
    setLoading(false);
    if (!result.success) {
      haptic.error();
      setServerError(result.error);
      shake();
      return;
    }
    haptic.success();
    setToast({ visible: true, message: t('toast.profile_saved') });
    setTimeout(() => router.replace('/login'), 900);
  };

  const handleVoltar = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/login');
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
          accessibilityRole="button"
          accessibilityLabel={t('cta.back')}
        >
          <Ionicons name="chevron-back" size={20} color={colors.text} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitulo}>{t('auth.recover_password_title')}</Text>
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
        <View style={styles.intro}>
          <View style={styles.iconWrap}>
            <Ionicons name="lock-open-outline" size={28} color={colors.primary} />
          </View>
          <Text style={styles.titulo}>{t('auth.reset_password_title')}</Text>
          <Text style={styles.subtitulo}>
            {t('auth.reset_password_subtitle')}
          </Text>
        </View>

        <Animated.View style={[styles.form, { transform: [{ translateX }] }]}>
          <Input
            label={t('auth.email_account_label')}
            placeholder={t('auth.email_placeholder')}
            icon="mail-outline"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            error={tErr(visibleErrors.email)}
          />
          <Input
            label={t('auth.new_password_label')}
            placeholder={t('auth.password_placeholder')}
            icon="lock-closed-outline"
            value={novaSenha}
            onChangeText={setNovaSenha}
            secureTextEntry
            autoCapitalize="none"
            error={tErr(visibleErrors.novaSenha)}
          />
          <Input
            label={t('auth.confirm_new_password_label')}
            placeholder={t('auth.password_confirm_placeholder')}
            icon="lock-closed-outline"
            value={confirmaSenha}
            onChangeText={setConfirmaSenha}
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
            title={t('cta.reset_password')}
            onPress={handleSalvar}
            loading={loading}
            disabled={buttonDisabled}
            fullWidth
            style={styles.botaoSubmit}
          />
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
    headerCenter: { alignItems: 'center', flex: 1 },
    headerTitulo: {
      fontFamily: fontFamily.bold,
      fontSize: fontSize.xl,
      color: c.text,
    },
    scroll: {
      paddingHorizontal: spacing.xl,
    },
    intro: {
      alignItems: 'center',
      marginBottom: spacing['2xl'],
      paddingHorizontal: spacing.lg,
    },
    iconWrap: {
      width: 60,
      height: 60,
      borderRadius: 30,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.primarySoft,
      marginBottom: spacing.lg,
    },
    titulo: {
      fontFamily: fontFamily.extrabold,
      fontSize: fontSize['2xl'],
      color: c.text,
      textAlign: 'center',
    },
    subtitulo: {
      fontFamily: fontFamily.medium,
      fontSize: fontSize.base,
      color: c.textMuted,
      textAlign: 'center',
      marginTop: spacing.sm,
      lineHeight: 20,
    },
    form: { width: '100%' },
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
    botaoSubmit: { marginTop: spacing.md },
    pressedSoft: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  });
