import { Ionicons } from '@expo/vector-icons';
import { Redirect, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import LoadingScreen from '@/components/LoadingScreen';
import {
  fontFamily,
  fontSize,
  letterSpacing,
  radius,
  shadow,
  spacing,
} from '@/constants/theme';
import { useCart } from '@/context/CartContext';
import { useOrders } from '@/context/OrdersContext';
import { useTheme } from '@/context/ThemeContext';
import { confirmar } from '@/lib/confirm';
import { formatarTempoRestante } from '@/lib/estimativa';
import { haptic } from '@/lib/haptics';
import { notifyImmediate, scheduleNotification } from '@/lib/notifications';
import type { Order, ThemeColors } from '@/types';

export default function Confirmacao() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const { items, totalItens, totalPreco, buildResumo, clear } = useCart();
  const { addOrder, markCancelado } = useOrders();
  const [cancelado, setCancelado] = useState(false);

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

    let cancelled = false;
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
        if (cancelled) return;
        setOrder(novo);
        haptic.success();

        const prazoSegundos = novo.prontoEm
          ? Math.max(0, (new Date(novo.prontoEm).getTime() - Date.now()) / 1000)
          : 180;

        notifyImmediate(
          `Pedido confirmado · senha ${senha}`,
          `Tempo estimado: ${formatarTempoRestante(prazoSegundos)}. Total: R$ ${totalSnapshot.toFixed(2)}`,
        );

        scheduleNotification(
          `Senha ${senha} pronta para retirada`,
          'Apresente sua senha no balcão da cantina.',
          prazoSegundos,
        );

        clear();
      } catch {
        if (!cancelled) hasCreatedRef.current = false;
      }
    })();

    return () => {
      cancelled = true;
    };
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

  if (!order && totalItens === 0) {
    return <Redirect href="/cardapio" />;
  }

  if (!order) {
    return <LoadingScreen label="Processando" subtitle="Gerando sua senha" />;
  }

  const itensQtd = order.items.reduce((acc, ci) => acc + ci.quantidade, 0);

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + spacing['2xl'], paddingBottom: insets.bottom + spacing['4xl'] },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Check + label */}
        <View style={styles.topo}>
          <Animated.View style={[styles.checkCircle, { transform: [{ scale: checkScale }] }]}>
            <Ionicons name="checkmark" size={28} color={colors.primaryText} />
          </Animated.View>
          <Text style={styles.eyebrow}>PEDIDO CONFIRMADO</Text>
          <Text style={styles.tituloPagina}>Sua senha está pronta</Text>
        </View>

        {/* Hero senha */}
        <Animated.View
          style={[
            styles.senhaHero,
            { opacity: senhaOpacity, transform: [{ scale: senhaScale }] },
          ]}
        >
          <View style={styles.senhaHeroDecor}>
            <View style={styles.dotRow}>
              {[0, 1, 2, 3, 4].map((i) => (
                <View key={i} style={styles.dot} />
              ))}
            </View>
          </View>

          <Text style={styles.senhaLabel}>SUA SENHA</Text>
          <Text style={styles.senhaNumero}>{order.senha}</Text>

          <View style={styles.qrWrap}>
            <QRCode
              value={`cantina:senha:${order.senha}:order:${order.id}`}
              size={92}
              color="#0A0A14"
              backgroundColor="#FFFFFF"
            />
          </View>

          <Text style={styles.senhaInstrucao}>Apresente este número no balcão</Text>
        </Animated.View>

        {/* Bento 2 cards: itens / total */}
        <View style={styles.bentoStats}>
          <View style={styles.bentoCard}>
            <View style={styles.bentoIconWrap}>
              <Ionicons name="bag-handle-outline" size={14} color={colors.textMuted} />
            </View>
            <Text style={styles.bentoValor}>{itensQtd}</Text>
            <Text style={styles.bentoLabel}>{itensQtd === 1 ? 'Item' : 'Itens'}</Text>
          </View>
          <View style={[styles.bentoCard, styles.bentoCardTotal]}>
            <View style={[styles.bentoIconWrap, { backgroundColor: 'rgba(255,255,255,0.18)' }]}>
              <Ionicons name="cash-outline" size={14} color="#FFFFFF" />
            </View>
            <Text style={[styles.bentoValor, { color: '#FFFFFF' }]}>
              R$ {order.total.toFixed(2)}
            </Text>
            <Text style={[styles.bentoLabel, { color: 'rgba(255,255,255,0.9)' }]}>Total</Text>
          </View>
        </View>

        {/* Detalhes do pedido */}
        <View style={styles.detalheCard}>
          <Text style={styles.detalheLabel}>DETALHES</Text>
          <Text style={styles.detalheTexto}>{order.resumo}</Text>
        </View>

        {/* Aviso de notificação */}
        <View style={styles.aviso}>
          <View style={styles.avisoIconWrap}>
            <Ionicons name="notifications-outline" size={14} color={colors.primary} />
          </View>
          <Text style={styles.avisoTexto}>
            Você será notificado quando o pedido estiver pronto pra retirada.
          </Text>
        </View>

        {/* Ações */}
        <Pressable
          style={({ pressed }) => [styles.botaoPrimario, pressed && styles.pressedSoft]}
          onPress={() => router.replace('/pedidos')}
          accessibilityRole="button"
          accessibilityLabel="Ver meus pedidos"
        >
          <Text style={styles.botaoPrimarioTexto}>Ver meus pedidos</Text>
          <Ionicons name="arrow-forward" size={16} color={colors.primaryText} />
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.botaoSecundario, pressed && styles.pressedSoft]}
          onPress={() => router.replace('/cardapio')}
          accessibilityRole="button"
          accessibilityLabel="Fazer novo pedido"
        >
          <Text style={styles.botaoSecundarioTexto}>Fazer novo pedido</Text>
        </Pressable>

        {!cancelado ? (
          <Pressable
            style={({ pressed }) => [styles.botaoCancelar, pressed && styles.pressedSoft]}
            onPress={() => {
              confirmar({
                titulo: 'Cancelar este pedido?',
                mensagem: `O pedido com a senha ${order.senha} será cancelado e não poderá ser recuperado.`,
                confirmText: 'Cancelar pedido',
                cancelText: 'Manter pedido',
                destrutivo: true,
                onConfirm: async () => {
                  haptic.warning();
                  await markCancelado(order.id);
                  setCancelado(true);
                  setTimeout(() => router.replace('/pedidos'), 600);
                },
              });
            }}
            accessibilityRole="button"
            accessibilityLabel="Cancelar este pedido"
          >
            <Ionicons name="close-outline" size={14} color={colors.error} />
            <Text style={styles.botaoCancelarTexto}>Cancelar pedido</Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </View>
  );
}

const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.bg,
    },
    scrollContent: {
      paddingHorizontal: spacing.xl,
      flexGrow: 1,
    },
    topo: {
      alignItems: 'center',
      marginBottom: spacing.xl,
    },
    checkCircle: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: c.success,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.lg,
      ...shadow.md,
    },
    eyebrow: {
      fontFamily: fontFamily.semibold,
      fontSize: fontSize.xs,
      color: c.textSubtle,
      letterSpacing: letterSpacing.widest,
    },
    tituloPagina: {
      fontFamily: fontFamily.extrabold,
      fontSize: fontSize['2xl'],
      color: c.text,
      marginTop: spacing.xs,
    },

    /* Hero senha */
    senhaHero: {
      backgroundColor: c.primary,
      borderRadius: radius['2xl'],
      paddingVertical: spacing['2xl'],
      paddingHorizontal: spacing.xl,
      alignItems: 'center',
      marginBottom: spacing.md,
      overflow: 'hidden',
      ...shadow.primary,
    },
    senhaHeroDecor: {
      position: 'absolute',
      top: -8,
      left: 0,
      right: 0,
      alignItems: 'center',
      opacity: 0.18,
    },
    dotRow: {
      flexDirection: 'row',
      gap: 6,
    },
    dot: {
      width: 4,
      height: 4,
      borderRadius: 2,
      backgroundColor: '#FFFFFF',
    },
    senhaLabel: {
      fontFamily: fontFamily.semibold,
      fontSize: fontSize.xs,
      color: 'rgba(255,255,255,0.8)',
      letterSpacing: letterSpacing.widest,
      marginBottom: spacing.sm,
    },
    senhaNumero: {
      fontFamily: fontFamily.extrabold,
      fontSize: fontSize['6xl'],
      color: c.primaryText,
      letterSpacing: 8,
      lineHeight: fontSize['6xl'] * 1.05,
    },
    qrWrap: {
      backgroundColor: '#FFFFFF',
      padding: spacing.sm + 2,
      borderRadius: radius.md,
      marginTop: spacing.lg,
      ...shadow.md,
    },
    senhaInstrucao: {
      fontFamily: fontFamily.medium,
      fontSize: fontSize.md,
      color: 'rgba(255,255,255,0.85)',
      marginTop: spacing.md,
    },

    /* Bento stats */
    bentoStats: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
    bentoCard: {
      flex: 1,
      backgroundColor: c.surface,
      borderRadius: radius.lg,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: c.border,
      gap: spacing.sm,
    },
    bentoCardTotal: {
      backgroundColor: c.success,
      borderColor: c.success,
    },
    bentoIconWrap: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: c.surfaceElevated,
      alignItems: 'center',
      justifyContent: 'center',
    },
    bentoValor: {
      fontFamily: fontFamily.extrabold,
      fontSize: fontSize.xl,
      color: c.text,
    },
    bentoLabel: {
      fontFamily: fontFamily.medium,
      fontSize: fontSize.md,
      color: c.textMuted,
    },

    /* Detalhe */
    detalheCard: {
      backgroundColor: c.surface,
      borderRadius: radius.lg,
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: c.border,
      marginBottom: spacing.md,
    },
    detalheLabel: {
      fontFamily: fontFamily.semibold,
      fontSize: fontSize.xs,
      color: c.textSubtle,
      letterSpacing: letterSpacing.widest,
      marginBottom: spacing.sm,
    },
    detalheTexto: {
      fontFamily: fontFamily.medium,
      fontSize: fontSize.base,
      color: c.text,
      lineHeight: 20,
    },

    /* Aviso */
    aviso: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      backgroundColor: c.primarySoft,
      borderRadius: radius.lg,
      padding: spacing.md,
      marginBottom: spacing.xl,
    },
    avisoIconWrap: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: c.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avisoTexto: {
      flex: 1,
      fontFamily: fontFamily.medium,
      fontSize: fontSize.md,
      color: c.text,
      lineHeight: 18,
    },

    /* Botões */
    botaoPrimario: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      backgroundColor: c.primary,
      paddingVertical: spacing.lg,
      borderRadius: radius.full,
      marginBottom: spacing.sm,
      ...shadow.primary,
    },
    botaoPrimarioTexto: {
      fontFamily: fontFamily.bold,
      color: c.primaryText,
      fontSize: fontSize.base,
    },
    botaoSecundario: {
      paddingVertical: spacing.md,
      borderRadius: radius.full,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
    },
    botaoSecundarioTexto: {
      fontFamily: fontFamily.semibold,
      color: c.text,
      fontSize: fontSize.base,
    },
    botaoCancelar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xs + 2,
      paddingVertical: spacing.md,
      borderRadius: radius.full,
      marginTop: spacing.sm,
    },
    botaoCancelarTexto: {
      fontFamily: fontFamily.medium,
      color: c.error,
      fontSize: fontSize.md,
    },
    pressedSoft: {
      opacity: 0.85,
      transform: [{ scale: 0.98 }],
    },
  });
