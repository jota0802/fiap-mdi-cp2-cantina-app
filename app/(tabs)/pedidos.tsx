import { Ionicons } from '@expo/vector-icons';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import EmptyState from '@/components/EmptyState';
import { SkeletonOrderCard } from '@/components/Skeleton';
import {
  fontFamily,
  fontSize,
  letterSpacing,
  radius,
  shadow,
  spacing,
  statusPalette,
} from '@/constants/theme';
import { useCart } from '@/context/CartContext';
import { useLocale } from '@/context/LocaleContext';
import { useOrders } from '@/context/OrdersContext';
import { useTheme } from '@/context/ThemeContext';
import { confirmar } from '@/lib/confirm';
import { haptic } from '@/lib/haptics';
import type { Order, ThemeColors } from '@/types';

function formatarData(iso: string): string {
  const date = new Date(iso);
  const data = date.toLocaleDateString('pt-BR');
  const hora = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  return `${data} · ${hora}`;
}

type CardProps = {
  order: Order;
  styles: ReturnType<typeof createStyles>;
  colors: ThemeColors;
  onMarcarRetirado: () => void;
  onPedirNovo: () => void;
  onCancelar: () => void;
  onAbrirDetalhes: () => void;
};

function PedidoCard({
  order,
  styles,
  colors,
  onMarcarRetirado,
  onPedirNovo,
  onCancelar,
  onAbrirDetalhes,
}: CardProps) {
  const { t } = useLocale();
  const status = statusPalette[order.status];
  const statusLabel = t(`status.${order.status}`);

  return (
    <View style={styles.card}>
      {/* Área clicável que abre os detalhes — só os elementos informacionais */}
      <Pressable
        style={({ pressed }) => [styles.cardCabecaPressable, pressed && styles.pressedSoft]}
        onPress={onAbrirDetalhes}
        accessibilityRole="button"
        accessibilityLabel={`Ver detalhes do pedido senha ${order.senha}, status ${statusLabel.toLowerCase()}, total R$ ${order.total.toFixed(2)}`}
      >
        <View style={styles.cardHeader}>
          <View style={styles.senhaBox}>
            <Text style={styles.senhaLabel}>{t('orders.password_label')}</Text>
            <Text style={styles.senhaNumero}>{order.senha}</Text>
          </View>
          <View style={styles.cardHeaderInfo}>
            <Text style={styles.cardData}>{formatarData(order.criadoEm)}</Text>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: status.bg, borderColor: status.border },
              ]}
            >
              <Ionicons name={status.icon} size={12} color={status.color} />
              <Text style={[styles.statusLabel, { color: status.color }]}>
                {statusLabel.toUpperCase()}
              </Text>
            </View>
          </View>
        </View>

        <Text style={styles.resumoLinha}>{order.resumo}</Text>

        <View style={styles.cardFooter}>
          <Text style={styles.totalLabel}>{t('orders.total_label')}</Text>
          <View style={styles.cardFooterDireita}>
            <Text style={styles.totalValor}>R$ {order.total.toFixed(2)}</Text>
            <Ionicons name="chevron-forward" size={14} color={colors.textSubtle} />
          </View>
        </View>
      </Pressable>

      {/* Botões de ação ficam FORA do Pressable principal pra evitar nested buttons */}
      {order.status === 'pendente' || order.status === 'pronto' ? (
        <View style={styles.acoesRow}>
          <Pressable
            style={({ pressed }) => [
              styles.acaoBotao,
              styles.acaoFlex,
              order.status === 'pronto' && {
                backgroundColor: status.bg,
                borderColor: status.border,
              },
              pressed && styles.pressedSoft,
            ]}
            onPress={onMarcarRetirado}
            accessibilityRole="button"
            accessibilityLabel={`Marcar pedido senha ${order.senha} como retirado`}
          >
            <Ionicons
              name="checkmark-circle-outline"
              size={16}
              color={order.status === 'pronto' ? status.color : colors.text}
            />
            <Text
              style={[
                styles.acaoBotaoTexto,
                order.status === 'pronto' && { color: status.color },
              ]}
            >
              {t('cta.picked_up_short')}
            </Text>
          </Pressable>

          {order.status === 'pendente' ? (
            <Pressable
              style={({ pressed }) => [styles.acaoCancelar, pressed && styles.pressedSoft]}
              onPress={onCancelar}
              accessibilityRole="button"
              accessibilityLabel={`${t('cta.cancel_order')}: ${order.senha}`}
            >
              <Ionicons name="close-outline" size={16} color={colors.error} />
              <Text style={styles.acaoCancelarTexto}>{t('cta.cancel')}</Text>
            </Pressable>
          ) : null}
        </View>
      ) : order.status === 'retirado' ? (
        <Pressable
          style={({ pressed }) => [styles.acaoPedirNovo, pressed && styles.pressedSoft]}
          onPress={onPedirNovo}
          accessibilityRole="button"
          accessibilityLabel={`${t('cta.reorder')}: ${order.senha}`}
        >
          <Ionicons name="refresh" size={16} color={colors.primary} />
          <Text style={styles.acaoPedirNovoTexto}>{t('cta.reorder')}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export default function PedidosScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { t } = useLocale();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { orders, isHydrated, refresh, markRetirado, markCancelado } = useOrders();
  const { clear, setQuantidade } = useCart();
  const [refreshing, setRefreshing] = useState(false);

  const handlePedirNovo = useCallback(
    (order: Order) => {
      clear();
      for (const ci of order.items) {
        setQuantidade(ci.itemId, ci.quantidade);
      }
      haptic.success();
      router.push('/carrinho');
    },
    [clear, setQuantidade, router],
  );

  const handleCancelar = useCallback(
    (order: Order) => {
      confirmar({
        titulo: t('order.cancel_confirm_title'),
        mensagem: t('order.cancel_confirm_message', { senha: order.senha }),
        confirmText: t('cta.cancel_order'),
        cancelText: t('cta.keep_order'),
        destrutivo: true,
        onConfirm: async () => {
          haptic.warning();
          await markCancelado(order.id);
        },
      });
    },
    [markCancelado, t],
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  const totalAtivos = orders.filter((o) => o.status !== 'retirado').length;

  if (!isHydrated) {
    return (
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top + spacing.lg }]}>
          <Text style={styles.tituloPagina}>{t('orders.title')}</Text>
          <Text style={styles.subtitulo}>{t('orders.loading')}</Text>
        </View>
        <View style={styles.listContent}>
          <SkeletonOrderCard />
          <SkeletonOrderCard />
          <SkeletonOrderCard />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.lg }]}>
        <Text style={styles.tituloPagina}>{t('orders.title')}</Text>
        <Text style={styles.subtitulo}>
          {totalAtivos > 0
            ? t(totalAtivos === 1 ? 'orders.active_singular' : 'orders.active_plural', { count: totalAtivos })
            : t('orders.no_active')}
        </Text>
      </View>

      <FlatList
        data={orders}
        keyExtractor={(o) => o.id}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: tabBarHeight + spacing.lg },
        ]}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <PedidoCard
            order={item}
            styles={styles}
            colors={colors}
            onMarcarRetirado={() => markRetirado(item.id)}
            onPedirNovo={() => handlePedirNovo(item)}
            onCancelar={() => handleCancelar(item)}
            onAbrirDetalhes={() => router.push(`/pedido/${item.id}`)}
          />
        )}
        ListEmptyComponent={
          <View>
            <EmptyState
              emoji="🧾"
              title={t('empty.orders_title')}
              subtitle={t('empty.orders_subtitle')}
            />
            <View style={styles.ctaWrapper}>
              <Pressable
                style={({ pressed }) => [styles.ctaBotao, pressed && styles.pressedSoft]}
                onPress={() => router.push('/cardapio')}
                accessibilityRole="button"
                accessibilityLabel={t('cta.go_to_menu')}
              >
                <Text style={styles.ctaBotaoTexto}>{t('cta.go_to_menu')}</Text>
              </Pressable>
            </View>
          </View>
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      />
    </View>
  );
}

const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: c.bg },
    header: {
      paddingHorizontal: spacing.xl,
      paddingBottom: spacing.lg,
    },
    tituloPagina: {
      fontFamily: fontFamily.extrabold,
      fontSize: fontSize['3xl'],
      color: c.text,
    },
    subtitulo: {
      fontFamily: fontFamily.medium,
      fontSize: fontSize.md,
      color: c.textMuted,
      marginTop: spacing.xs,
    },
    listContent: {
      paddingHorizontal: spacing.xl,
      paddingBottom: spacing['4xl'],
      flexGrow: 1,
    },
    card: {
      backgroundColor: c.surface,
      borderRadius: radius.xl,
      padding: spacing.lg,
      marginBottom: spacing.md,
      borderWidth: 1,
      borderColor: c.border,
      gap: spacing.md,
      ...shadow.md,
    },
    cardCabecaPressable: {
      gap: spacing.md,
    },
    cardFooterDireita: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs + 2,
    },
    cardHeader: {
      flexDirection: 'row',
      gap: spacing.lg,
    },
    senhaBox: {
      backgroundColor: c.primary,
      borderRadius: radius.md,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      alignItems: 'center',
      minWidth: 92,
      ...shadow.primary,
    },
    senhaLabel: {
      fontFamily: fontFamily.semibold,
      fontSize: fontSize.xs,
      color: 'rgba(255,255,255,0.78)',
      letterSpacing: letterSpacing.widest,
    },
    senhaNumero: {
      fontFamily: fontFamily.extrabold,
      fontSize: fontSize['3xl'] - 2,
      color: c.primaryText,
      letterSpacing: 2,
      marginTop: 2,
    },
    cardHeaderInfo: {
      flex: 1,
      justifyContent: 'space-between',
      alignItems: 'flex-end',
    },
    cardData: {
      fontFamily: fontFamily.medium,
      fontSize: fontSize.md,
      color: c.textMuted,
    },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs + 2,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs + 2,
      borderRadius: radius.full,
      borderWidth: 1,
    },
    statusLabel: {
      fontFamily: fontFamily.bold,
      fontSize: fontSize.xs,
      letterSpacing: letterSpacing.wider,
    },
    resumoLinha: {
      fontFamily: fontFamily.medium,
      fontSize: fontSize.md,
      color: c.textMuted,
      lineHeight: 20,
    },
    cardFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    totalLabel: {
      fontFamily: fontFamily.semibold,
      fontSize: fontSize.xs,
      color: c.textSubtle,
      letterSpacing: letterSpacing.widest,
    },
    totalValor: {
      fontFamily: fontFamily.extrabold,
      fontSize: fontSize.xl,
      color: c.primary,
    },
    acoesRow: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    acaoFlex: {
      flex: 1,
    },
    acaoBotao: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.md,
      borderRadius: radius.full,
      backgroundColor: c.surfaceElevated,
      borderWidth: 1,
      borderColor: c.border,
    },
    acaoBotaoTexto: {
      fontFamily: fontFamily.semibold,
      fontSize: fontSize.md,
      color: c.text,
    },
    acaoCancelar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xs + 2,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      borderRadius: radius.full,
      backgroundColor: 'rgba(248, 113, 113, 0.10)',
      borderWidth: 1,
      borderColor: 'rgba(248, 113, 113, 0.30)',
    },
    acaoCancelarTexto: {
      fontFamily: fontFamily.semibold,
      fontSize: fontSize.md,
      color: c.error,
    },
    acaoPedirNovo: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.md,
      borderRadius: radius.full,
      backgroundColor: c.primarySoft,
    },
    acaoPedirNovoTexto: {
      fontFamily: fontFamily.semibold,
      fontSize: fontSize.md,
      color: c.primary,
    },
    ctaWrapper: {
      paddingHorizontal: spacing.xl,
    },
    ctaBotao: {
      backgroundColor: c.primary,
      paddingVertical: spacing.lg,
      borderRadius: radius.full,
      alignItems: 'center',
      ...shadow.primary,
    },
    ctaBotaoTexto: {
      fontFamily: fontFamily.bold,
      color: c.primaryText,
      fontSize: fontSize.md,
    },
    pressedSoft: {
      opacity: 0.85,
      transform: [{ scale: 0.98 }],
    },
  });
