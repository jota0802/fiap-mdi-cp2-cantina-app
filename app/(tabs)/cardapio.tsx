import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import CARDAPIO from '@/data/cardapio';
import EmptyState from '@/components/EmptyState';
import Input from '@/components/Input';
import ItemCardapio from '@/components/ItemCardapio';
import { useCart } from '@/context/CartContext';
import { useTheme } from '@/context/ThemeContext';
import { haptic } from '@/lib/haptics';
import { fontFamily, fontSize, letterSpacing, radius, spacing } from '@/constants/theme';
import type { Categoria, ThemeColors } from '@/types';

export default function Cardapio() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const {
    addItem,
    removeItem,
    getQuantidade,
    totalItens,
    totalPreco,
    buildResumo,
  } = useCart();

  const [busca, setBusca] = useState('');

  const itensFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return CARDAPIO;
    return CARDAPIO.filter(
      (i) =>
        i.nome.toLowerCase().includes(termo) ||
        i.descricao.toLowerCase().includes(termo) ||
        i.categoria.toLowerCase().includes(termo),
    );
  }, [busca]);

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

  const confirmarPedido = () => {
    if (totalItens === 0) return;
    haptic.success();
    router.push({
      pathname: '/confirmacao',
      params: {
        total: totalPreco.toFixed(2),
        itens: String(totalItens),
        resumo: buildResumo(),
      },
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.tituloRow}>
          <View style={styles.tituloCol}>
            <Text style={styles.titulo}>CARDÁPIO</Text>
            <Text style={styles.subtitulo}>ESCOLHA SEUS ITENS</Text>
          </View>

          {totalItens > 0 ? (
            <Animated.View
              style={[styles.badge, { transform: [{ scale: badgeScale }] }]}
            >
              <Ionicons name="cart" size={16} color={colors.primaryText} />
              <Text style={styles.badgeText}>{totalItens}</Text>
            </Animated.View>
          ) : null}
        </View>

        <View style={styles.searchWrapper}>
          <Input
            placeholder="Buscar item, descrição ou categoria..."
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
            subtitle={`Nenhum item corresponde a "${busca.trim()}"`}
          />
        ) : (
          <>
            {categoriasVisiveis.map((categoria) => (
              <View key={categoria} style={styles.categoriaSection}>
                <Text style={styles.categoriaTitulo}>{categoria.toUpperCase()}</Text>
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
                title="Toque no + para adicionar itens"
                subtitle="Monte seu pedido para liberar a confirmação"
              />
            ) : null}
          </>
        )}

        <View style={styles.espacoFinal} />
      </ScrollView>

      {totalItens > 0 ? (
        <View style={styles.barraInferior}>
          <View style={styles.resumo}>
            <Text style={styles.resumoItens}>
              {totalItens} {totalItens === 1 ? 'ITEM' : 'ITENS'}
            </Text>
            <Text style={styles.resumoTotal}>R$ {totalPreco.toFixed(2)}</Text>
          </View>
          <TouchableOpacity
            style={styles.botaoConfirmar}
            onPress={confirmarPedido}
            activeOpacity={0.85}
          >
            <Text style={styles.botaoConfirmarTexto}>CONFIRMAR</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
}

const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: c.bg },
    header: {
      paddingTop: 60,
      paddingHorizontal: spacing.xl,
      paddingBottom: spacing.md,
    },
    tituloRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.lg,
    },
    tituloCol: { flex: 1 },
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
    badge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs + 2,
      backgroundColor: c.primary,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.full,
    },
    badgeText: {
      fontFamily: fontFamily.bold,
      fontSize: fontSize.md,
      color: c.primaryText,
      letterSpacing: letterSpacing.normal,
    },
    searchWrapper: { marginTop: 0 },
    scrollContent: {
      paddingHorizontal: spacing.xl,
      paddingBottom: spacing.xl,
    },
    categoriaSection: { marginBottom: spacing.md },
    categoriaTitulo: {
      fontFamily: fontFamily.extrabold,
      fontSize: fontSize.sm,
      color: c.primary,
      letterSpacing: letterSpacing.wider,
      marginBottom: spacing.md,
      marginTop: spacing.sm,
    },
    espacoFinal: { height: 100 },
    barraInferior: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: c.card,
      borderTopWidth: 1,
      borderTopColor: c.border,
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.lg,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    resumo: { flex: 1 },
    resumoItens: {
      fontFamily: fontFamily.semibold,
      fontSize: fontSize.xs,
      color: c.textSubtle,
      letterSpacing: letterSpacing.wide,
    },
    resumoTotal: {
      fontFamily: fontFamily.extrabold,
      fontSize: fontSize['2xl'],
      color: c.text,
      marginTop: 2,
    },
    botaoConfirmar: {
      backgroundColor: c.primary,
      paddingHorizontal: spacing['2xl'] + 4,
      paddingVertical: spacing.md + 2,
      borderRadius: radius.full,
    },
    botaoConfirmarTexto: {
      fontFamily: fontFamily.bold,
      color: c.primaryText,
      fontSize: fontSize.md,
      letterSpacing: letterSpacing.wide,
    },
  });
