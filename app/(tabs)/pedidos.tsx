import { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import EmptyState from '@/components/EmptyState';
import LoadingScreen from '@/components/LoadingScreen';
import { useOrders } from '@/context/OrdersContext';
import { useTheme } from '@/context/ThemeContext';
import { fontFamily, fontSize, letterSpacing, radius, spacing } from '@/constants/theme';
import type { Order, ThemeColors } from '@/types';

function formatarData(iso: string): string {
  const date = new Date(iso);
  const data = date.toLocaleDateString('pt-BR');
  const hora = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  return `${data} · ${hora}`;
}

type StatusInfo = { label: string; color: string };

function getStatusInfo(status: Order['status'], colors: ThemeColors): StatusInfo {
  switch (status) {
    case 'retirado':
      return { label: 'RETIRADO', color: colors.textSubtle };
    case 'pronto':
      return { label: 'PRONTO', color: colors.success };
    case 'pendente':
    default:
      return { label: 'PREPARANDO', color: colors.primary };
  }
}

type CardProps = {
  order: Order;
  styles: ReturnType<typeof createStyles>;
  colors: ThemeColors;
  onMarcarRetirado: () => void;
};

function PedidoCard({ order, styles, colors, onMarcarRetirado }: CardProps) {
  const status = getStatusInfo(order.status, colors);

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.senhaBox}>
          <Text style={styles.senhaLabel}>SENHA</Text>
          <Text style={styles.senhaNumero}>{order.senha}</Text>
        </View>
        <View style={styles.cardHeaderInfo}>
          <Text style={styles.cardData}>{formatarData(order.criadoEm)}</Text>
          <View style={[styles.statusBadge, { borderColor: status.color }]}>
            <View style={[styles.statusDot, { backgroundColor: status.color }]} />
            <Text style={[styles.statusLabel, { color: status.color }]}>{status.label}</Text>
          </View>
        </View>
      </View>

      <View style={styles.divisor} />

      <Text style={styles.resumoLinha}>{order.resumo}</Text>

      <View style={styles.cardFooter}>
        <Text style={styles.totalLabel}>TOTAL</Text>
        <Text style={styles.totalValor}>R$ {order.total.toFixed(2)}</Text>
      </View>

      {order.status !== 'retirado' ? (
        <TouchableOpacity
          style={styles.acaoBotao}
          onPress={onMarcarRetirado}
          activeOpacity={0.8}
        >
          <Ionicons name="checkmark-circle-outline" size={16} color={colors.text} />
          <Text style={styles.acaoBotaoTexto}>MARCAR COMO RETIRADO</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

export default function PedidosScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { orders, isHydrated, refresh, markRetirado } = useOrders();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  if (!isHydrated) {
    return <LoadingScreen label="CARREGANDO PEDIDOS" />;
  }

  const totalAtivos = orders.filter((o) => o.status !== 'retirado').length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.titulo}>PEDIDOS</Text>
        <Text style={styles.subtitulo}>
          {totalAtivos > 0
            ? `${totalAtivos} ${totalAtivos === 1 ? 'PEDIDO ATIVO' : 'PEDIDOS ATIVOS'}`
            : 'NENHUM PEDIDO ATIVO'}
        </Text>
      </View>

      <FlatList
        data={orders}
        keyExtractor={(o) => o.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <PedidoCard
            order={item}
            styles={styles}
            colors={colors}
            onMarcarRetirado={() => markRetirado(item.id)}
          />
        )}
        ListEmptyComponent={
          <View>
            <EmptyState
              emoji="🧾"
              title="Nenhum pedido ainda"
              subtitle="Faça seu primeiro pedido pelo cardápio para acompanhar aqui"
            />
            <View style={styles.ctaWrapper}>
              <TouchableOpacity
                style={styles.ctaBotao}
                onPress={() => router.push('/cardapio')}
                activeOpacity={0.85}
              >
                <Text style={styles.ctaBotaoTexto}>IR PARA O CARDÁPIO</Text>
              </TouchableOpacity>
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
      paddingTop: 60,
      paddingHorizontal: spacing.xl,
      paddingBottom: spacing.lg,
    },
    titulo: {
      fontFamily: fontFamily.extrabold,
      fontSize: fontSize['3xl'],
      color: c.text,
      letterSpacing: letterSpacing.ultra,
    },
    subtitulo: {
      fontFamily: fontFamily.medium,
      fontSize: fontSize.sm,
      color: c.textSubtle,
      letterSpacing: letterSpacing.wider,
      marginTop: spacing.xs,
    },
    listContent: {
      paddingHorizontal: spacing.xl,
      paddingBottom: spacing['4xl'],
      flexGrow: 1,
    },
    card: {
      backgroundColor: c.card,
      borderRadius: radius.lg,
      padding: spacing.xl,
      marginBottom: spacing.md,
      borderWidth: 1,
      borderColor: c.border,
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
      minWidth: 88,
    },
    senhaLabel: {
      fontFamily: fontFamily.semibold,
      fontSize: 9,
      color: 'rgba(255,255,255,0.7)',
      letterSpacing: letterSpacing.wider,
    },
    senhaNumero: {
      fontFamily: fontFamily.extrabold,
      fontSize: fontSize['3xl'] - 2,
      color: c.primaryText,
      letterSpacing: 4,
      marginTop: 2,
    },
    cardHeaderInfo: {
      flex: 1,
      justifyContent: 'space-between',
      alignItems: 'flex-end',
    },
    cardData: {
      fontFamily: fontFamily.medium,
      fontSize: fontSize.sm,
      color: c.textMuted,
      letterSpacing: letterSpacing.normal,
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
    statusDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    statusLabel: {
      fontFamily: fontFamily.bold,
      fontSize: 10,
      letterSpacing: letterSpacing.wide,
    },
    divisor: {
      height: 1,
      backgroundColor: c.border,
      marginVertical: spacing.md + 2,
    },
    resumoLinha: {
      fontFamily: fontFamily.regular,
      fontSize: fontSize.md,
      color: c.textMuted,
      lineHeight: 20,
    },
    cardFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: spacing.md,
    },
    totalLabel: {
      fontFamily: fontFamily.semibold,
      fontSize: fontSize.sm,
      color: c.textSubtle,
      letterSpacing: letterSpacing.wide,
    },
    totalValor: {
      fontFamily: fontFamily.extrabold,
      fontSize: fontSize.xl,
      color: c.primary,
    },
    acaoBotao: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      marginTop: spacing.md,
      paddingVertical: spacing.md,
      borderRadius: radius.full,
      backgroundColor: c.cardElevated,
      borderWidth: 1,
      borderColor: c.border,
    },
    acaoBotaoTexto: {
      fontFamily: fontFamily.bold,
      fontSize: fontSize.xs,
      color: c.text,
      letterSpacing: letterSpacing.wide,
    },
    ctaWrapper: {
      paddingHorizontal: spacing.xl,
    },
    ctaBotao: {
      backgroundColor: c.primary,
      paddingVertical: spacing.lg,
      borderRadius: radius.full,
      alignItems: 'center',
    },
    ctaBotaoTexto: {
      fontFamily: fontFamily.bold,
      color: c.primaryText,
      fontSize: fontSize.md,
      letterSpacing: letterSpacing.wide,
    },
  });
