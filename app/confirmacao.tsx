import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import LoadingScreen from '@/components/LoadingScreen';
import { useTheme } from '@/context/ThemeContext';
import { fontFamily, fontSize, letterSpacing, radius, spacing } from '@/constants/theme';
import type { ThemeColors } from '@/types';

type ConfirmacaoParams = {
  total?: string;
  itens?: string;
  resumo?: string;
};

export default function Confirmacao() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const { total, itens, resumo } = useLocalSearchParams<ConfirmacaoParams>();
  const [senha, setSenha] = useState<number | null>(null);
  const [carregando, setCarregando] = useState<boolean>(true);

  const senhaScale = useRef(new Animated.Value(0)).current;
  const senhaOpacity = useRef(new Animated.Value(0)).current;
  const checkScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      const novaSenha = Math.floor(Math.random() * 900) + 100;
      setSenha(novaSenha);
      setCarregando(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (senha === null) return;
    Animated.sequence([
      Animated.spring(checkScale, {
        toValue: 1,
        useNativeDriver: true,
        speed: 14,
        bounciness: 8,
      }),
      Animated.parallel([
        Animated.spring(senhaScale, {
          toValue: 1,
          useNativeDriver: true,
          speed: 12,
          bounciness: 6,
        }),
        Animated.timing(senhaOpacity, {
          toValue: 1,
          duration: 280,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [senha, senhaScale, senhaOpacity, checkScale]);

  if (carregando) {
    return <LoadingScreen label="PROCESSANDO" subtitle="AGUARDE UM MOMENTO" />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Animated.View style={[styles.checkCircle, { transform: [{ scale: checkScale }] }]}>
          <Ionicons name="checkmark" size={32} color={colors.primaryText} />
        </Animated.View>

        <Text style={styles.confirmado}>PEDIDO CONFIRMADO</Text>

        <Animated.View
          style={[
            styles.senhaContainer,
            {
              opacity: senhaOpacity,
              transform: [{ scale: senhaScale }],
            },
          ]}
        >
          <Text style={styles.senhaLabel}>SUA SENHA</Text>
          <Text style={styles.senhaNumero}>{senha}</Text>
        </Animated.View>

        <Text style={styles.senhaInstrucao}>APRESENTE ESTE NÚMERO NO BALCÃO</Text>

        <View style={styles.resumoCard}>
          <View style={styles.resumoLinha}>
            <Text style={styles.resumoLabel}>ITENS</Text>
            <Text style={styles.resumoValor}>{itens}</Text>
          </View>

          <View style={styles.divisor} />

          <Text style={styles.resumoDetalhe}>{resumo}</Text>

          <View style={styles.divisor} />

          <View style={styles.resumoLinha}>
            <Text style={styles.totalLabel}>TOTAL</Text>
            <Text style={styles.totalValor}>R$ {total}</Text>
          </View>
        </View>

        <View style={styles.avisoContainer}>
          <Text style={styles.avisoTexto}>AGUARDE SEU NÚMERO NO PAINEL DA CANTINA</Text>
        </View>

        <TouchableOpacity
          style={styles.botaoPrimario}
          onPress={() => router.replace('/')}
          activeOpacity={0.85}
        >
          <Text style={styles.botaoPrimarioTexto}>VOLTAR AO INÍCIO</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.botaoSecundario}
          onPress={() => router.replace('/cardapio')}
          activeOpacity={0.85}
        >
          <Text style={styles.botaoSecundarioTexto}>NOVO PEDIDO</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.bg,
      justifyContent: 'center',
    },
    content: {
      alignItems: 'center',
      paddingHorizontal: spacing['2xl'],
    },
    checkCircle: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: c.success,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.xl,
    },
    confirmado: {
      fontFamily: fontFamily.extrabold,
      fontSize: fontSize.base,
      color: c.text,
      letterSpacing: letterSpacing.widest,
      marginBottom: spacing['3xl'],
    },
    senhaContainer: {
      backgroundColor: c.primary,
      borderRadius: radius['2xl'],
      paddingVertical: spacing['3xl'],
      paddingHorizontal: spacing['5xl'],
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    senhaLabel: {
      fontFamily: fontFamily.semibold,
      fontSize: fontSize.xs,
      color: 'rgba(255,255,255,0.7)',
      letterSpacing: letterSpacing.widest,
      marginBottom: spacing.sm,
    },
    senhaNumero: {
      fontFamily: fontFamily.extrabold,
      fontSize: fontSize['6xl'],
      color: c.primaryText,
      letterSpacing: 12,
    },
    senhaInstrucao: {
      fontFamily: fontFamily.medium,
      fontSize: fontSize.xs,
      color: c.textSubtle,
      letterSpacing: letterSpacing.wide,
      marginBottom: spacing['3xl'],
    },
    resumoCard: {
      backgroundColor: c.card,
      borderRadius: radius.lg,
      padding: spacing.xl,
      width: '100%',
      marginBottom: spacing.lg,
      borderWidth: 1,
      borderColor: c.border,
    },
    resumoLinha: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    resumoLabel: {
      fontFamily: fontFamily.semibold,
      fontSize: fontSize.sm,
      color: c.textSubtle,
      letterSpacing: letterSpacing.wide,
    },
    resumoValor: {
      fontFamily: fontFamily.bold,
      fontSize: fontSize.base,
      color: c.text,
    },
    divisor: {
      height: 1,
      backgroundColor: c.border,
      marginVertical: spacing.md + 2,
    },
    resumoDetalhe: {
      fontFamily: fontFamily.regular,
      fontSize: fontSize.md,
      color: c.textMuted,
      lineHeight: 22,
    },
    totalLabel: {
      fontFamily: fontFamily.bold,
      fontSize: fontSize.md,
      color: c.text,
      letterSpacing: letterSpacing.wide,
    },
    totalValor: {
      fontFamily: fontFamily.extrabold,
      fontSize: fontSize['2xl'],
      color: c.primary,
    },
    avisoContainer: {
      backgroundColor: c.card,
      borderRadius: radius.md,
      padding: spacing.md + 2,
      width: '100%',
      marginBottom: spacing['2xl'] + 4,
      borderLeftWidth: 3,
      borderLeftColor: c.primary,
      borderWidth: 1,
      borderColor: c.border,
    },
    avisoTexto: {
      fontFamily: fontFamily.semibold,
      fontSize: fontSize.xs,
      color: c.textMuted,
      letterSpacing: letterSpacing.wide,
      lineHeight: 18,
    },
    botaoPrimario: {
      backgroundColor: c.primary,
      paddingVertical: spacing.lg,
      borderRadius: radius.full,
      alignItems: 'center',
      width: '100%',
      marginBottom: spacing.sm + 2,
    },
    botaoPrimarioTexto: {
      fontFamily: fontFamily.bold,
      color: c.primaryText,
      fontSize: fontSize.md,
      letterSpacing: letterSpacing.wide,
    },
    botaoSecundario: {
      backgroundColor: 'transparent',
      paddingVertical: spacing.md + 2,
      borderRadius: radius.full,
      alignItems: 'center',
      width: '100%',
      borderWidth: 1,
      borderColor: c.border,
    },
    botaoSecundarioTexto: {
      fontFamily: fontFamily.semibold,
      color: c.textMuted,
      fontSize: fontSize.md,
      letterSpacing: letterSpacing.wide,
    },
  });
