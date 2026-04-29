import { useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import EmptyState from '@/components/EmptyState';
import ItemThumbnail from '@/components/ItemThumbnail';
import LoadingScreen from '@/components/LoadingScreen';
import { useCart } from '@/context/CartContext';
import { useOrders } from '@/context/OrdersContext';
import { useTheme } from '@/context/ThemeContext';
import CARDAPIO from '@/data/cardapio';
import { confirmar } from '@/lib/confirm';
import { formatarTempoRestante } from '@/lib/estimativa';
import { haptic } from '@/lib/haptics';
import {
  fontFamily,
  fontSize,
  letterSpacing,
  radius,
  shadow,
  spacing,
  statusPalette,
} from '@/constants/theme';
import type { ItemCardapio, Order, ThemeColors } from '@/types';

function formatarDataCompleta(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString('pt-BR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '—';
  }
}

export default function PedidoDetalhesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const { getOrder, isHydrated, markRetirado, markCancelado } = useOrders();
  const { clear, setQuantidade } = useCart();

  const order = id ? getOrder(id) : undefined;

  const [tempoRestante, setTempoRestante] = useState<string>('');

  useEffect(() => {
    if (!order || order.status !== 'pendente' || !order.prontoEm) return;
    const calcular = () => {
      const remaining = (new Date(order.prontoEm!).getTime() - Date.now()) / 1000;
      setTempoRestante(formatarTempoRestante(remaining));
    };
    calcular();
    const interval = setInterval(calcular, 10_000);
    return () => clearInterval(interval);
  }, [order]);

  if (!isHydrated) {
    return <LoadingScreen label="Carregando pedido" />;
  }

  if (!order) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.headerNav}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            style={({ pressed }) => [styles.iconButton, pressed && styles.pressedSoft]}
            accessibilityRole="button"
            accessibilityLabel="Voltar"
          >
            <Ionicons name="chevron-back" size={20} color={colors.text} />
          </Pressable>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitulo}>Pedido</Text>
          </View>
          <View style={styles.iconButtonSpacer} />
        </View>
        <EmptyState
          emoji="🔍"
          title="Pedido não encontrado"
          subtitle="Talvez ele tenha sido removido ou você abriu um link expirado"
        />
      </View>
    );
  }

  const status = statusPalette[order.status];
  const itens = order.items.reduce((acc, ci) => acc + ci.quantidade, 0);

  const linhasComItem = order.items
    .map((ci) => {
      const item = CARDAPIO.find((i) => i.id === ci.itemId);
      if (!item) return null;
      return { item, quantidade: ci.quantidade };
    })
    .filter((x): x is { item: ItemCardapio; quantidade: number } => x !== null);

  const handleCancelar = () => {
    confirmar({
      titulo: 'Cancelar pedido?',
      mensagem: `O pedido com a senha ${order.senha} será cancelado e não poderá ser recuperado.`,
      confirmText: 'Cancelar pedido',
      cancelText: 'Manter pedido',
      destrutivo: true,
      onConfirm: async () => {
        haptic.warning();
        await markCancelado(order.id);
      },
    });
  };

  const handleMarcarRetirado = async () => {
    haptic.success();
    await markRetirado(order.id);
  };

  const handlePedirNovo = () => {
    clear();
    for (const ci of order.items) {
      setQuantidade(ci.itemId, ci.quantidade);
    }
    haptic.success();
    router.push('/carrinho');
  };

  return (
    <View style={styles.container}>
      <View style={[styles.headerNav, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          style={({ pressed }) => [styles.iconButton, pressed && styles.pressedSoft]}
          accessibilityRole="button"
          accessibilityLabel="Voltar"
        >
          <Ionicons name="chevron-back" size={20} color={colors.text} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitulo}>Pedido</Text>
        </View>
        <View style={styles.iconButtonSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + spacing['3xl'] },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero senha */}
        <View style={styles.senhaHero}>
          <Text style={styles.senhaLabel}>SUA SENHA</Text>
          <Text style={styles.senhaNumero}>{order.senha}</Text>

          <View
            style={[
              styles.statusBadge,
              { backgroundColor: status.bg, borderColor: status.border },
            ]}
          >
            <Ionicons name={status.icon} size={12} color={status.color} />
            <Text style={[styles.statusLabel, { color: status.color }]}>
              {status.label}
            </Text>
          </View>

          {order.status === 'pendente' && tempoRestante ? (
            <Text style={styles.tempoRestante}>
              Pronto em {tempoRestante}
            </Text>
          ) : null}
        </View>

        {/* Lista de items */}
        <Text style={styles.sectionTitle}>Items do pedido</Text>
        <View style={styles.itensCard}>
          {linhasComItem.map(({ item, quantidade }, idx) => (
            <View key={item.id}>
              {idx > 0 ? <View style={styles.divisor} /> : null}
              <View style={styles.itemRow}>
                <ItemThumbnail
                  emoji={item.emoji}
                  imagem={item.imagem}
                  size={48}
                  borderRadius={radius.md}
                  bgColor={colors.surfaceElevated}
                />
                <View style={styles.itemInfo}>
                  <Text style={styles.itemNome} numberOfLines={1}>
                    {item.nome}
                  </Text>
                  <Text style={styles.itemPrecoUnit}>
                    {quantidade} × R$ {item.preco.toFixed(2)}
                  </Text>
                </View>
                <Text style={styles.itemSubtotal}>
                  R$ {(item.preco * quantidade).toFixed(2)}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Resumo */}
        <View style={styles.resumoCard}>
          <View style={styles.resumoLinha}>
            <Text style={styles.resumoLabel}>
              {itens} {itens === 1 ? 'item' : 'itens'}
            </Text>
            <Text style={styles.resumoValor}>R$ {order.total.toFixed(2)}</Text>
          </View>
          <View style={styles.divisor} />
          <View style={styles.resumoLinha}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValor}>R$ {order.total.toFixed(2)}</Text>
          </View>
        </View>

        {/* Linha do tempo */}
        <Text style={styles.sectionTitle}>Linha do tempo</Text>
        <View style={styles.timelineCard}>
          <View style={styles.timelineLinha}>
            <View style={[styles.timelineDot, { backgroundColor: colors.primary }]} />
            <View style={styles.timelineInfo}>
              <Text style={styles.timelineLabel}>Pedido confirmado</Text>
              <Text style={styles.timelineSub}>{formatarDataCompleta(order.criadoEm)}</Text>
            </View>
          </View>

          {order.prontoEm ? (
            <>
              <View style={styles.timelineConector} />
              <View style={styles.timelineLinha}>
                <View
                  style={[
                    styles.timelineDot,
                    {
                      backgroundColor:
                        order.status === 'pronto' ||
                        order.status === 'retirado'
                          ? colors.success
                          : colors.borderStrong,
                    },
                  ]}
                />
                <View style={styles.timelineInfo}>
                  <Text style={styles.timelineLabel}>
                    {order.status === 'pronto' || order.status === 'retirado'
                      ? 'Pronto pra retirada'
                      : 'Estimativa de pronto'}
                  </Text>
                  <Text style={styles.timelineSub}>
                    {formatarDataCompleta(order.prontoEm)}
                  </Text>
                </View>
              </View>
            </>
          ) : null}

          {order.status === 'retirado' ? (
            <>
              <View style={styles.timelineConector} />
              <View style={styles.timelineLinha}>
                <View style={[styles.timelineDot, { backgroundColor: colors.success }]} />
                <View style={styles.timelineInfo}>
                  <Text style={styles.timelineLabel}>Retirado</Text>
                  <Text style={styles.timelineSub}>Pedido entregue</Text>
                </View>
              </View>
            </>
          ) : null}

          {order.status === 'cancelado' ? (
            <>
              <View style={styles.timelineConector} />
              <View style={styles.timelineLinha}>
                <View style={[styles.timelineDot, { backgroundColor: colors.error }]} />
                <View style={styles.timelineInfo}>
                  <Text style={styles.timelineLabel}>Cancelado</Text>
                  <Text style={styles.timelineSub}>Pedido encerrado pelo usuário</Text>
                </View>
              </View>
            </>
          ) : null}
        </View>

        {/* Ações por status */}
        {order.status === 'pendente' || order.status === 'pronto' ? (
          <Pressable
            style={({ pressed }) => [styles.botaoPrimario, pressed && styles.pressedSoft]}
            onPress={handleMarcarRetirado}
            accessibilityRole="button"
            accessibilityLabel="Marcar pedido como retirado"
          >
            <Ionicons name="checkmark-circle-outline" size={18} color={colors.primaryText} />
            <Text style={styles.botaoPrimarioTexto}>Marcar como retirado</Text>
          </Pressable>
        ) : null}

        {order.status === 'pendente' ? (
          <Pressable
            style={({ pressed }) => [styles.botaoCancelar, pressed && styles.pressedSoft]}
            onPress={handleCancelar}
            accessibilityRole="button"
            accessibilityLabel="Cancelar este pedido"
          >
            <Ionicons name="close-outline" size={16} color={colors.error} />
            <Text style={styles.botaoCancelarTexto}>Cancelar pedido</Text>
          </Pressable>
        ) : null}

        {order.status === 'retirado' || order.status === 'cancelado' ? (
          <Pressable
            style={({ pressed }) => [styles.botaoPrimario, pressed && styles.pressedSoft]}
            onPress={handlePedirNovo}
            accessibilityRole="button"
            accessibilityLabel="Refazer este pedido"
          >
            <Ionicons name="refresh" size={18} color={colors.primaryText} />
            <Text style={styles.botaoPrimarioTexto}>Pedir de novo</Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </View>
  );
}

const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: c.bg },
    headerNav: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingBottom: spacing.md,
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
    scrollContent: {
      paddingHorizontal: spacing.xl,
    },

    /* Hero senha */
    senhaHero: {
      backgroundColor: c.surface,
      borderRadius: radius.xl,
      paddingVertical: spacing.xl,
      paddingHorizontal: spacing.xl,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: c.border,
      marginBottom: spacing.xl,
      gap: spacing.sm,
      ...shadow.md,
    },
    senhaLabel: {
      fontFamily: fontFamily.semibold,
      fontSize: fontSize.xs,
      color: c.textSubtle,
      letterSpacing: letterSpacing.widest,
    },
    senhaNumero: {
      fontFamily: fontFamily.extrabold,
      fontSize: fontSize['5xl'],
      color: c.text,
      letterSpacing: 6,
    },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: spacing.md,
      paddingVertical: 4,
      borderRadius: radius.full,
      borderWidth: 1,
      marginTop: spacing.xs,
    },
    statusLabel: {
      fontFamily: fontFamily.bold,
      fontSize: fontSize.xs,
      letterSpacing: letterSpacing.wider,
    },
    tempoRestante: {
      fontFamily: fontFamily.medium,
      fontSize: fontSize.md,
      color: c.textMuted,
      marginTop: spacing.xs,
    },

    /* Section */
    sectionTitle: {
      fontFamily: fontFamily.bold,
      fontSize: fontSize.md,
      color: c.textMuted,
      marginBottom: spacing.sm,
      marginTop: spacing.sm,
    },

    /* Items card */
    itensCard: {
      backgroundColor: c.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: c.border,
      marginBottom: spacing.lg,
      padding: spacing.md,
    },
    itemRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      paddingVertical: spacing.sm,
    },
    itemInfo: {
      flex: 1,
    },
    itemNome: {
      fontFamily: fontFamily.semibold,
      fontSize: fontSize.base,
      color: c.text,
    },
    itemPrecoUnit: {
      fontFamily: fontFamily.medium,
      fontSize: fontSize.md,
      color: c.textMuted,
      marginTop: 2,
    },
    itemSubtotal: {
      fontFamily: fontFamily.bold,
      fontSize: fontSize.base,
      color: c.text,
    },

    /* Resumo */
    resumoCard: {
      backgroundColor: c.surface,
      borderRadius: radius.lg,
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: c.border,
      marginBottom: spacing.lg,
      gap: spacing.sm,
    },
    resumoLinha: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    resumoLabel: {
      fontFamily: fontFamily.medium,
      fontSize: fontSize.base,
      color: c.textMuted,
    },
    resumoValor: {
      fontFamily: fontFamily.semibold,
      fontSize: fontSize.base,
      color: c.text,
    },
    totalLabel: {
      fontFamily: fontFamily.bold,
      fontSize: fontSize.lg,
      color: c.text,
    },
    totalValor: {
      fontFamily: fontFamily.extrabold,
      fontSize: fontSize.xl,
      color: c.text,
    },
    divisor: {
      height: 1,
      backgroundColor: c.separator,
      marginVertical: spacing.xs,
    },

    /* Timeline */
    timelineCard: {
      backgroundColor: c.surface,
      borderRadius: radius.lg,
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: c.border,
      marginBottom: spacing.xl,
    },
    timelineLinha: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.md,
    },
    timelineDot: {
      width: 12,
      height: 12,
      borderRadius: 6,
      marginTop: 4,
    },
    timelineConector: {
      width: 1,
      height: 16,
      backgroundColor: c.borderStrong,
      marginLeft: 5,
      marginVertical: spacing.xs,
    },
    timelineInfo: {
      flex: 1,
    },
    timelineLabel: {
      fontFamily: fontFamily.semibold,
      fontSize: fontSize.base,
      color: c.text,
    },
    timelineSub: {
      fontFamily: fontFamily.medium,
      fontSize: fontSize.md,
      color: c.textMuted,
      marginTop: 2,
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
    botaoCancelar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xs + 2,
      paddingVertical: spacing.md,
      borderRadius: radius.full,
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
