import { useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

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
import type { ThemeColors } from '@/types';

type Slide = {
  emoji: string;
  iconBg: string;
  eyebrow: string;
  titulo: string;
  texto: string;
};

const SLIDES_CONFIG = [
  {
    emoji: '🍽️',
    iconBg: 'rgba(237, 20, 91, 0.14)',
    eyebrow: 'PASSO 1',
    titulo: 'Monte seu pedido',
    texto: 'Explore o cardápio e adicione seus favoritos com um toque. Busca em tempo real e filtros por categoria.',
  },
  {
    emoji: '⚡',
    iconBg: 'rgba(245, 158, 11, 0.14)',
    eyebrow: 'PASSO 2',
    titulo: 'Confirme em segundos',
    texto: 'Revise no carrinho, confirme o pedido e receba sua senha única na hora — sem fila, sem confusão.',
  },
  {
    emoji: '🛍️',
    iconBg: 'rgba(16, 185, 129, 0.14)',
    eyebrow: 'PASSO 3',
    titulo: 'Retire quando estiver pronto',
    texto: 'Você é notificado assim que o pedido fica pronto. Mostra a senha no balcão e pode retirar.',
  },
] as const satisfies readonly Slide[];

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type Props = {
  onComplete: () => void;
};

export default function Onboarding({ onComplete }: Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const scrollRef = useRef<ScrollView>(null);
  const [indice, setIndice] = useState(0);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offset = e.nativeEvent.contentOffset.x;
    const novoIndice = Math.round(offset / SCREEN_WIDTH);
    if (novoIndice !== indice) {
      setIndice(novoIndice);
      haptic.light();
    }
  };

  const irPara = (i: number) => {
    scrollRef.current?.scrollTo({ x: i * SCREEN_WIDTH, animated: true });
  };

  const handleProximo = () => {
    if (indice < SLIDES_CONFIG.length - 1) {
      irPara(indice + 1);
    } else {
      haptic.success();
      onComplete();
    }
  };

  const handlePular = () => {
    haptic.light();
    onComplete();
  };

  const ultimoSlide = indice === SLIDES_CONFIG.length - 1;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.headerRow}>
        <View />
        {!ultimoSlide ? (
          <Pressable onPress={handlePular} hitSlop={12} style={styles.pularButton}>
            <Text style={styles.pularTexto}>Pular</Text>
          </Pressable>
        ) : (
          <View style={styles.pularButton} />
        )}
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {SLIDES_CONFIG.map((slide, i) => (
          <View key={i} style={[styles.slide, { width: SCREEN_WIDTH }]}>
            <View style={[styles.iconWrap, { backgroundColor: slide.iconBg }]}>
              <Animated.Text style={styles.iconEmoji}>{slide.emoji}</Animated.Text>
            </View>

            <Text style={styles.eyebrow}>{slide.eyebrow}</Text>
            <Text style={styles.titulo}>{slide.titulo}</Text>
            <Text style={styles.texto}>{slide.texto}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.dotsRow}>
        {SLIDES_CONFIG.map((_, i) => (
          <Pressable key={i} onPress={() => irPara(i)} hitSlop={8}>
            <View style={[styles.dot, i === indice && styles.dotAtivo]} />
          </Pressable>
        ))}
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.lg }]}>
        <Pressable
          style={({ pressed }) => [styles.botao, pressed && styles.pressedSoft]}
          onPress={handleProximo}
        >
          <Text style={styles.botaoTexto}>{ultimoSlide ? 'Começar' : 'Próximo'}</Text>
          <Ionicons
            name={ultimoSlide ? 'sparkles' : 'arrow-forward'}
            size={18}
            color={colors.primaryText}
          />
        </Pressable>
      </View>
    </View>
  );
}

const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.bg,
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.md,
    },
    pularButton: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      minWidth: 64,
      alignItems: 'flex-end',
    },
    pularTexto: {
      fontFamily: fontFamily.semibold,
      fontSize: fontSize.base,
      color: c.textMuted,
    },
    slide: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing['2xl'],
    },
    iconWrap: {
      width: 140,
      height: 140,
      borderRadius: 36,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing['2xl'],
    },
    iconEmoji: {
      fontSize: 72,
    },
    eyebrow: {
      fontFamily: fontFamily.semibold,
      fontSize: fontSize.xs,
      color: c.textSubtle,
      letterSpacing: letterSpacing.widest,
      marginBottom: spacing.sm,
    },
    titulo: {
      fontFamily: fontFamily.extrabold,
      fontSize: fontSize['3xl'],
      color: c.text,
      textAlign: 'center',
      marginBottom: spacing.md,
    },
    texto: {
      fontFamily: fontFamily.medium,
      fontSize: fontSize.base,
      color: c.textMuted,
      textAlign: 'center',
      lineHeight: 22,
      maxWidth: 320,
    },
    dotsRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: spacing.xs + 2,
      paddingVertical: spacing.lg,
    },
    dot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: c.borderStrong,
    },
    dotAtivo: {
      width: 24,
      backgroundColor: c.primary,
    },
    footer: {
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.md,
    },
    botao: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      backgroundColor: c.primary,
      paddingVertical: spacing.lg,
      borderRadius: radius.full,
      ...shadow.primary,
    },
    botaoTexto: {
      fontFamily: fontFamily.bold,
      color: c.primaryText,
      fontSize: fontSize.base,
    },
    pressedSoft: {
      opacity: 0.85,
      transform: [{ scale: 0.98 }],
    },
  });
