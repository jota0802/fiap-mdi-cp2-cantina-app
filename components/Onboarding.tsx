import { useMemo, useRef, useState } from 'react';
import {
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
import { Image } from 'expo-image';
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
  imagem: string;
  iconeFallback: keyof typeof Ionicons.glyphMap;
  accent: string;
  accentSoft: string;
  titulo: string;
  texto: string;
};

const SLIDES: readonly Slide[] = [
  {
    imagem:
      'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=720&h=900&fit=crop&q=85',
    iconeFallback: 'restaurant-outline',
    accent: '#ED145B',
    accentSoft: 'rgba(237, 20, 91, 0.18)',
    titulo: 'Monte seu pedido',
    texto:
      'Explore o cardápio completo e adicione seus favoritos. Busca em tempo real e filtros por categoria.',
  },
  {
    imagem:
      'https://images.unsplash.com/photo-1556742502-ec7c0e9f34b1?w=720&h=900&fit=crop&q=85',
    iconeFallback: 'flash-outline',
    accent: '#F59E0B',
    accentSoft: 'rgba(245, 158, 11, 0.18)',
    titulo: 'Confirme em segundos',
    texto:
      'Revise no carrinho, confirme e receba uma senha única na hora. Sem fila, sem confusão.',
  },
  {
    imagem:
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=720&h=900&fit=crop&q=85',
    iconeFallback: 'bag-check-outline',
    accent: '#10B981',
    accentSoft: 'rgba(16, 185, 129, 0.18)',
    titulo: 'Retire quando ficar pronto',
    texto:
      'Notificação automática quando o pedido sai da cozinha. Mostre a senha no balcão e pegue tudo.',
  },
] as const;

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const HERO_HEIGHT = Math.min(Math.round(SCREEN_HEIGHT * 0.52), 480);

type Props = {
  onComplete: () => void;
};

type SlideViewProps = {
  slide: Slide;
  styles: ReturnType<typeof createStyles>;
  colors: ThemeColors;
};

function SlideView({ slide, styles, colors }: SlideViewProps) {
  const [erro, setErro] = useState(false);

  return (
    <View style={[styles.slide, { width: SCREEN_WIDTH }]}>
      <View style={styles.heroWrap}>
        {/* fallback colorido com ícone grande */}
        <View style={[styles.heroFallback, { backgroundColor: slide.accentSoft }]}>
          <Ionicons name={slide.iconeFallback} size={88} color={slide.accent} />
        </View>

        {!erro ? (
          <Image
            source={{ uri: slide.imagem }}
            style={styles.heroImage}
            contentFit="cover"
            transition={350}
            onError={() => setErro(true)}
          />
        ) : null}

        {/* gradient overlay sutil pra contraste com texto, caso fique embaixo */}
        <View style={styles.heroVignette} pointerEvents="none" />
      </View>

      <View style={styles.copy}>
        <View style={[styles.accentChip, { backgroundColor: slide.accentSoft }]}>
          <View style={[styles.accentDot, { backgroundColor: slide.accent }]} />
          <Text style={[styles.accentChipTexto, { color: slide.accent }]}>
            {slide.titulo.split(' ')[0]?.toUpperCase()}
          </Text>
        </View>

        <Text style={styles.titulo}>{slide.titulo}</Text>
        <Text style={styles.texto}>{slide.texto}</Text>
      </View>
    </View>
  );
}

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
    if (indice < SLIDES.length - 1) {
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

  const ultimoSlide = indice === SLIDES.length - 1;
  const accentAtivo = SLIDES[indice]?.accent ?? colors.primary;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.headerRow}>
        <View />
        {!ultimoSlide ? (
          <Pressable
            onPress={handlePular}
            hitSlop={12}
            style={styles.pularButton}
            accessibilityRole="button"
            accessibilityLabel="Pular onboarding"
          >
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
        bounces={false}
      >
        {SLIDES.map((slide, i) => (
          <SlideView key={i} slide={slide} styles={styles} colors={colors} />
        ))}
      </ScrollView>

      <View style={styles.dotsRow}>
        {SLIDES.map((_, i) => (
          <Pressable
            key={i}
            onPress={() => irPara(i)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={`Ir para o slide ${i + 1} de ${SLIDES.length}`}
            accessibilityState={{ selected: i === indice }}
          >
            <View
              style={[
                styles.dot,
                i === indice && styles.dotAtivo,
                i === indice && { backgroundColor: accentAtivo },
              ]}
            />
          </Pressable>
        ))}
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.lg }]}>
        <Pressable
          style={({ pressed }) => [
            styles.botao,
            { backgroundColor: accentAtivo },
            pressed && styles.pressedSoft,
          ]}
          onPress={handleProximo}
          accessibilityRole="button"
          accessibilityLabel={ultimoSlide ? 'Começar a usar o app' : 'Ir para o próximo slide'}
        >
          <Text style={styles.botaoTexto}>{ultimoSlide ? 'Começar' : 'Próximo'}</Text>
          <Ionicons
            name={ultimoSlide ? 'sparkles' : 'arrow-forward'}
            size={18}
            color="#FFFFFF"
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
      paddingHorizontal: spacing.xl,
    },
    heroWrap: {
      width: '100%',
      height: HERO_HEIGHT,
      borderRadius: radius['2xl'],
      overflow: 'hidden',
      backgroundColor: c.surfaceElevated,
      ...shadow.lg,
    },
    heroFallback: {
      ...StyleSheet.absoluteFillObject,
      alignItems: 'center',
      justifyContent: 'center',
    },
    heroImage: {
      ...StyleSheet.absoluteFillObject,
    },
    heroVignette: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.05)',
    },
    copy: {
      paddingTop: spacing['2xl'],
      paddingBottom: spacing.lg,
      alignItems: 'flex-start',
    },
    accentChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs + 2,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs + 2,
      borderRadius: radius.full,
      marginBottom: spacing.md,
    },
    accentDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    accentChipTexto: {
      fontFamily: fontFamily.bold,
      fontSize: fontSize.xs,
      letterSpacing: letterSpacing.widest,
    },
    titulo: {
      fontFamily: fontFamily.extrabold,
      fontSize: fontSize['3xl'],
      color: c.text,
      marginBottom: spacing.sm,
      lineHeight: fontSize['3xl'] * 1.1,
    },
    texto: {
      fontFamily: fontFamily.medium,
      fontSize: fontSize.base,
      color: c.textMuted,
      lineHeight: 22,
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
      paddingVertical: spacing.lg,
      borderRadius: radius.full,
      ...shadow.lg,
    },
    botaoTexto: {
      fontFamily: fontFamily.bold,
      color: '#FFFFFF',
      fontSize: fontSize.base,
    },
    pressedSoft: {
      opacity: 0.85,
      transform: [{ scale: 0.98 }],
    },
  });
