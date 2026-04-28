import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import FiapLogo from '@/components/FiapLogo';
import { useTheme } from '@/context/ThemeContext';
import { fontFamily, fontSize, letterSpacing, radius, spacing } from '@/constants/theme';
import type { ThemeColors } from '@/types';

const INTEGRANTES = [
  { iniciais: 'LB', nome: 'LUCCA BORGES', rm: 'RM 554608' },
  { iniciais: 'RM', nome: 'RUAN MELO', rm: 'RM 557599' },
  { iniciais: 'RJ', nome: 'RODRIGO JIMENEZ', rm: 'RM 558148' },
  { iniciais: 'JV', nome: 'JOÃO VICTOR FRANCO', rm: 'RM 556790' },
] as const;

const TECNOLOGIAS = [
  'REACT NATIVE',
  'EXPO',
  'EXPO ROUTER',
  'TYPESCRIPT',
  'CONTEXT API',
  'ASYNCSTORAGE',
] as const;

export default function Sobre() {
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      <View style={[styles.headerNav, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}
        >
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </Pressable>
        <Text style={styles.headerNavTitle}>SOBRE</Text>
        <View style={styles.headerNavSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <FiapLogo width={60} color={colors.primary} />
          </View>
          <Text style={styles.appNome}>APP CANTINA</Text>
          <Text style={styles.versao}>V 2.0.0</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitulo}>SOBRE O PROJETO</Text>
          <Text style={styles.cardTexto}>
            Aplicativo mobile para pedidos na cantina da FIAP. Faça seu pedido pelo celular e receba uma
            senha para retirar no balcão, eliminando filas e tempo de espera.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitulo}>PROBLEMA</Text>
          <Text style={styles.cardTexto}>
            Filas longas na cantina durante intervalos geram perda de tempo e incerteza sobre disponibilidade
            dos itens. Alunos frequentemente desistem de comprar por falta de tempo entre aulas.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitulo}>SOLUÇÃO</Text>
          {[
            'Cardápio digital com preços atualizados',
            'Pedidos pelo app sem enfrentar fila',
            'Sistema de senha para retirada organizada',
            'Resumo do pedido com valor total',
          ].map((texto) => (
            <View key={texto} style={styles.listaItem}>
              <View style={styles.bullet} />
              <Text style={styles.listaTexto}>{texto}</Text>
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitulo}>INTEGRANTES</Text>
          {INTEGRANTES.map((p, idx) => (
            <View key={p.rm}>
              <View style={styles.integranteRow}>
                <View style={styles.integranteAvatarPlaceholder}>
                  <Text style={styles.integranteInicial}>{p.iniciais}</Text>
                </View>
                <View style={styles.integranteInfo}>
                  <Text style={styles.integranteNome}>{p.nome}</Text>
                  <Text style={styles.integranteRM}>{p.rm}</Text>
                </View>
              </View>
              {idx < INTEGRANTES.length - 1 ? <View style={styles.integranteDivisor} /> : null}
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitulo}>TECNOLOGIAS</Text>
          <View style={styles.techGrid}>
            {TECNOLOGIAS.map((t) => (
              <View key={t} style={styles.techBadge}>
                <Text style={styles.techTexto}>{t}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitulo}>DECISÕES TÉCNICAS</Text>
          {[
            'Expo Router com Tabs + Stack para navegação híbrida',
            'TypeScript strict em todo o projeto para segurança de tipos',
            'Context API para estado global (tema, autenticação, carrinho)',
            'Componentes reutilizáveis com paleta dinâmica via useTheme',
          ].map((texto) => (
            <View key={texto} style={styles.listaItem}>
              <View style={styles.bullet} />
              <Text style={styles.listaTexto}>{texto}</Text>
            </View>
          ))}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerTexto}>FIAP — ENGENHARIA DE SOFTWARE — 3º ANO</Text>
          <Text style={styles.footerTexto}>MOBILE DEVELOPMENT & IOT — 2026</Text>
        </View>
      </ScrollView>
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
    backButtonPressed: {
      opacity: 0.6,
    },
    headerNavTitle: {
      fontFamily: fontFamily.extrabold,
      fontSize: fontSize.md,
      color: c.text,
      letterSpacing: letterSpacing.widest,
    },
    headerNavSpacer: {
      width: 36,
    },
    scrollContent: { paddingBottom: spacing['4xl'] },
    header: {
      alignItems: 'center',
      paddingTop: spacing.xl,
      paddingBottom: spacing['4xl'] - 4,
      gap: spacing.xs + 2,
    },
    logoContainer: {
      width: 80,
      height: 80,
      borderRadius: radius.xl,
      backgroundColor: c.card,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.md,
      borderWidth: 1,
      borderColor: c.border,
    },
    appNome: {
      fontFamily: fontFamily.extrabold,
      fontSize: fontSize['2xl'],
      color: c.text,
      letterSpacing: 5,
    },
    versao: {
      fontFamily: fontFamily.medium,
      fontSize: fontSize.xs,
      color: c.textSubtle,
      letterSpacing: letterSpacing.wider,
    },
    card: {
      backgroundColor: c.card,
      marginHorizontal: spacing.xl,
      marginBottom: spacing.sm + 2,
      borderRadius: radius.lg,
      padding: spacing.xl,
      borderWidth: 1,
      borderColor: c.border,
    },
    cardTitulo: {
      fontFamily: fontFamily.extrabold,
      fontSize: fontSize.sm,
      color: c.primary,
      letterSpacing: letterSpacing.wider,
      marginBottom: spacing.md,
    },
    cardTexto: {
      fontFamily: fontFamily.regular,
      fontSize: fontSize.base,
      color: c.textMuted,
      lineHeight: 22,
    },
    listaItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.sm + 2,
      gap: spacing.md,
    },
    bullet: {
      width: 4,
      height: 4,
      borderRadius: 2,
      backgroundColor: c.primary,
    },
    listaTexto: {
      fontFamily: fontFamily.regular,
      fontSize: fontSize.md,
      color: c.textMuted,
      flex: 1,
      lineHeight: 20,
    },
    integranteRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md + 2,
    },
    integranteAvatarPlaceholder: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: c.cardElevated,
      alignItems: 'center',
      justifyContent: 'center',
    },
    integranteInicial: {
      fontFamily: fontFamily.bold,
      fontSize: fontSize.base,
      color: c.primary,
      letterSpacing: letterSpacing.normal,
    },
    integranteDivisor: {
      height: 1,
      backgroundColor: c.border,
      marginVertical: spacing.md,
    },
    integranteInfo: { flex: 1 },
    integranteNome: {
      fontFamily: fontFamily.bold,
      fontSize: fontSize.md,
      color: c.text,
      letterSpacing: letterSpacing.normal,
    },
    integranteRM: {
      fontFamily: fontFamily.medium,
      fontSize: fontSize.sm,
      color: c.textSubtle,
      letterSpacing: letterSpacing.normal,
      marginTop: 2,
    },
    techGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    techBadge: {
      backgroundColor: c.cardElevated,
      paddingHorizontal: spacing.md + 2,
      paddingVertical: spacing.sm,
      borderRadius: radius.full,
    },
    techTexto: {
      fontFamily: fontFamily.semibold,
      fontSize: fontSize.xs,
      color: c.textMuted,
      letterSpacing: letterSpacing.normal,
    },
    footer: {
      alignItems: 'center',
      paddingTop: spacing['2xl'] + 4,
      paddingBottom: spacing.sm + 2,
      gap: spacing.xs,
    },
    footerTexto: {
      fontFamily: fontFamily.medium,
      fontSize: fontSize.xs,
      color: c.textSubtle,
      letterSpacing: letterSpacing.wide,
    },
  });
