import { useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';

import CARDAPIO from '@/data/cardapio';
import ItemCardapio from '@/components/ItemCardapio';
import EmptyState from '@/components/EmptyState';
import { useTheme } from '@/context/ThemeContext';
import { fontFamily, fontSize, letterSpacing, radius, spacing } from '@/constants/theme';
import type { Categoria, ThemeColors } from '@/types';

type Quantidades = Record<number, number>;

export default function Cardapio() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [quantidades, setQuantidades] = useState<Quantidades>({});

  const adicionarItem = (id: number) => {
    setQuantidades((prev) => ({
      ...prev,
      [id]: (prev[id] ?? 0) + 1,
    }));
  };

  const removerItem = (id: number) => {
    setQuantidades((prev) => {
      const novaQtd = (prev[id] ?? 0) - 1;
      if (novaQtd <= 0) {
        const novo = { ...prev };
        delete novo[id];
        return novo;
      }
      return { ...prev, [id]: novaQtd };
    });
  };

  const totalItens = Object.values(quantidades).reduce<number>((acc, qty) => acc + qty, 0);

  const totalPreco = Object.entries(quantidades).reduce<number>((acc, [id, qty]) => {
    const item = CARDAPIO.find((i) => i.id === Number(id));
    return acc + (item?.preco ?? 0) * qty;
  }, 0);

  const categorias: Categoria[] = Array.from(
    new Set(CARDAPIO.map((item) => item.categoria)),
  );

  const confirmarPedido = () => {
    if (totalItens === 0) return;

    const itensResumo = Object.entries(quantidades)
      .map(([id, qty]) => {
        const item = CARDAPIO.find((i) => i.id === Number(id));
        return `${qty}x ${item?.nome ?? ''}`;
      })
      .join(', ');

    router.push({
      pathname: '/confirmacao',
      params: {
        total: totalPreco.toFixed(2),
        itens: String(totalItens),
        resumo: itensResumo,
      },
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.titulo}>CARDÁPIO</Text>
        <Text style={styles.subtitulo}>ESCOLHA SEUS ITENS</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {categorias.map((categoria) => (
          <View key={categoria} style={styles.categoriaSection}>
            <Text style={styles.categoriaTitulo}>{categoria.toUpperCase()}</Text>
            {CARDAPIO.filter((item) => item.categoria === categoria).map((item) => (
              <ItemCardapio
                key={item.id}
                item={item}
                quantidade={quantidades[item.id] ?? 0}
                onAdicionar={adicionarItem}
                onRemover={removerItem}
              />
            ))}
          </View>
        ))}

        {totalItens === 0 ? (
          <EmptyState
            emoji={'👇'}
            title="Toque no + para adicionar itens"
            subtitle="Monte seu pedido para liberar a confirmação"
          />
        ) : null}

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
      paddingBottom: spacing.xl,
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
