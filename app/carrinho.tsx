import { useMemo } from 'react';
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import EmptyState from '@/components/EmptyState';
import { useCart } from '@/context/CartContext';
import { useTheme } from '@/context/ThemeContext';
import CARDAPIO from '@/data/cardapio';
import { useFadeIn } from '@/hooks/useFadeIn';
import { haptic } from '@/lib/haptics';
import { fontFamily, fontSize, letterSpacing, radius, spacing } from '@/constants/theme';
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
      <View style={styles.emojiBox}>
        <Text style={styles.emoji}>{item.emoji}</Text>
      </View>

      <View style={styles.linhaInfo}>
        <View style={styles.linhaTopo}>
          <Text style={styles.linhaNome} numberOfLines={1}>
            {item.nome.toUpperCase()}
          </Text>
          <Pressable
            onPress={() => {
              haptic.warning();
              onRemoverTodos();
            }}
            hitSlop={10}
          >
            <Ionicons name="close" size={18} color={colors.textSubtle} />
          </Pressable>
        </View>

        <Text style={styles.linhaPrecoUnit}>R$ {item.preco.toFixed(2)} cada</Text>

        <View style={styles.linhaControles}>
          <View style={styles.qtyGroup}>
            <Pressable
              style={({ pressed }) => [styles.qtyBotao, pressed && styles.pressed]}
              onPress={() => {
                haptic.light();
                onRemover();
              }}
              hitSlop={6}
            >
              <Ionicons name="remove" size={16} color={colors.text} />
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
            >
              <Ionicons name="add" size={16} color={colors.primaryText} />
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
      <View style={[styles.headerNav, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable
          onPress={handleVoltar}
          hitSlop={12}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
        >
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitulo}>SEU CARRINHO</Text>
        {items.length > 0 ? (
          <Pressable onPress={handleLimpar} hitSlop={12}>
            <Text style={styles.limparTexto}>LIMPAR</Text>
          </Pressable>
        ) : (
          <View style={styles.headerSpacer} />
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
              title="Seu carrinho está vazio"
              subtitle="Volte para o cardápio e monte seu pedido"
            />
            <View style={styles.emptyAcao}>
              <TouchableOpacity
                style={styles.emptyBotao}
                onPress={() => router.replace('/cardapio')}
                activeOpacity={0.85}
              >
                <Ionicons name="restaurant-outline" size={18} color={colors.primaryText} />
                <Text style={styles.emptyBotaoTexto}>IR PARA O CARDÁPIO</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        ) : (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.contadorLabel}>
              {totalItens} {totalItens === 1 ? 'ITEM' : 'ITENS'}
            </Text>

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
              style={({ pressed }) => [styles.adicionarMais, pressed && styles.pressed]}
            >
              <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
              <Text style={styles.adicionarMaisTexto}>ADICIONAR MAIS ITENS</Text>
            </Pressable>

            <View style={styles.totaisCard}>
              <View style={styles.totaisLinha}>
                <Text style={styles.totaisLabel}>SUBTOTAL</Text>
                <Text style={styles.totaisValor}>R$ {totalPreco.toFixed(2)}</Text>
              </View>
              <View style={styles.totaisLinha}>
                <Text style={styles.totaisLabel}>TAXA</Text>
                <Text style={[styles.totaisValor, { color: colors.success }]}>GRÁTIS</Text>
              </View>
              <View style={styles.divisor} />
              <View style={styles.totaisLinha}>
                <Text style={styles.totalLabel}>TOTAL</Text>
                <Text style={styles.totalValor}>R$ {totalPreco.toFixed(2)}</Text>
              </View>
            </View>

            <View style={styles.avisoRetirada}>
              <Ionicons name="information-circle-outline" size={16} color={colors.primary} />
              <Text style={styles.avisoTexto}>
                Pagamento direto no balcão. Você receberá uma senha de retirada.
              </Text>
            </View>
          </ScrollView>
        )}
      </Animated.View>

      {totalItens > 0 ? (
        <View
          style={[
            styles.barraConfirmar,
            { paddingBottom: insets.bottom + spacing.lg },
          ]}
        >
          <TouchableOpacity
            style={styles.botaoConfirmar}
            onPress={handleConfirmar}
            activeOpacity={0.85}
          >
            <View>
              <Text style={styles.botaoConfirmarLabel}>CONFIRMAR PEDIDO</Text>
              <Text style={styles.botaoConfirmarValor}>R$ {totalPreco.toFixed(2)}</Text>
            </View>
            <Ionicons name="arrow-forward" size={22} color={colors.primaryText} />
          </TouchableOpacity>
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
      paddingBottom: spacing.md,
      paddingHorizontal: spacing.xl,
    },
    backButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.card,
      borderWidth: 1,
      borderColor: c.border,
    },
    headerTitulo: {
      fontFamily: fontFamily.extrabold,
      fontSize: fontSize.md,
      color: c.text,
      letterSpacing: letterSpacing.widest,
    },
    headerSpacer: { width: 36 },
    limparTexto: {
      fontFamily: fontFamily.bold,
      fontSize: fontSize.xs,
      color: c.error,
      letterSpacing: letterSpacing.wide,
    },
    scrollContent: {
      paddingHorizontal: spacing.xl,
      paddingBottom: 140,
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
    },
    emptyBotaoTexto: {
      fontFamily: fontFamily.bold,
      color: c.primaryText,
      fontSize: fontSize.md,
      letterSpacing: letterSpacing.wide,
    },
    contadorLabel: {
      fontFamily: fontFamily.semibold,
      fontSize: fontSize.xs,
      color: c.textSubtle,
      letterSpacing: letterSpacing.wider,
      marginBottom: spacing.md,
      marginTop: spacing.sm,
    },
    lista: {
      gap: spacing.sm,
      marginBottom: spacing.lg,
    },
    linha: {
      flexDirection: 'row',
      backgroundColor: c.card,
      borderRadius: radius.lg,
      padding: spacing.md + 2,
      gap: spacing.md,
      borderWidth: 1,
      borderColor: c.border,
    },
    emojiBox: {
      width: 56,
      height: 56,
      borderRadius: radius.md,
      backgroundColor: c.cardElevated,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emoji: { fontSize: 28 },
    linhaInfo: {
      flex: 1,
      justifyContent: 'space-between',
    },
    linhaTopo: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    linhaNome: {
      flex: 1,
      fontFamily: fontFamily.bold,
      fontSize: fontSize.md,
      color: c.text,
      letterSpacing: letterSpacing.normal,
      marginRight: spacing.sm,
    },
    linhaPrecoUnit: {
      fontFamily: fontFamily.regular,
      fontSize: fontSize.sm,
      color: c.textSubtle,
      marginTop: 2,
    },
    linhaControles: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: spacing.sm,
    },
    qtyGroup: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm + 2,
      backgroundColor: c.cardElevated,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
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
      fontSize: fontSize.base,
      color: c.text,
      minWidth: 18,
      textAlign: 'center',
    },
    linhaSubtotal: {
      fontFamily: fontFamily.extrabold,
      fontSize: fontSize.lg,
      color: c.primary,
    },
    adicionarMais: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm + 2,
      paddingVertical: spacing.lg,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: c.border,
      borderStyle: 'dashed',
      marginBottom: spacing.lg,
    },
    adicionarMaisTexto: {
      fontFamily: fontFamily.bold,
      fontSize: fontSize.md,
      color: c.primary,
      letterSpacing: letterSpacing.wide,
    },
    totaisCard: {
      backgroundColor: c.card,
      borderRadius: radius.lg,
      padding: spacing.xl,
      borderWidth: 1,
      borderColor: c.border,
      marginBottom: spacing.lg,
    },
    totaisLinha: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.sm + 2,
    },
    totaisLabel: {
      fontFamily: fontFamily.semibold,
      fontSize: fontSize.sm,
      color: c.textSubtle,
      letterSpacing: letterSpacing.wide,
    },
    totaisValor: {
      fontFamily: fontFamily.bold,
      fontSize: fontSize.base,
      color: c.text,
    },
    divisor: {
      height: 1,
      backgroundColor: c.border,
      marginVertical: spacing.sm,
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
    avisoRetirada: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm + 2,
      backgroundColor: c.card,
      borderRadius: radius.md,
      padding: spacing.md + 2,
      borderLeftWidth: 3,
      borderLeftColor: c.primary,
      borderWidth: 1,
      borderColor: c.border,
    },
    avisoTexto: {
      flex: 1,
      fontFamily: fontFamily.medium,
      fontSize: fontSize.sm,
      color: c.textMuted,
      lineHeight: 18,
    },
    barraConfirmar: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: c.card,
      borderTopWidth: 1,
      borderTopColor: c.border,
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.lg,
    },
    botaoConfirmar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: c.primary,
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.lg,
      borderRadius: radius.full,
    },
    botaoConfirmarLabel: {
      fontFamily: fontFamily.bold,
      fontSize: fontSize.xs,
      color: 'rgba(255,255,255,0.7)',
      letterSpacing: letterSpacing.widest,
    },
    botaoConfirmarValor: {
      fontFamily: fontFamily.extrabold,
      fontSize: fontSize.xl,
      color: c.primaryText,
      marginTop: 2,
    },
    pressed: {
      opacity: 0.6,
    },
  });
