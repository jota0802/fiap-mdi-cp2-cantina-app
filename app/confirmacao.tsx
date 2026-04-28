import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import LoadingScreen from '@/components/LoadingScreen';
import { useCart } from '@/context/CartContext';
import { useOrders } from '@/context/OrdersContext';
import { useTheme } from '@/context/ThemeContext';
import { notifyImmediate, scheduleNotification } from '@/lib/notifications';
import { fontFamily, fontSize, letterSpacing, radius, spacing } from '@/constants/theme';
import type { Order, ThemeColors } from '@/types';

const PREP_SECONDS = 180;

export default function Confirmacao() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const { items, totalItens, totalPreco, buildResumo, clear } = useCart();
  const { addOrder } = useOrders();

  const [order, setOrder] = useState<Order | null>(null);

  const senhaScale = useRef(new Animated.Value(0)).current;
  const senhaOpacity = useRef(new Animated.Value(0)).current;
  const checkScale = useRef(new Animated.Value(0)).current;
  const hasCreatedRef = useRef(false);

  // Cria pedido (uma única vez)
  useEffect(() => {
    if (hasCreatedRef.current) return;
    if (totalItens === 0) return;
    hasCreatedRef.current = true;

    const senha = Math.floor(Math.random() * 900) + 100;
    const itemsSnapshot = [...items];
    const totalSnapshot = totalPreco;
    const resumoSnapshot = buildResumo();

    (async () => {
      try {
        const novo = await addOrder({
          senha,
          items: itemsSnapshot,
          total: totalSnapshot,
          resumo: resumoSnapshot,
        });
        setOrder(novo);

        notifyImmediate(
          `Pedido confirmado · senha ${senha}`,
          `Acompanhe seu pedido pela aba Pedidos. Total: R$ ${totalSnapshot.toFixed(2)}`,
        );

        scheduleNotification(
          `Senha ${senha} pronta para retirada`,
          'Apresente sua senha no balcão da cantina.',
          PREP_SECONDS,
        );

        clear();
      } catch (e) {
        // se algo falhar, tenta de novo na próxima entrada
        hasCreatedRef.current = false;
      }
    })();
  }, [totalItens, items, totalPreco, buildResumo, addOrder, clear]);

  // Animações ao receber a senha
  useEffect(() => {
    if (!order) return;
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
  }, [order, senhaScale, senhaOpacity, checkScale]);

  // Sem itens e sem pedido criado: redireciona pro cardápio
  if (!order && totalItens === 0) {
    return <Redirect href="/cardapio" />;
  }

  if (!order) {
    return <LoadingScreen label="PROCESSANDO" subtitle="GERANDO SUA SENHA" />;
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
          <Text style={styles.senhaNumero}>{order.senha}</Text>
        </Animated.View>

        <Text style={styles.senhaInstrucao}>APRESENTE ESTE NÚMERO NO BALCÃO</Text>

        <View style={styles.resumoCard}>
          <View style={styles.resumoLinha}>
            <Text style={styles.resumoLabel}>ITENS</Text>
            <Text style={styles.resumoValor}>
              {order.items.reduce((acc, ci) => acc + ci.quantidade, 0)}
            </Text>
          </View>

          <View style={styles.divisor} />

          <Text style={styles.resumoDetalhe}>{order.resumo}</Text>

          <View style={styles.divisor} />

          <View style={styles.resumoLinha}>
            <Text style={styles.totalLabel}>TOTAL</Text>
            <Text style={styles.totalValor}>R$ {order.total.toFixed(2)}</Text>
          </View>
        </View>

        <View style={styles.avisoContainer}>
          <Ionicons name="notifications-outline" size={16} color={colors.primary} />
          <Text style={styles.avisoTexto}>
            VOCÊ SERÁ NOTIFICADO QUANDO O PEDIDO ESTIVER PRONTO
          </Text>
        </View>

        <TouchableOpacity
          style={styles.botaoPrimario}
          onPress={() => router.replace('/pedidos')}
          activeOpacity={0.85}
        >
          <Text style={styles.botaoPrimarioTexto}>VER MEUS PEDIDOS</Text>
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
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm + 2,
    },
    avisoTexto: {
      flex: 1,
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
