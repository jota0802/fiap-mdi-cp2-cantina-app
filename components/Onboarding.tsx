import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Platform,
  Pressable,
  type ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  fontFamily,
  fontSize,
  letterSpacing,
  radius,
  shadow,
  spacing,
} from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { haptic } from '@/lib/haptics';
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

const MAX_CONTENT_WIDTH = 480;
const DOT_BASE = 6;
const DOT_ACTIVE = 24;

type Props = {
  onComplete: () => void;
};

type SlideViewProps = {
  slide: Slide;
  index: number;
  scrollX: Animated.Value;
  slideWidth: number;
  heroHeight: number;
  styles: ReturnType<typeof createStyles>;
};

function SlideView({
  slide,
  index,
  scrollX,
  slideWidth,
  heroHeight,
  styles,
}: SlideViewProps) {
  const [erro, setErro] = useState(false);

  const inputRange = [
    (index - 1) * slideWidth,
    index * slideWidth,
    (index + 1) * slideWidth,
  ];

  // Parallax sutil — hero translada até ±24px enquanto o slide entra/sai
  const heroTranslate = scrollX.interpolate({
    inputRange,
    outputRange: [24, 0, -24],
    extrapolate: 'clamp',
  });

  // Texto sobe levemente conforme entra
  const copyTranslate = scrollX.interpolate({
    inputRange,
    outputRange: [16, 0, -16],
    extrapolate: 'clamp',
  });
  const copyOpacity = scrollX.interpolate({
    inputRange,
    outputRange: [0.4, 1, 0.4],
    extrapolate: 'clamp',
  });

  return (
    <View style={[styles.slide, { width: slideWidth }]}>
      <View style={[styles.heroWrap, { height: heroHeight }]}>
        <View style={[styles.heroFallback, { backgroundColor: slide.accentSoft }]}>
          <Ionicons name={slide.iconeFallback} size={88} color={slide.accent} />
        </View>

        {!erro ? (
          <Animated.View
            style={[
              StyleSheet.absoluteFillObject,
              { transform: [{ translateX: heroTranslate }] },
            ]}
          >
            <Image
              source={{ uri: slide.imagem }}
              style={styles.heroImage}
              contentFit="cover"
              transition={350}
              onError={() => setErro(true)}
            />
          </Animated.View>
        ) : null}

        <View style={styles.heroVignette} pointerEvents="none" />
      </View>

      <Animated.View
        style={[
          styles.copy,
          { opacity: copyOpacity, transform: [{ translateY: copyTranslate }] },
        ]}
      >
        <View style={[styles.accentChip, { backgroundColor: slide.accentSoft }]}>
          <View style={[styles.accentDot, { backgroundColor: slide.accent }]} />
          <Text style={[styles.accentChipTexto, { color: slide.accent }]}>
            {slide.titulo.split(' ')[0]?.toUpperCase()}
          </Text>
        </View>

        <Text style={styles.titulo}>{slide.titulo}</Text>
        <Text style={styles.texto}>{slide.texto}</Text>
      </Animated.View>
    </View>
  );
}

type DotProps = {
  index: number;
  scrollX: Animated.Value;
  slideWidth: number;
  accent: string;
  baseColor: string;
  onPress: () => void;
};

function Dot({ index, scrollX, slideWidth, accent, baseColor, onPress }: DotProps) {
  const inputRange = [
    (index - 1) * slideWidth,
    index * slideWidth,
    (index + 1) * slideWidth,
  ];

  const width = scrollX.interpolate({
    inputRange,
    outputRange: [DOT_BASE, DOT_ACTIVE, DOT_BASE],
    extrapolate: 'clamp',
  });

  const opacity = scrollX.interpolate({
    inputRange,
    outputRange: [0.5, 1, 0.5],
    extrapolate: 'clamp',
  });

  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={`Ir para o slide ${index + 1} de ${SLIDES.length}`}
    >
      <Animated.View
        style={{
          width,
          height: DOT_BASE,
          borderRadius: DOT_BASE / 2,
          backgroundColor: accent,
          opacity,
        }}
      />
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: DOT_BASE,
          height: DOT_BASE,
          borderRadius: DOT_BASE / 2,
          backgroundColor: baseColor,
          zIndex: -1,
        }}
      />
    </Pressable>
  );
}

export default function Onboarding({ onComplete }: Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const styles = useMemo(() => createStyles(colors), [colors]);

  // Cap a largura no web (desktop ficaria com slide gigante)
  const slideWidth = Platform.OS === 'web' ? Math.min(width, MAX_CONTENT_WIDTH) : width;
  const heroHeight = Math.min(Math.round(height * 0.5), 460);

  const scrollRef = useRef<ScrollView>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const [indice, setIndice] = useState(0);

  // Re-ancora o scroll quando largura muda (rotação / resize web)
  useEffect(() => {
    scrollRef.current?.scrollTo({ x: indice * slideWidth, animated: false });
  }, [slideWidth, indice]);

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    {
      useNativeDriver: false,
      listener: (e: NativeSyntheticEvent<NativeScrollEvent>) => {
        const offset = e.nativeEvent.contentOffset.x;
        const novoIndice = Math.round(offset / slideWidth);
        if (novoIndice !== indice && novoIndice >= 0 && novoIndice < SLIDES.length) {
          setIndice(novoIndice);
          haptic.light();
        }
      },
    },
  );

  const irPara = (i: number) => {
    scrollRef.current?.scrollTo({ x: i * slideWidth, animated: true });
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
      <View style={[styles.contentWrap, { maxWidth: MAX_CONTENT_WIDTH }]}>
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

        <Animated.ScrollView
          ref={scrollRef as never}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          bounces={false}
          decelerationRate="fast"
          snapToInterval={slideWidth}
          snapToAlignment="start"
        >
          {SLIDES.map((slide, i) => (
            <SlideView
              key={i}
              slide={slide}
              index={i}
              scrollX={scrollX}
              slideWidth={slideWidth}
              heroHeight={heroHeight}
              styles={styles}
            />
          ))}
        </Animated.ScrollView>

        <View style={styles.dotsRow}>
          {SLIDES.map((_, i) => (
            <Dot
              key={i}
              index={i}
              scrollX={scrollX}
              slideWidth={slideWidth}
              accent={accentAtivo}
              baseColor={colors.borderStrong}
              onPress={() => irPara(i)}
            />
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
            accessibilityLabel={
              ultimoSlide ? 'Começar a usar o app' : 'Ir para o próximo slide'
            }
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
    </View>
  );
}

const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.bg,
      alignItems: 'center',
    },
    contentWrap: {
      flex: 1,
      width: '100%',
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
      flex: 1,
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
