import { Ionicons } from '@expo/vector-icons';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
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
import Input from '@/components/Input';
import ItemCardapio from '@/components/ItemCardapio';
import {
  fontFamily,
  fontSize,
  letterSpacing,
  radius,
  shadow,
  spacing,
} from '@/constants/theme';
import { useCart } from '@/context/CartContext';
import { useLocale } from '@/context/LocaleContext';
import { useTheme } from '@/context/ThemeContext';
import { haptic } from '@/lib/haptics';
import { useItems } from '@/lib/api/hooks/use-items';
import type { ThemeColors } from '@/types';
import type { Categoria } from '@cantina/shared';

// Categorias da API sao lowercase. 'todas' e apenas estado local do filtro.
type CategoriaFiltro = 'todas' | Categoria;

const CATEGORIAS_ORDEM: CategoriaFiltro[] = [
  'todas',
  'bebidas',
  'lanches',
  'sobremesas',
];

const CATEGORIA_ICONE: Record<CategoriaFiltro, keyof typeof Ionicons.glyphMap> = {
  todas: 'apps-outline',
  bebidas: 'cafe-outline',
  lanches: 'fast-food-outline',
  sobremesas: 'ice-cream-outline',
};

/** Exibe categoria com inicial maiuscula para o usuario (PT). */
function displayCategoria(cat: CategoriaFiltro, t: (key: string) => string): string {
  if (cat === 'todas') return t('cardapio.all');
  // Usa chave i18n existente com a inicial maiuscula se disponivel
  const chave = `category.${cat.charAt(0).toUpperCase()}${cat.slice(1)}`;
  return t(chave);
}

export default function Cardapio() {
  const router = useRouter();
  const { colors } = useTheme();
  const { t } = useLocale();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const {
    addItem,
    removeItem,
    getQuantidade,
    totalItens,
    totalPreco,
  } = useCart();

  const [busca, setBusca] = useState('');
  const [categoriaAtiva, setCategoriaAtiva] = useState<CategoriaFiltro>('todas');

  // Carrega itens da API; quando categoriaAtiva !== 'todas', filtra no servidor
  const apiCategoria: Categoria | undefined =
    categoriaAtiva === 'todas' ? undefined : categoriaAtiva;
  const { data, isPending, isError, refetch } = useItems(
    apiCategoria ? { categoria: apiCategoria } : undefined,
  );
  const todosItens = data?.items ?? [];

  const itensFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return todosItens;
    return todosItens.filter((i) => {
      const nomeT = i.nameKey ? t(i.nameKey) : i.name;
      const descT = i.descricaoKey ? t(i.descricaoKey) : i.descricao;
      const catT = displayCategoria(i.categoria as CategoriaFiltro, t);
      return (
        i.name.toLowerCase().includes(termo) ||
        nomeT.toLowerCase().includes(termo) ||
        i.descricao.toLowerCase().includes(termo) ||
        descT.toLowerCase().includes(termo) ||
        i.categoria.toLowerCase().includes(termo) ||
        catT.toLowerCase().includes(termo)
      );
    });
  }, [busca, todosItens, t]);

  const categoriasVisiveis = useMemo(
    () => Array.from(new Set(itensFiltrados.map((i) => i.categoria))) as Categoria[],
    [itensFiltrados],
  );

  // Badge do carrinho com pulse quando o total muda
  const badgeScale = useRef(new Animated.Value(1)).current;
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    Animated.sequence([
      Animated.timing(badgeScale, { toValue: 1.4, duration: 120, useNativeDriver: true }),
      Animated.spring(badgeScale, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 12 }),
    ]).start();
  }, [totalItens, badgeScale]);

  const irParaCarrinho = () => {
    if (totalItens === 0) return;
    haptic.light();
    router.push('/carrinho');
  };

  const contadorLabel =
    isPending
      ? t('loading.items') || '…'
      : `${itensFiltrados.length} ${t(itensFiltrados.length === 1 ? 'cart.item_singular' : 'cart.item_plural')}${categoriaAtiva !== 'todas' ? ` · ${displayCategoria(categoriaAtiva, t)}` : ''}`;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.lg }]}>
        <View style={styles.tituloRow}>
          <View style={styles.tituloCol}>
            <Text style={styles.titulo}>{t('tab.menu')}</Text>
            <Text style={styles.subtitulo}>{contadorLabel}</Text>
          </View>

          {totalItens > 0 ? (
            <Animated.View style={{ transform: [{ scale: badgeScale }] }}>
              <Pressable
                onPress={irParaCarrinho}
                style={({ pressed }) => [styles.badge, pressed && styles.pressedSoft]}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={`${t('home.cart')}: ${totalItens}`}
              >
                <Ionicons name="bag-handle" size={14} color={colors.primaryText} />
                <Text style={styles.badgeText}>{totalItens}</Text>
              </Pressable>
            </Animated.View>
          ) : null}
        </View>

        <View style={styles.searchWrapper}>
          <Input
            placeholder={t('cardapio.search_placeholder')}
            icon="search-outline"
            value={busca}
            onChangeText={setBusca}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            rightSlot={
              busca.length > 0 ? (
                <Pressable
                  onPress={() => setBusca('')}
                  hitSlop={12}
                  accessibilityRole="button"
                  accessibilityLabel={t('cta.cancel')}
                >
                  <Ionicons
                    name="close-circle"
                    size={18}
                    color={colors.textSubtle}
                  />
                </Pressable>
              ) : null
            }
          />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
        >
          {CATEGORIAS_ORDEM.map((cat) => {
            const ativo = cat === categoriaAtiva;
            return (
              <Pressable
                key={cat}
                onPress={() => {
                  haptic.light();
                  setCategoriaAtiva(cat);
                }}
                style={({ pressed }) => [
                  styles.chip,
                  ativo && styles.chipAtivo,
                  pressed && styles.pressedSoft,
                ]}
                accessibilityRole="button"
                accessibilityLabel={displayCategoria(cat, t)}
                accessibilityState={{ selected: ativo }}
              >
                <Ionicons
                  name={CATEGORIA_ICONE[cat]}
                  size={14}
                  color={ativo ? colors.primaryText : colors.textMuted}
                />
                <Text style={[styles.chipTexto, ativo && styles.chipTextoAtivo]}>
                  {displayCategoria(cat, t)}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {isError ? (
          <View style={styles.errorWrap}>
            <EmptyState
              emoji="⚠️"
              title={t('empty.error_title') || 'Erro ao carregar'}
              subtitle={t('empty.error_subtitle') || 'Tente novamente'}
            />
            <Pressable
              onPress={() => refetch()}
              style={({ pressed }) => [styles.retryButton, pressed && styles.pressedSoft]}
              accessibilityRole="button"
              accessibilityLabel={t('cta.retry') || 'Tentar novamente'}
            >
              <Text style={styles.retryButtonText}>{t('cta.retry') || 'Tentar novamente'}</Text>
            </Pressable>
          </View>
        ) : itensFiltrados.length === 0 && !isPending ? (
          <EmptyState
            emoji="🔎"
            title={t('empty.search_title')}
            subtitle={
              busca.trim() ? t('empty.search_subtitle') : t('empty.category_empty')
            }
          />
        ) : (
          <>
            {categoriasVisiveis.map((categoria) => (
              <View key={categoria} style={styles.categoriaSection}>
                <View style={styles.categoriaHeader}>
                  <Text style={styles.categoriaTitulo}>
                    {displayCategoria(categoria as CategoriaFiltro, t)}
                  </Text>
                  <View style={styles.categoriaLinha} />
                </View>
                {itensFiltrados
                  .filter((item) => item.categoria === categoria)
                  .map((item) => (
                    <ItemCardapio
                      key={item.id}
                      item={item}
                      quantidade={getQuantidade(item.id)}
                      onAdicionar={addItem}
                      onRemover={removeItem}
                    />
                  ))}
              </View>
            ))}

            {!isPending && totalItens === 0 && itensFiltrados.length > 0 ? (
              <EmptyState
                emoji="👇"
                title={t('cardapio.tap_to_add_title')}
                subtitle={t('cardapio.tap_to_add_subtitle')}
              />
            ) : null}
          </>
        )}

        <View style={{ height: tabBarHeight + (totalItens > 0 ? 110 : spacing.lg) }} />
      </ScrollView>

      {totalItens > 0 ? (
        <View
          style={[
            styles.barraInferior,
            { bottom: tabBarHeight, paddingBottom: spacing.md },
          ]}
        >
          <View style={styles.resumo}>
            <Text style={styles.resumoItens}>
              {t(
                totalItens === 1
                  ? 'cardapio.items_selected_singular'
                  : 'cardapio.items_selected_plural',
                { count: totalItens },
              )}
            </Text>
            <Text style={styles.resumoTotal}>R$ {totalPreco.toFixed(2)}</Text>
          </View>
          <Pressable
            style={({ pressed }) => [styles.botaoConfirmar, pressed && styles.pressedSoft]}
            onPress={irParaCarrinho}
            accessibilityRole="button"
            accessibilityLabel={`${t('cta.review_order')}: R$ ${totalPreco.toFixed(2)}`}
          >
            <Text style={styles.botaoConfirmarTexto}>{t('cta.review_order')}</Text>
            <Ionicons name="arrow-forward" size={16} color={colors.primaryText} />
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: c.bg },
    header: {
      paddingHorizontal: spacing.xl,
      paddingBottom: spacing.md,
    },
    tituloRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      marginBottom: spacing.lg,
    },
    tituloCol: { flex: 1 },
    titulo: {
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
    badge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs + 2,
      backgroundColor: c.primary,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.full,
      ...shadow.primary,
    },
    badgeText: {
      fontFamily: fontFamily.bold,
      fontSize: fontSize.md,
      color: c.primaryText,
    },
    searchWrapper: { marginBottom: spacing.md },
    chipsRow: {
      gap: spacing.sm,
      paddingRight: spacing.lg,
    },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs + 2,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.full,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
    },
    chipAtivo: {
      backgroundColor: c.primary,
      borderColor: c.primary,
    },
    chipTexto: {
      fontFamily: fontFamily.semibold,
      fontSize: fontSize.md,
      color: c.textMuted,
    },
    chipTextoAtivo: {
      color: c.primaryText,
    },
    scrollContent: {
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.lg,
      paddingBottom: spacing.xl,
    },
    categoriaSection: { marginBottom: spacing.lg },
    categoriaHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      marginBottom: spacing.md,
    },
    categoriaTitulo: {
      fontFamily: fontFamily.bold,
      fontSize: fontSize.md,
      color: c.text,
      letterSpacing: letterSpacing.normal,
    },
    categoriaLinha: {
      flex: 1,
      height: 1,
      backgroundColor: c.separator,
    },
    barraInferior: {
      position: 'absolute',
      left: 0,
      right: 0,
      backgroundColor: c.bg,
      borderTopWidth: 1,
      borderTopColor: c.border,
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.md,
    },
    resumo: { flex: 1 },
    resumoItens: {
      fontFamily: fontFamily.medium,
      fontSize: fontSize.md,
      color: c.textMuted,
    },
    resumoTotal: {
      fontFamily: fontFamily.extrabold,
      fontSize: fontSize.xl,
      color: c.text,
      marginTop: 2,
    },
    botaoConfirmar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: c.primary,
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.md,
      borderRadius: radius.full,
      ...shadow.primary,
    },
    botaoConfirmarTexto: {
      fontFamily: fontFamily.bold,
      color: c.primaryText,
      fontSize: fontSize.base,
    },
    pressedSoft: {
      opacity: 0.85,
      transform: [{ scale: 0.98 }],
    },
    retryButton: {
      marginTop: spacing.md,
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.md,
      backgroundColor: c.primary,
      borderRadius: radius.full,
    },
    retryButtonText: {
      fontFamily: fontFamily.bold,
      color: c.primaryText,
      fontSize: fontSize.base,
    },
    errorWrap: {
      alignItems: 'center',
    },
  });
