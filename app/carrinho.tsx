import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import EmptyState from '@/components/EmptyState';
import ItemThumbnail from '@/components/ItemThumbnail';
import {
  fontFamily,
  fontSize,
  radius,
  shadow,
  spacing,
} from '@/constants/theme';
import { useCart } from '@/context/CartContext';
import { useLocale } from '@/context/LocaleContext';
import { useTheme } from '@/context/ThemeContext';
import CARDAPIO from '@/data/cardapio';
import { useFadeIn } from '@/hooks/useFadeIn';
import { haptic } from '@/lib/haptics';
import type { ItemCardapio, ThemeColors } from '@/types';

type LinhaItemProps = {
  item: ItemCardapio;
  quantidade: number;
  onAdicionar: () => void;
  onRemover: () => void;
  onRemoverTodos: () => void;
  styles: ReturnType<typeof createStyles>;
  colors: ThemeColors;
};

function LinhaItem({
  item,
  quantidade,
  onAdicionar,
  onRemover,
  onRemoverTodos,
  styles,
  colors,
}: LinhaItemProps) {
  const subtotal = item.preco * quantidade;

  return (
    <View style={styles.linha}>
      <ItemThumbnail
        emoji={item.emoji}
        imagem={item.imagem}
        size={56}
        borderRadius={12}
        bgColor={colors.surfaceElevated}
      />

      <View style={styles.linhaInfo}>
        <View style={styles.linhaTopo}>
          <View style={styles.linhaNomeWrap}>
            <Text style={styles.linhaNome} numberOfLines={1}>
              {item.nome}
            </Text>
            <Text style={styles.linhaPrecoUnit}>
              R$ {item.preco.toFixed(2)} · cada
            </Text>
          </View>
          <Pressable
            onPress={() => {
              haptic.warning();
              onRemoverTodos();
            }}
            hitSlop={10}
            style={styles.removeButton}
            accessibilityRole="button"
            accessibilityLabel={`Remover ${item.nome} do carrinho`}
          >
            <Ionicons name="close" size={16} color={colors.textSubtle} />
          </Pressable>
        </View>

        <View style={styles.linhaControles}>
          <View style={styles.qtyGroup}>
            <Pressable
              style={({ pressed }) => [styles.qtyBotao, pressed && styles.pressed]}
              onPress={() => {
                haptic.light();
                onRemover();
              }}
              hitSlop={6}
              accessibilityRole="button"
              accessibilityLabel={`Diminuir quantidade de ${item.nome}`}
            >
              <Ionicons name="remove" size={14} color={colors.text} />
            </Pressable>
            <Text style={styles.qtyValor}>{quantidade}</Text>
            <Pressable
              style={({ pressed }) => [
                styles.qtyBotao,
                styles.qtyBotaoPrimary,
                pressed && styles.pressed,
              ]}
              onPress={() => {
                haptic.light();
                onAdicionar();
              }}
              hitSlop={6}
              accessibilityRole="button"
              accessibilityLabel={`Aumentar quantidade de ${item.nome}`}
            >
              <Ionicons name="add" size={14} color={colors.primaryText} />
            </Pressable>
          </View>

          <Text style={styles.linhaSubtotal}>R$ {subtotal.toFixed(2)}</Text>
        </View>
      </View>
    </View>
  );
}

export default function CarrinhoScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { t } = useLocale();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { opacity } = useFadeIn(350);

  const { items, totalItens, totalPreco, addItem, removeItem, setQuantidade, clear } = useCart();

  const linhasComItem = useMemo(
    () =>
      items
        .map((ci) => {
          const item = CARDAPIO.find((i) => i.id === ci.itemId);
          if (!item) return null;
          return { item, quantidade: ci.quantidade };
        })
        .filter((x): x is { item: ItemCardapio; quantidade: number } => x !== null),
    [items],
  );

  const handleConfirmar = () => {
    if (totalItens === 0) return;
    haptic.success();
    router.push('/confirmacao');
  };

  const handleLimpar = () => {
    haptic.warning();
    clear();
  };

  const handleVoltar = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/cardapio');
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.headerNav, { paddingTop: insets.top + spacing.lg }]}>
        <Pressable
          onPress={handleVoltar}
          hitSlop={12}
          style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel={t('cta.back')}
        >
          <Ionicons name="chevron-back" size={20} color={colors.text} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitulo}>{t('cart.title')}</Text>
        </View>
        {items.length > 0 ? (
          <Pressable
            onPress={handleLimpar}
            hitSlop={12}
            style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel={t('cta.cancel')}
          >
            <Ionicons name="trash-outline" size={18} color={colors.textMuted} />
          </Pressable>
        ) : (
          <View style={styles.iconButtonSpacer} />
        )}
      </View>

      <Animated.View style={{ flex: 1, opacity }}>
        {totalItens === 0 ? (
          <ScrollView
            contentContainerStyle={styles.emptyScroll}
            showsVerticalScrollIndicator={false}
          >
            <EmptyState
              emoji="🛒"
              title={t('empty.cart_title')}
              subtitle={t('empty.cart_subtitle')}
            />
            <View style={styles.emptyAcao}>
              <Pressable
                style={({ pressed }) => [styles.emptyBotao, pressed && styles.pressedSoft]}
                onPress={() => router.replace('/cardapio')}
                accessibilityRole="button"
                accessibilityLabel={t('cta.go_to_menu')}
              >
                <Ionicons name="restaurant-outline" size={18} color={colors.primaryText} />
                <Text style={styles.emptyBotaoTexto}>{t('cta.go_to_menu')}</Text>
              </Pressable>
            </View>
          </ScrollView>
        ) : (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.contadorRow}>
              <Text style={styles.contadorLabel}>
                {totalItens} {t(totalItens === 1 ? 'cart.item_singular' : 'cart.item_plural')}
              </Text>
              <View style={styles.contadorDot} />
              <Text style={styles.contadorSub}>{t('cart.ready')}</Text>
            </View>

            <View style={styles.lista}>
              {linhasComItem.map(({ item, quantidade }) => (
                <LinhaItem
                  key={item.id}
                  item={item}
                  quantidade={quantidade}
                  onAdicionar={() => addItem(item.id)}
                  onRemover={() => removeItem(item.id)}
                  onRemoverTodos={() => setQuantidade(item.id, 0)}
                  styles={styles}
                  colors={colors}
                />
              ))}
            </View>

            <Pressable
              onPress={() => router.push('/cardapio')}
              style={({ pressed }) => [styles.adicionarMais, pressed && styles.pressedSoft]}
              accessibilityRole="button"
              accessibilityLabel={t('cta.add_more_items')}
            >
              <Ionicons name="add" size={18} color={colors.primary} />
              <Text style={styles.adicionarMaisTexto}>{t('cta.add_more_items')}</Text>
            </Pressable>

            <View style={styles.totaisCard}>
              <View style={styles.totaisLinha}>
                <Text style={styles.totaisLabel}>{t('cart.subtotal')}</Text>
                <Text style={styles.totaisValor}>R$ {totalPreco.toFixed(2)}</Text>
              </View>
              <View style={styles.totaisLinha}>
                <Text style={styles.totaisLabel}>{t('cart.pickup_fee')}</Text>
                <Text style={[styles.totaisValor, { color: colors.success }]}>{t('cart.free')}</Text>
              </View>
              <View style={styles.divisor} />
              <View style={styles.totaisLinha}>
                <Text style={styles.totalLabel}>{t('cart.total')}</Text>
                <Text style={styles.totalValor}>R$ {totalPreco.toFixed(2)}</Text>
              </View>
            </View>

            <View style={styles.avisoRetirada}>
              <View style={styles.avisoIconWrap}>
                <Ionicons name="information-circle" size={14} color={colors.primary} />
              </View>
              <Text style={styles.avisoTexto}>
                {t('cart.payment_hint')}
              </Text>
            </View>
          </ScrollView>
        )}
      </Animated.View>

      {totalItens > 0 ? (
        <View
          style={[
            styles.barraConfirmar,
            { paddingBottom: insets.bottom + spacing.md },
          ]}
        >
          <Pressable
            style={({ pressed }) => [styles.botaoConfirmar, pressed && styles.pressedSoft]}
            onPress={handleConfirmar}
            accessibilityRole="button"
            accessibilityLabel={`${t('cta.confirm_order')}: R$ ${totalPreco.toFixed(2)}`}
          >
            <View style={styles.botaoConfirmarTextos}>
              <Text style={styles.botaoConfirmarLabel}>{t('cta.confirm_order')}</Text>
              <Text style={styles.botaoConfirmarValor}>R$ {totalPreco.toFixed(2)}</Text>
            </View>
            <View style={styles.botaoConfirmarIconWrap}>
              <Ionicons name="arrow-forward" size={18} color={colors.primaryText} />
            </View>
          </Pressable>
        </View>
      ) : null}
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
    headerCenter: {
      alignItems: 'center',
      flex: 1,
    },
    headerTitulo: {
      fontFamily: fontFamily.bold,
      fontSize: fontSize.xl,
      color: c.text,
    },
    scrollContent: {
      paddingHorizontal: spacing.xl,
      paddingBottom: 160,
    },
    emptyScroll: {
      flexGrow: 1,
      justifyContent: 'center',
    },
    emptyAcao: {
      paddingHorizontal: spacing['2xl'],
      marginTop: -spacing.lg,
    },
    emptyBotao: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm + 2,
      backgroundColor: c.primary,
      paddingVertical: spacing.lg,
      borderRadius: radius.full,
      ...shadow.primary,
    },
    emptyBotaoTexto: {
      fontFamily: fontFamily.bold,
      color: c.primaryText,
      fontSize: fontSize.base,
    },
    contadorRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginBottom: spacing.lg,
      marginTop: spacing.xs,
    },
    contadorLabel: {
      fontFamily: fontFamily.bold,
      fontSize: fontSize.base,
      color: c.text,
    },
    contadorDot: {
      width: 3,
      height: 3,
      borderRadius: 2,
      backgroundColor: c.textSubtle,
    },
    contadorSub: {
      fontFamily: fontFamily.medium,
      fontSize: fontSize.md,
      color: c.textMuted,
    },
    lista: {
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
    linha: {
      flexDirection: 'row',
      backgroundColor: c.surface,
      borderRadius: radius.lg,
      padding: spacing.md,
      gap: spacing.md,
      borderWidth: 1,
      borderColor: c.border,
    },
    linhaInfo: {
      flex: 1,
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    linhaTopo: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: spacing.sm,
    },
    linhaNomeWrap: {
      flex: 1,
    },
    linhaNome: {
      fontFamily: fontFamily.semibold,
      fontSize: fontSize.base,
      color: c.text,
    },
    linhaPrecoUnit: {
      fontFamily: fontFamily.medium,
      fontSize: fontSize.md,
      color: c.textSubtle,
      marginTop: 2,
    },
    removeButton: {
      width: 24,
      height: 24,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.surfaceElevated,
    },
    linhaControles: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    qtyGroup: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: c.bg,
      paddingHorizontal: spacing.xs,
      paddingVertical: 2,
      borderRadius: radius.full,
      borderWidth: 1,
      borderColor: c.border,
    },
    qtyBotao: {
      width: 26,
      height: 26,
      borderRadius: 13,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'transparent',
    },
    qtyBotaoPrimary: {
      backgroundColor: c.primary,
    },
    qtyValor: {
      fontFamily: fontFamily.bold,
      fontSize: fontSize.md,
      color: c.text,
      minWidth: 14,
      textAlign: 'center',
    },
    linhaSubtotal: {
      fontFamily: fontFamily.bold,
      fontSize: fontSize.lg,
      color: c.text,
    },
    adicionarMais: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.md + 2,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: c.border,
      borderStyle: 'dashed',
      marginBottom: spacing.lg,
      backgroundColor: c.primarySoft,
    },
    adicionarMaisTexto: {
      fontFamily: fontFamily.semibold,
      fontSize: fontSize.base,
      color: c.primary,
    },
    totaisCard: {
      backgroundColor: c.surface,
      borderRadius: radius.xl,
      padding: spacing.xl,
      borderWidth: 1,
      borderColor: c.border,
      marginBottom: spacing.md,
      gap: spacing.sm,
    },
    totaisLinha: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    totaisLabel: {
      fontFamily: fontFamily.medium,
      fontSize: fontSize.base,
      color: c.textMuted,
    },
    totaisValor: {
      fontFamily: fontFamily.semibold,
      fontSize: fontSize.base,
      color: c.text,
    },
    divisor: {
      height: 1,
      backgroundColor: c.separator,
      marginVertical: spacing.sm,
    },
    totalLabel: {
      fontFamily: fontFamily.bold,
      fontSize: fontSize.lg,
      color: c.text,
    },
    totalValor: {
      fontFamily: fontFamily.extrabold,
      fontSize: fontSize['2xl'],
      color: c.text,
    },
    avisoRetirada: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      backgroundColor: c.primarySoft,
      borderRadius: radius.lg,
      padding: spacing.md,
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
    barraConfirmar: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: c.bg,
      borderTopWidth: 1,
      borderTopColor: c.border,
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.md,
    },
    botaoConfirmar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: c.primary,
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.md,
      borderRadius: radius.full,
      ...shadow.primary,
    },
    botaoConfirmarTextos: {
      flex: 1,
    },
    botaoConfirmarLabel: {
      fontFamily: fontFamily.medium,
      fontSize: fontSize.md,
      color: 'rgba(255,255,255,0.8)',
    },
    botaoConfirmarValor: {
      fontFamily: fontFamily.bold,
      fontSize: fontSize.xl,
      color: c.primaryText,
      marginTop: 1,
    },
    botaoConfirmarIconWrap: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(255,255,255,0.18)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    pressed: {
      opacity: 0.6,
    },
    pressedSoft: {
      opacity: 0.85,
      transform: [{ scale: 0.98 }],
    },
  });
