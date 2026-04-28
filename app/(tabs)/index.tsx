import { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import FiapLogo from '@/components/FiapLogo';
import CARDAPIO from '@/data/cardapio';
import { useTheme } from '@/context/ThemeContext';
import { useFadeIn } from '@/hooks/useFadeIn';
import { fontFamily, fontSize, letterSpacing, radius, spacing } from '@/constants/theme';
import type { ThemeColors } from '@/types';

const DESTAQUES = CARDAPIO.filter((item) => [1, 5, 6, 8].includes(item.id));

export default function Home() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { opacity, translateY } = useFadeIn(500);

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={[
            styles.header,
            { paddingTop: insets.top + spacing.xl, opacity, transform: [{ translateY }] },
          ]}
        >
          <FiapLogo width={100} color={colors.primary} />
          <Text style={styles.titulo}>CANTINA</Text>
          <Text style={styles.subtitulo}>SEU PEDIDO SEM FILA</Text>
        </Animated.View>

        <Animated.View style={[styles.heroCard, { opacity }]}>
          <Text style={styles.heroEmoji}>{'🍔'}</Text>
          <Text style={styles.heroTitulo}>FAÇA SEU PEDIDO</Text>
          <Text style={styles.heroDescricao}>
            Escolha seus itens, confirme e retire no balcão com sua senha.
          </Text>
          <TouchableOpacity
            style={styles.heroBotao}
            onPress={() => router.push('/cardapio')}
            activeOpacity={0.85}
          >
            <Text style={styles.heroBotaoTexto}>VER CARDÁPIO</Text>
          </TouchableOpacity>
        </Animated.View>

        <Text style={styles.secaoTitulo}>COMO FUNCIONA</Text>
        <View style={styles.passosContainer}>
          {[
            { num: '01', txt: 'ESCOLHA\nSEUS ITENS' },
            { num: '02', txt: 'CONFIRME\nO PEDIDO' },
            { num: '03', txt: 'RETIRE NO\nBALCÃO' },
          ].map((p) => (
            <View key={p.num} style={styles.passo}>
              <Text style={styles.passoNumero}>{p.num}</Text>
              <Text style={styles.passoTexto}>{p.txt}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.secaoTitulo}>DESTAQUES</Text>
        <View style={styles.destaquesGrid}>
          {DESTAQUES.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.destaqueCard}
              onPress={() => router.push('/cardapio')}
              activeOpacity={0.85}
            >
              <Text style={styles.destaqueEmoji}>{item.emoji}</Text>
              <Text style={styles.destaqueNome}>{item.nome.toUpperCase()}</Text>
              <Text style={styles.destaquePreco}>R$ {item.preco.toFixed(2)}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: c.bg },
    scrollContent: { paddingBottom: spacing['4xl'] },
    header: {
      alignItems: 'center',
      paddingBottom: spacing['4xl'],
      gap: spacing.sm,
    },
    titulo: {
      fontFamily: fontFamily.extrabold,
      fontSize: fontSize['4xl'],
      color: c.text,
      letterSpacing: 8,
      marginTop: spacing.lg,
    },
    subtitulo: {
      fontFamily: fontFamily.medium,
      fontSize: fontSize.sm,
      color: c.textSubtle,
      letterSpacing: letterSpacing.widest,
    },
    heroCard: {
      backgroundColor: c.card,
      marginHorizontal: spacing.xl,
      borderRadius: radius.xl,
      padding: spacing['3xl'],
      alignItems: 'center',
      marginBottom: spacing['4xl'],
      borderWidth: 1,
      borderColor: c.border,
    },
    heroEmoji: { fontSize: 48, marginBottom: spacing.lg },
    heroTitulo: {
      fontFamily: fontFamily.extrabold,
      fontSize: fontSize.xl + 2,
      color: c.text,
      letterSpacing: letterSpacing.wider,
      marginBottom: spacing.sm,
    },
    heroDescricao: {
      fontFamily: fontFamily.regular,
      fontSize: fontSize.base,
      color: c.textMuted,
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: spacing['2xl'],
    },
    heroBotao: {
      backgroundColor: c.primary,
      paddingHorizontal: spacing['3xl'],
      paddingVertical: spacing.md + 2,
      borderRadius: radius.full,
    },
    heroBotaoTexto: {
      fontFamily: fontFamily.bold,
      color: c.primaryText,
      fontSize: fontSize.md,
      letterSpacing: letterSpacing.wide,
    },
    secaoTitulo: {
      fontFamily: fontFamily.extrabold,
      fontSize: fontSize.md,
      color: c.textSubtle,
      letterSpacing: letterSpacing.widest,
      marginBottom: spacing.lg,
      paddingHorizontal: spacing.xl,
    },
    passosContainer: {
      flexDirection: 'row',
      paddingHorizontal: spacing.xl,
      gap: spacing.sm + 2,
      marginBottom: spacing['4xl'],
    },
    passo: {
      flex: 1,
      backgroundColor: c.card,
      borderRadius: radius.lg,
      padding: spacing.lg,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: c.border,
    },
    passoNumero: {
      fontFamily: fontFamily.extrabold,
      fontSize: 24,
      color: c.primary,
      marginBottom: spacing.sm,
    },
    passoTexto: {
      fontFamily: fontFamily.semibold,
      fontSize: fontSize.xs,
      color: c.textMuted,
      textAlign: 'center',
      letterSpacing: letterSpacing.normal,
      lineHeight: 16,
    },
    destaquesGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      paddingHorizontal: spacing.xl,
      gap: spacing.sm + 2,
    },
    destaqueCard: {
      width: '48%',
      backgroundColor: c.card,
      borderRadius: radius.lg,
      padding: spacing.xl,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: c.border,
    },
    destaqueEmoji: { fontSize: 36, marginBottom: spacing.md - 2 },
    destaqueNome: {
      fontFamily: fontFamily.bold,
      fontSize: fontSize.sm,
      color: c.text,
      textAlign: 'center',
      letterSpacing: letterSpacing.normal,
    },
    destaquePreco: {
      fontFamily: fontFamily.bold,
      fontSize: fontSize.base,
      color: c.primary,
      marginTop: spacing.xs + 2,
    },
  });
