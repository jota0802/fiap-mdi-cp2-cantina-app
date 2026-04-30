import { Ionicons } from '@expo/vector-icons';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import ItemThumbnail from '@/components/ItemThumbnail';
import {
  fontFamily,
  fontSize,
  letterSpacing,
  radius,
  shadow,
  spacing,
  statusPalette,
} from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useFavorites } from '@/context/FavoritesContext';
import { useLocale } from '@/context/LocaleContext';
import { useOrders } from '@/context/OrdersContext';
import { useTheme } from '@/context/ThemeContext';
import CARDAPIO from '@/data/cardapio';
import { useFadeIn } from '@/hooks/useFadeIn';
import { haptic } from '@/lib/haptics';
import {
  getCombosDisponiveis,
  getPeriodoAtual,
  precoCombo,
  type Combo,
} from '@/lib/recomendacao';
import type { ItemCardapio, Order, ThemeColors } from '@/types';

const DESTAQUES = CARDAPIO.filter((item) => [1, 5, 6, 8].includes(item.id));

function getSaudacaoKey(): 'greeting.morning' | 'greeting.afternoon' | 'greeting.evening' {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return 'greeting.morning';
  if (h >= 12 && h < 18) return 'greeting.afternoon';
  return 'greeting.evening';
}

function primeiroNome(nome: string): string {
  return nome.trim().split(' ')[0] ?? nome;
}

function formatarHorario(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '—';
  }
}

export default function Home() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { opacity, translateY } = useFadeIn(450);

  const { t } = useLocale();
  const { user } = useAuth();
  const { orders } = useOrders();
  const { items: cartItems, totalItens, addItem } = useCart();
  const { favoritos } = useFavorites();

  const itensFavoritos = useMemo(
    () =>
      favoritos
        .map((id) => CARDAPIO.find((i) => i.id === id))
        .filter((x): x is ItemCardapio => !!x),
    [favoritos],
  );

  const pedidoAtivo: Order | undefined = useMemo(
    () => orders.find((o) => o.status === 'pendente' || o.status === 'pronto'),
    [orders],
  );

  const ultimosPedidos = useMemo(
    () =>
      [...orders]
        .sort((a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime())
        .slice(0, 4),
    [orders],
  );

  const periodoAtual = useMemo(() => getPeriodoAtual(), []);
  const cartItemIds = useMemo(() => cartItems.map((ci) => ci.itemId), [cartItems]);
  const combosDisponiveis = useMemo(
    () => getCombosDisponiveis(periodoAtual, orders, cartItemIds),
    [periodoAtual, orders, cartItemIds],
  );

  const [comboIndice, setComboIndice] = useState(0);
  const comboAtual = combosDisponiveis[comboIndice % combosDisponiveis.length] ?? combosDisponiveis[0];
  const podeTrocar = combosDisponiveis.length > 1;

  const comboItems = useMemo(
    () =>
      comboAtual
        ? comboAtual.itemIds
            .map((id) => CARDAPIO.find((i) => i.id === id))
            .filter((x): x is ItemCardapio => !!x)
        : [],
    [comboAtual],
  );
  const comboPreco = useMemo(
    () => (comboAtual ? precoCombo(comboAtual, CARDAPIO) : 0),
    [comboAtual],
  );

  const saudacao = t(getSaudacaoKey());
  const nome = user ? primeiroNome(user.nome) : t('greeting.guest');

  const handleAdicionarCombo = () => {
    if (!comboAtual) return;
    for (const id of comboAtual.itemIds) {
      addItem(id);
    }
    haptic.success();
    router.push('/carrinho');
  };

  const handleTrocarCombo = () => {
    if (combosDisponiveis.length === 0) return;
    haptic.selection();
    setComboIndice((i) => (i + 1) % combosDisponiveis.length);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + spacing.lg, paddingBottom: tabBarHeight + spacing.lg },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Saudação */}
        <Animated.View
          style={[styles.saudacaoBlock, { opacity, transform: [{ translateY }] }]}
        >
          <Text style={styles.saudacao}>
            {saudacao},{'\n'}
            <Text style={styles.saudacaoNome}>{nome}</Text>
            <Text style={styles.wave}> 👋</Text>
          </Text>
        </Animated.View>

        {/* Card de pedido ativo (só se houver) */}
        {pedidoAtivo ? (
          <PedidoAtivoCard
            order={pedidoAtivo}
            colors={colors}
            styles={styles}
            onPress={() => router.push('/pedidos')}
          />
        ) : null}

        {/* Bento 2-coluna */}
        <View style={styles.bentoRow}>
          <Pressable
            style={({ pressed }) => [styles.bentoBig, pressed && styles.pressedSoft]}
            onPress={() => router.push('/cardapio')}
            accessibilityRole="button"
            accessibilityLabel="Ver cardápio completo"
          >
            <View style={styles.bentoBigBackdrop}>
              <Text style={styles.bentoBigEmoji}>🍔</Text>
            </View>
            <View style={styles.bentoBigContent}>
              <View>
                <Text style={styles.bentoBigEyebrow}>{t('home.new_order')}</Text>
                <Text style={styles.bentoBigTitulo}>{t('home.see_menu')}</Text>
              </View>
              <View style={styles.bentoBigArrow}>
                <Ionicons name="arrow-forward" size={18} color={colors.primaryText} />
              </View>
            </View>
          </Pressable>

          <View style={styles.bentoStack}>
            <Pressable
              style={({ pressed }) => [styles.bentoSmall, pressed && styles.pressedSoft]}
              onPress={() => router.push('/carrinho')}
              accessibilityRole="button"
              accessibilityLabel={
                totalItens > 0
                  ? `${t('home.cart')}: ${totalItens}`
                  : t('home.cart')
              }
            >
              <View style={styles.bentoSmallTopo}>
                <View style={[styles.bentoIconWrap, { backgroundColor: colors.primarySoft }]}>
                  <Ionicons name="bag-handle-outline" size={16} color={colors.primary} />
                </View>
                {totalItens > 0 ? (
                  <View style={styles.bentoBadge}>
                    <Text style={styles.bentoBadgeText}>{totalItens}</Text>
                  </View>
                ) : null}
              </View>
              <View>
                <Text style={styles.bentoSmallTitulo}>{t('home.cart')}</Text>
                <Text style={styles.bentoSmallSub}>
                  {totalItens > 0
                    ? `${totalItens} ${t(totalItens === 1 ? 'cart.item_singular' : 'cart.item_plural')}`
                    : t('home.empty_cart')}
                </Text>
              </View>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.bentoSmall, pressed && styles.pressedSoft]}
              onPress={() => router.push('/pedidos')}
              accessibilityRole="button"
              accessibilityLabel="Ver histórico de pedidos"
            >
              <View style={styles.bentoSmallTopo}>
                <View style={[styles.bentoIconWrap, { backgroundColor: colors.surfaceElevated }]}>
                  <Ionicons name="time-outline" size={16} color={colors.text} />
                </View>
              </View>
              <View>
                <Text style={styles.bentoSmallTitulo}>{t('home.history')}</Text>
                <Text style={styles.bentoSmallSub}>
                  {orders.length > 0
                    ? `${orders.length} ${orders.length === 1 ? 'pedido' : 'pedidos'}`
                    : t('home.no_orders')}
                </Text>
              </View>
            </Pressable>
          </View>
        </View>

        {/* Combo recomendado */}
        {comboAtual && comboItems.length === 2 ? (
          <ComboCard
            combo={comboAtual}
            items={comboItems}
            preco={comboPreco}
            colors={colors}
            styles={styles}
            onAdicionar={handleAdicionarCombo}
            onTrocar={podeTrocar ? handleTrocarCombo : undefined}
          />
        ) : null}

        {/* Seus favoritos */}
        {itensFavoritos.length > 0 ? (
          <>
            <View style={styles.secaoHeader}>
              <View style={styles.secaoHeaderEsquerda}>
                <Ionicons name="heart" size={16} color={colors.error} />
                <Text style={styles.secaoTitulo}>{t('home.your_favorites')}</Text>
              </View>
              <Pressable
                hitSlop={10}
                onPress={() => router.push('/cardapio')}
                accessibilityRole="link"
                accessibilityLabel="Ver todos os favoritos no cardápio"
              >
                <Text style={styles.secaoLink}>{t('home.see_all')}</Text>
              </Pressable>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.destaquesScroll}
            >
              {itensFavoritos.map((item) => (
                <Pressable
                  key={item.id}
                  style={({ pressed }) => [styles.destaqueCard, pressed && styles.pressedSoft]}
                  onPress={() => router.push('/cardapio')}
                  accessibilityRole="button"
                  accessibilityLabel={`Favorito: ${item.nome}, R$ ${item.preco.toFixed(2)}. Tocar abre o cardápio`}
                >
                  <View style={styles.destaqueImagemWrap}>
                    <ItemThumbnail
                      emoji={item.emoji}
                      imagem={item.imagem}
                      size={108}
                      borderRadius={radius.md}
                      bgColor={colors.surfaceElevated}
                    />
                  </View>
                  <Text style={styles.destaqueNome} numberOfLines={1}>
                    {item.nome}
                  </Text>
                  <Text style={styles.destaquePreco}>R$ {item.preco.toFixed(2)}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </>
        ) : null}

        {/* Destaques */}
        <View style={styles.secaoHeader}>
          <Text style={styles.secaoTitulo}>{t('home.featured')}</Text>
          <Pressable
            hitSlop={10}
            onPress={() => router.push('/cardapio')}
            accessibilityRole="link"
            accessibilityLabel="Ver todos os destaques no cardápio"
          >
            <Text style={styles.secaoLink}>Ver tudo</Text>
          </Pressable>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.destaquesScroll}
        >
          {DESTAQUES.map((item) => (
            <Pressable
              key={item.id}
              style={({ pressed }) => [styles.destaqueCard, pressed && styles.pressedSoft]}
              onPress={() => router.push('/cardapio')}
              accessibilityRole="button"
              accessibilityLabel={`Destaque: ${item.nome}, R$ ${item.preco.toFixed(2)}. Tocar abre o cardápio`}
            >
              <View style={styles.destaqueImagemWrap}>
                <ItemThumbnail
                  emoji={item.emoji}
                  imagem={item.imagem}
                  size={108}
                  borderRadius={radius.md}
                  bgColor={colors.surfaceElevated}
                />
              </View>
              <Text style={styles.destaqueNome} numberOfLines={1}>
                {item.nome}
              </Text>
              <Text style={styles.destaquePreco}>R$ {item.preco.toFixed(2)}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Últimos pedidos */}
        {ultimosPedidos.length > 0 ? (
          <>
            <View style={styles.secaoHeader}>
              <Text style={styles.secaoTitulo}>{t('home.recent_orders')}</Text>
              <Pressable
                hitSlop={10}
                onPress={() => router.push('/pedidos')}
                accessibilityRole="link"
                accessibilityLabel="Ver todos os pedidos"
              >
                <Text style={styles.secaoLink}>{t('home.see_all')}</Text>
              </Pressable>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.ultimosScroll}
            >
              {ultimosPedidos.map((order) => (
                <UltimoPedidoCard
                  key={order.id}
                  order={order}
                  styles={styles}
                  onPress={() => router.push(`/pedido/${order.id}`)}
                />
              ))}
            </ScrollView>
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}

type ComboCardProps = {
  combo: Combo;
  items: ItemCardapio[];
  preco: number;
  colors: ThemeColors;
  styles: ReturnType<typeof createStyles>;
  onAdicionar: () => void;
  onTrocar?: () => void;
};

function ComboCard({
  combo,
  items,
  preco,
  colors,
  styles,
  onAdicionar,
  onTrocar,
}: ComboCardProps) {
  const { t } = useLocale();
  const personalizado = combo.fonte === 'historico';
  const alternativo = combo.fonte === 'alternativo';
  const accent = personalizado ? colors.primary : '#F59E0B';
  const accentBg = personalizado ? colors.primarySoft : 'rgba(245, 158, 11, 0.14)';
  const eyebrow = personalizado
    ? t('home.personalized')
    : alternativo
      ? t('home.alternative')
      : t('home.suggestion');

  return (
    <View style={styles.comboCard}>
      <View style={styles.comboHeaderRow}>
        <View style={[styles.comboChip, { backgroundColor: accentBg }]}>
          <Ionicons
            name={personalizado ? 'heart' : 'sparkles'}
            size={11}
            color={accent}
          />
          <Text style={[styles.comboChipTexto, { color: accent }]}>{eyebrow}</Text>
        </View>

        {onTrocar ? (
          <Pressable
            onPress={onTrocar}
            hitSlop={10}
            style={({ pressed }) => [
              styles.comboTrocarBtn,
              pressed && styles.pressedSoft,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Trocar sugestão de combo"
          >
            <Ionicons name="refresh" size={14} color={colors.textMuted} />
          </Pressable>
        ) : null}
      </View>

      <Text style={styles.comboTitulo}>{t(combo.tituloKey)}</Text>
      <Text style={styles.comboSubtitulo} numberOfLines={1}>
        {t(combo.subtituloKey, combo.recencyCount ? { count: combo.recencyCount } : {})}
      </Text>

      <View style={styles.comboItensInline}>
        {items.map((item, idx) => (
          <View key={item.id} style={styles.comboItemInline}>
            {idx > 0 ? <Text style={styles.comboPlusInline}>+</Text> : null}
            <ItemThumbnail
              emoji={item.emoji}
              imagem={item.imagem}
              size={28}
              borderRadius={8}
              bgColor={colors.bg}
            />
            <Text style={styles.comboItemNomeInline} numberOfLines={1}>
              {item.nome}
            </Text>
          </View>
        ))}
      </View>

      <Pressable
        style={({ pressed }) => [styles.comboCta, pressed && styles.comboCtaPressed]}
        onPress={onAdicionar}
        accessibilityRole="button"
        accessibilityLabel={`${t('cta.add_to_cart')}: ${t(combo.tituloKey)} R$ ${preco.toFixed(2)}`}
      >
        <View style={styles.comboCtaIconWrap}>
          <Ionicons name="bag-add" size={16} color={colors.primaryText} />
        </View>
        <Text style={styles.comboCtaTexto}>{t('cta.add_to_cart')}</Text>
        <View style={styles.comboCtaPrecoChip}>
          <Text style={styles.comboCtaPrecoTexto}>R$ {preco.toFixed(2)}</Text>
        </View>
      </Pressable>
    </View>
  );
}

type UltimoPedidoCardProps = {
  order: Order;
  styles: ReturnType<typeof createStyles>;
  onPress: () => void;
};

function UltimoPedidoCard({ order, styles, onPress }: UltimoPedidoCardProps) {
  const { t } = useLocale();
  const palette = statusPalette[order.status];
  const statusLabel = t(palette.labelKey);

  return (
    <Pressable
      style={({ pressed }) => [styles.ultimoCard, pressed && styles.pressedSoft]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${t('orders.password_label')} ${order.senha}, ${statusLabel}, R$ ${order.total.toFixed(2)}`}
    >
      <View
        style={[
          styles.ultimoStatus,
          { backgroundColor: palette.bg, borderColor: palette.border },
        ]}
      >
        <Ionicons name={palette.icon} size={11} color={palette.color} />
        <Text style={[styles.ultimoStatusTexto, { color: palette.color }]}>
          {statusLabel.toUpperCase()}
        </Text>
      </View>

      <View style={styles.ultimoMeio}>
        <Text style={styles.ultimoSenhaLabel}>{t('orders.password_label')}</Text>
        <Text style={styles.ultimoSenha}>{order.senha}</Text>
      </View>

      <View style={styles.ultimoFooter}>
        <Text style={styles.ultimoHora}>{formatarHorario(order.criadoEm)}</Text>
        <Text style={styles.ultimoTotal}>R$ {order.total.toFixed(2)}</Text>
      </View>
    </Pressable>
  );
}

type PedidoAtivoCardProps = {
  order: Order;
  colors: ThemeColors;
  styles: ReturnType<typeof createStyles>;
  onPress: () => void;
};

function PedidoAtivoCard({ order, colors, styles, onPress }: PedidoAtivoCardProps) {
  const { t } = useLocale();
  const status = order.status === 'retirado' ? 'pronto' : order.status;
  const palette = statusPalette[status];
  const statusLabel = t(palette.labelKey);
  const itens = order.items.reduce((acc, ci) => acc + ci.quantidade, 0);

  return (
    <Pressable
      style={({ pressed }) => [styles.pedidoAtivoCard, pressed && styles.pressedSoft]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${t('home.track_order')}: ${order.senha}, ${statusLabel}`}
    >
      <View style={styles.pedidoAtivoTopo}>
        <View
          style={[
            styles.pedidoAtivoStatus,
            { backgroundColor: palette.bg, borderColor: palette.border },
          ]}
        >
          <Ionicons name={palette.icon} size={12} color={palette.color} />
          <Text style={[styles.pedidoAtivoStatusTexto, { color: palette.color }]}>
            {statusLabel.toUpperCase()}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.textSubtle} />
      </View>

      <View style={styles.pedidoAtivoMeio}>
        <View>
          <Text style={styles.pedidoAtivoLabel}>{t('home.your_order')}</Text>
          <Text style={styles.pedidoAtivoSenha}>{order.senha}</Text>
        </View>
        <View style={styles.pedidoAtivoMeta}>
          <Text style={styles.pedidoAtivoMetaLabel}>
            {itens} {t(itens === 1 ? 'cart.item_singular' : 'cart.item_plural')}
          </Text>
          <Text style={styles.pedidoAtivoMetaValor}>
            R$ {order.total.toFixed(2)}
          </Text>
        </View>
      </View>

      <View style={styles.pedidoAtivoCta}>
        <Text style={styles.pedidoAtivoCtaTexto}>{t('home.track_order')}</Text>
        <Ionicons name="arrow-forward" size={14} color={colors.primary} />
      </View>
    </Pressable>
  );
}

const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: c.bg },
    scrollContent: {
      paddingBottom: spacing['4xl'],
    },
    saudacaoBlock: {
      paddingHorizontal: spacing.xl,
      marginBottom: spacing['2xl'],
    },
    saudacao: {
      fontFamily: fontFamily.medium,
      fontSize: fontSize['3xl'],
      color: c.textMuted,
      lineHeight: fontSize['3xl'] * 1.15,
    },
    saudacaoNome: {
      fontFamily: fontFamily.extrabold,
      color: c.text,
    },
    wave: {
      fontFamily: fontFamily.regular,
    },

    /* Pedido ativo */
    pedidoAtivoCard: {
      marginHorizontal: spacing.xl,
      marginBottom: spacing.lg,
      backgroundColor: c.surface,
      borderRadius: radius.xl,
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: c.border,
      gap: spacing.md,
      ...shadow.md,
    },
    pedidoAtivoTopo: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    pedidoAtivoStatus: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      borderRadius: radius.full,
      borderWidth: 1,
    },
    pedidoAtivoStatusTexto: {
      fontFamily: fontFamily.bold,
      fontSize: fontSize.xs,
      letterSpacing: letterSpacing.wider,
    },
    pedidoAtivoMeio: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
    },
    pedidoAtivoLabel: {
      fontFamily: fontFamily.semibold,
      fontSize: fontSize.xs,
      color: c.textSubtle,
      letterSpacing: letterSpacing.widest,
    },
    pedidoAtivoSenha: {
      fontFamily: fontFamily.extrabold,
      fontSize: fontSize['4xl'],
      color: c.text,
      letterSpacing: 2,
      marginTop: 2,
    },
    pedidoAtivoMeta: {
      alignItems: 'flex-end',
    },
    pedidoAtivoMetaLabel: {
      fontFamily: fontFamily.medium,
      fontSize: fontSize.md,
      color: c.textMuted,
    },
    pedidoAtivoMetaValor: {
      fontFamily: fontFamily.bold,
      fontSize: fontSize.lg,
      color: c.text,
      marginTop: 2,
    },
    pedidoAtivoCta: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xs + 2,
      paddingTop: spacing.sm,
      borderTopWidth: 1,
      borderTopColor: c.separator,
    },
    pedidoAtivoCtaTexto: {
      fontFamily: fontFamily.semibold,
      fontSize: fontSize.md,
      color: c.primary,
    },

    /* Bento grid */
    bentoRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      paddingHorizontal: spacing.xl,
      marginBottom: spacing.xl,
      height: 220,
    },
    bentoBig: {
      flex: 1.1,
      backgroundColor: c.primary,
      borderRadius: radius.xl,
      padding: spacing.lg,
      justifyContent: 'space-between',
      overflow: 'hidden',
      ...shadow.primary,
    },
    bentoBigBackdrop: {
      position: 'absolute',
      right: -spacing.lg,
      bottom: -spacing.xl,
      opacity: 0.22,
    },
    bentoBigEmoji: {
      fontSize: 130,
    },
    bentoBigContent: {
      flex: 1,
      justifyContent: 'space-between',
    },
    bentoBigEyebrow: {
      fontFamily: fontFamily.semibold,
      fontSize: fontSize.xs,
      color: 'rgba(255,255,255,0.75)',
      letterSpacing: letterSpacing.widest,
    },
    bentoBigTitulo: {
      fontFamily: fontFamily.extrabold,
      fontSize: fontSize['2xl'],
      color: c.primaryText,
      marginTop: spacing.xs,
      lineHeight: fontSize['2xl'] * 1.1,
    },
    bentoBigArrow: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(255,255,255,0.18)',
      alignItems: 'center',
      justifyContent: 'center',
      alignSelf: 'flex-start',
    },
    bentoStack: {
      flex: 1,
      gap: spacing.sm,
    },
    bentoSmall: {
      flex: 1,
      backgroundColor: c.surface,
      borderRadius: radius.xl,
      padding: spacing.md,
      justifyContent: 'space-between',
      borderWidth: 1,
      borderColor: c.border,
    },
    bentoSmallTopo: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    bentoIconWrap: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    bentoBadge: {
      backgroundColor: c.primary,
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
      borderRadius: radius.full,
      minWidth: 20,
      alignItems: 'center',
    },
    bentoBadgeText: {
      fontFamily: fontFamily.bold,
      fontSize: fontSize.xs,
      color: c.primaryText,
    },
    bentoSmallTitulo: {
      fontFamily: fontFamily.bold,
      fontSize: fontSize.base,
      color: c.text,
    },
    bentoSmallSub: {
      fontFamily: fontFamily.medium,
      fontSize: fontSize.md,
      color: c.textMuted,
      marginTop: 2,
    },

    /* Combo card minimalista */
    comboCard: {
      marginHorizontal: spacing.xl,
      marginBottom: spacing.xl,
      backgroundColor: c.surface,
      borderRadius: radius.lg,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: c.border,
      gap: spacing.sm,
    },
    comboHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    comboChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: spacing.sm,
      paddingVertical: 3,
      borderRadius: radius.full,
    },
    comboChipTexto: {
      fontFamily: fontFamily.bold,
      fontSize: fontSize.xs,
      letterSpacing: letterSpacing.widest,
    },
    comboTrocarBtn: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.surfaceElevated,
      borderWidth: 1,
      borderColor: c.border,
    },
    comboTitulo: {
      fontFamily: fontFamily.bold,
      fontSize: fontSize.base,
      color: c.text,
    },
    comboSubtitulo: {
      fontFamily: fontFamily.medium,
      fontSize: fontSize.sm,
      color: c.textMuted,
      marginTop: -spacing.xs,
    },
    comboItensInline: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      flexWrap: 'wrap',
    },
    comboItemInline: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs + 2,
    },
    comboPlusInline: {
      fontFamily: fontFamily.bold,
      fontSize: fontSize.md,
      color: c.textSubtle,
      marginHorizontal: 2,
    },
    comboItemNomeInline: {
      fontFamily: fontFamily.medium,
      fontSize: fontSize.md,
      color: c.textMuted,
      maxWidth: 110,
    },
    comboCta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm + 2,
      marginTop: spacing.sm,
      backgroundColor: c.primary,
      borderRadius: radius.full,
      ...shadow.primary,
    },
    comboCtaPressed: {
      opacity: 0.92,
      transform: [{ scale: 0.98 }],
    },
    comboCtaIconWrap: {
      width: 26,
      height: 26,
      borderRadius: 13,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(255,255,255,0.2)',
    },
    comboCtaTexto: {
      flex: 1,
      fontFamily: fontFamily.bold,
      fontSize: fontSize.md,
      color: c.primaryText,
    },
    comboCtaPrecoChip: {
      paddingHorizontal: spacing.sm + 2,
      paddingVertical: 4,
      borderRadius: radius.full,
      backgroundColor: 'rgba(255,255,255,0.22)',
    },
    comboCtaPrecoTexto: {
      fontFamily: fontFamily.extrabold,
      fontSize: fontSize.sm,
      color: c.primaryText,
    },

    /* Últimos pedidos */
    ultimosScroll: {
      gap: spacing.sm,
      paddingHorizontal: spacing.xl,
      paddingBottom: spacing.lg,
    },
    ultimoCard: {
      width: 152,
      backgroundColor: c.surface,
      borderRadius: radius.lg,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: c.border,
      gap: spacing.sm,
    },
    ultimoStatus: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      gap: 4,
      paddingHorizontal: spacing.sm,
      paddingVertical: 3,
      borderRadius: radius.full,
      borderWidth: 1,
    },
    ultimoStatusTexto: {
      fontFamily: fontFamily.bold,
      fontSize: fontSize.xs,
      letterSpacing: letterSpacing.wider,
    },
    ultimoMeio: {
      paddingVertical: spacing.xs,
    },
    ultimoSenhaLabel: {
      fontFamily: fontFamily.semibold,
      fontSize: fontSize.xs,
      color: c.textSubtle,
      letterSpacing: letterSpacing.widest,
    },
    ultimoSenha: {
      fontFamily: fontFamily.extrabold,
      fontSize: fontSize['2xl'],
      color: c.text,
      marginTop: 2,
    },
    ultimoFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: spacing.xs,
      borderTopWidth: 1,
      borderTopColor: c.separator,
    },
    ultimoHora: {
      fontFamily: fontFamily.medium,
      fontSize: fontSize.md,
      color: c.textMuted,
    },
    ultimoTotal: {
      fontFamily: fontFamily.bold,
      fontSize: fontSize.md,
      color: c.text,
    },

    /* Destaques */
    secaoHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: spacing.xl,
      marginBottom: spacing.md,
    },
    secaoHeaderEsquerda: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs + 2,
    },
    secaoTitulo: {
      fontFamily: fontFamily.bold,
      fontSize: fontSize.lg,
      color: c.text,
    },
    secaoLink: {
      fontFamily: fontFamily.semibold,
      fontSize: fontSize.md,
      color: c.primary,
    },
    destaquesScroll: {
      gap: spacing.sm,
      paddingHorizontal: spacing.xl,
      paddingBottom: spacing.lg,
    },
    destaqueCard: {
      width: 140,
      backgroundColor: c.surface,
      borderRadius: radius.lg,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: c.border,
    },
    destaqueImagemWrap: {
      marginBottom: spacing.md,
    },
    destaqueNome: {
      fontFamily: fontFamily.semibold,
      fontSize: fontSize.md,
      color: c.text,
    },
    destaquePreco: {
      fontFamily: fontFamily.bold,
      fontSize: fontSize.base,
      color: c.text,
      marginTop: spacing.xs,
    },

    pressedSoft: {
      opacity: 0.85,
      transform: [{ scale: 0.98 }],
    },
  });
