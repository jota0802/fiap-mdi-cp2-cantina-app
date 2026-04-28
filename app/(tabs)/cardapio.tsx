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
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import CARDAPIO from '@/data/cardapio';
import EmptyState from '@/components/EmptyState';
import Input from '@/components/Input';
import ItemCardapio from '@/components/ItemCardapio';
import { useCart } from '@/context/CartContext';
import { useTheme } from '@/context/ThemeContext';
import { haptic } from '@/lib/haptics';
import {
  fontFamily,
  fontSize,
  letterSpacing,
  radius,
  shadow,
  spacing,
} from '@/constants/theme';
import type { Categoria, ThemeColors } from '@/types';

const CATEGORIAS_ORDEM: ('Todas' | Categoria)[] = [
  'Todas',
  'Bebidas',
  'Lanches',
  'Sobremesas',
];

const CATEGORIA_ICONE: Record<Categoria | 'Todas', keyof typeof Ionicons.glyphMap> = {
  Todas: 'apps-outline',
  Bebidas: 'cafe-outline',
  Lanches: 'fast-food-outline',
  Sobremesas: 'ice-cream-outline',
};

export default function Cardapio() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const {
    addItem,
    removeItem,
    getQuantidade,
    totalItens,
    totalPreco,
  } = useCart();

  const [busca, setBusca] = useState('');
  const [categoriaAtiva, setCategoriaAtiva] = useState<'Todas' | Categoria>('Todas');

  const itensFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return CARDAPIO.filter((i) => {
      if (categoriaAtiva !== 'Todas' && i.categoria !== categoriaAtiva) return false;
      if (!termo) return true;
      return (
        i.nome.toLowerCase().includes(termo) ||
        i.descricao.toLowerCase().includes(termo) ||
        i.categoria.toLowerCase().includes(termo)
      );
    });
  }, [busca, categoriaAtiva]);

  const categoriasVisiveis: Categoria[] = useMemo(
    () => Array.from(new Set(itensFiltrados.map((i) => i.categoria))),
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

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <View style={styles.tituloRow}>
          <View style={styles.tituloCol}>
            <Text style={styles.eyebrow}>O QUE VAMOS PEDIR HOJE</Text>
            <Text style={styles.titulo}>Cardápio</Text>
          </View>

          {totalItens > 0 ? (
            <Animated.View style={{ transform: [{ scale: badgeScale }] }}>
              <Pressable
                onPress={irParaCarrinho}
                style={({ pressed }) => [styles.badge, pressed && styles.pressedSoft]}
                hitSlop={8}
              >
                <Ionicons name="bag-handle" size={14} color={colors.primaryText} />
                <Text style={styles.badgeText}>{totalItens}</Text>
              </Pressable>
            </Animated.View>
          ) : null}
        </View>

        <View style={styles.searchWrapper}>
          <Input
            placeholder="Buscar item, descrição ou categoria"
            icon="search-outline"
            value={busca}
            onChangeText={setBusca}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            rightSlot={
              busca.length > 0 ? (
                <Pressable onPress={() => setBusca('')} hitSlop={12}>
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
              >
                <Ionicons
                  name={CATEGORIA_ICONE[cat]}
                  size={14}
                  color={ativo ? colors.primaryText : colors.textMuted}
                />
                <Text style={[styles.chipTexto, ativo && styles.chipTextoAtivo]}>
                  {cat}
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
        {itensFiltrados.length === 0 ? (
          <EmptyState
            emoji="🔎"
            title="Nada encontrado"
            subtitle={
              busca.trim()
                ? `Nenhum item corresponde a "${busca.trim()}"`
                : 'Nenhum item nessa categoria por enquanto'
            }
          />
        ) : (
          <>
            {categoriasVisiveis.map((categoria) => (
              <View key={categoria} style={styles.categoriaSection}>
                <View style={styles.categoriaHeader}>
                  <Text style={styles.categoriaTitulo}>{categoria}</Text>
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

            {totalItens === 0 ? (
              <EmptyState
                emoji="👇"
                title="Toque no + para adicionar"
                subtitle="Monte seu pedido para liberar a revisão"
              />
            ) : null}
          </>
        )}

        <View style={styles.espacoFinal} />
      </ScrollView>

      {totalItens > 0 ? (
        <View style={[styles.barraInferior, { paddingBottom: insets.bottom + spacing.md }]}>
          <View style={styles.resumo}>
            <Text style={styles.resumoItens}>
              {totalItens} {totalItens === 1 ? 'item selecionado' : 'itens selecionados'}
            </Text>
            <Text style={styles.resumoTotal}>R$ {totalPreco.toFixed(2)}</Text>
          </View>
          <Pressable
            style={({ pressed }) => [styles.botaoConfirmar, pressed && styles.pressedSoft]}
            onPress={irParaCarrinho}
          >
            <Text style={styles.botaoConfirmarTexto}>Revisar pedido</Text>
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
    eyebrow: {
      fontFamily: fontFamily.semibold,
      fontSize: fontSize.xs,
      color: c.textSubtle,
      letterSpacing: letterSpacing.widest,
    },
    titulo: {
      fontFamily: fontFamily.extrabold,
      fontSize: fontSize['3xl'],
      color: c.text,
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
    espacoFinal: { height: 120 },
    barraInferior: {
      position: 'absolute',
      bottom: 0,
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
  });
