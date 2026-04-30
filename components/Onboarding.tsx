import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Platform,
  Pressable,
  ScrollView,
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
import { useLocale } from '@/context/LocaleContext';
import { useTheme } from '@/context/ThemeContext';
import { haptic } from '@/lib/haptics';
import type { ThemeColors } from '@/types';

type Slide = {
  imagem: string;
  iconeFallback: keyof typeof Ionicons.glyphMap;
  accent: string;
  accentSoft: string;
  tituloKey: string;
  textoKey: string;
};

const SLIDES: readonly Slide[] = [
  {
    imagem:
      'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=720&h=900&fit=crop&q=85',
    iconeFallback: 'restaurant-outline',
    accent: '#ED145B',
    accentSoft: 'rgba(237, 20, 91, 0.18)',
    tituloKey: 'onboarding.slide1_title',
    textoKey: 'onboarding.slide1_text',
  },
  {
    imagem:
      'https://images.unsplash.com/photo-1556742502-ec7c0e9f34b1?w=720&h=900&fit=crop&q=85',
    iconeFallback: 'flash-outline',
    accent: '#F59E0B',
    accentSoft: 'rgba(245, 158, 11, 0.18)',
    tituloKey: 'onboarding.slide2_title',
    textoKey: 'onboarding.slide2_text',
  },
  {
    imagem:
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=720&h=900&fit=crop&q=85',
    iconeFallback: 'bag-check-outline',
    accent: '#10B981',
    accentSoft: 'rgba(16, 185, 129, 0.18)',
    tituloKey: 'onboarding.slide3_title',
    textoKey: 'onboarding.slide3_text',
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
  const { t } = useLocale();
  const [erro, setErro] = useState(false);
  const titulo = t(slide.tituloKey);
  const texto = t(slide.textoKey);

  const inputRange = [
    (index - 1) * slideWidth,
    index * slideWidth,
    (index + 1) * slideWidth,
  ];

  const heroTranslate = scrollX.interpolate({
    inputRange,
    outputRange: [24, 0, -24],
    extrapolate: 'clamp',
  });

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
            {titulo.split(' ')[0]?.toUpperCase()}
          </Text>
        </View>

        <Text style={styles.titulo}>{titulo}</Text>
        <Text style={styles.texto}>{texto}</Text>
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

  const backgroundColor = scrollX.interpolate({
    inputRange,
    outputRange: [baseColor, accent, baseColor],
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
          backgroundColor,
        }}
      />
    </Pressable>
  );
}

export default function Onboarding({ onComplete }: Props) {
  const { colors } = useTheme();
  const { t } = useLocale();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const styles = useMemo(() => createStyles(colors), [colors]);

  // Cap a largura no web — em desktop o slide ficaria gigante
  const slideWidth = Platform.OS === 'web' ? Math.min(width, MAX_CONTENT_WIDTH) : width;
  const heroHeight = Math.min(Math.round(height * 0.5), 460);

  const scrollRef = useRef<ScrollView>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const [indice, setIndice] = useState(0);
  const indiceRef = useRef(0);

  // Mantém indiceRef sincronizado para uso no useEffect de re-anchor
  useEffect(() => {
    indiceRef.current = indice;
  }, [indice]);

  // Re-ancora SOMENTE quando o slideWidth muda (rotação / resize web).
  // Crucialmente NÃO depende de `indice` — re-ancorar a cada mudança de
  // índice mata o gesto do usuário no meio do drag.
  useEffect(() => {
    scrollRef.current?.scrollTo({
      x: indiceRef.current * slideWidth,
      animated: false,
    });
  }, [slideWidth]);

  // onScroll só alimenta scrollX pra animações; índice atualiza no
  // momentumEnd pra não interromper o drag do usuário.
  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    { useNativeDriver: false },
  );

  const handleMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (slideWidth <= 0) return;
    const offset = e.nativeEvent.contentOffset.x;
    const novoIndice = Math.round(offset / slideWidth);
    if (
      novoIndice !== indiceRef.current &&
      novoIndice >= 0 &&
      novoIndice < SLIDES.length
    ) {
      setIndice(novoIndice);
      haptic.light();
    }
  };

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
              accessibilityLabel={t('cta.skip')}
            >
              <Text style={styles.pularTexto}>{t('cta.skip')}</Text>
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
          onMomentumScrollEnd={handleMomentumEnd}
          scrollEventThrottle={16}
          bounces={false}
          decelerationRate="fast"
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
        </ScrollView>

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
            accessibilityLabel={ultimoSlide ? t('cta.start') : t('cta.next')}
          >
            <Text style={styles.botaoTexto}>{ultimoSlide ? t('cta.start') : t('cta.next')}</Text>
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
