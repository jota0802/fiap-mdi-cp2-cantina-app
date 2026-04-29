import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

import FiapLogo from '@/components/FiapLogo';
import { fontFamily, fontSize, spacing } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';

type Props = {
  label?: string;
  subtitle?: string;
  inline?: boolean;
};

type DotProps = {
  delay: number;
  color: string;
};

function AnimatedDot({ delay, color }: DotProps) {
  const opacity = useRef(new Animated.Value(0.25)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 360,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.25,
          duration: 360,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [opacity, delay]);

  return <Animated.View style={[styles.dot, { backgroundColor: color, opacity }]} />;
}

function toSentenceCase(text: string): string {
  if (!text) return text;
  const lower = text.toLocaleLowerCase('pt-BR');
  return lower.charAt(0).toLocaleUpperCase('pt-BR') + lower.slice(1);
}

export default function LoadingScreen({ label, subtitle, inline = false }: Props) {
  const { colors } = useTheme();
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (inline) return;
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.06,
          duration: 1100,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1100,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [pulse, inline]);

  // Compatibilidade com callers legados que ainda passam UPPERCASE
  const labelTexto = label ? toSentenceCase(label) : null;
  const subtituloTexto = subtitle ? toSentenceCase(subtitle) : null;

  if (inline) {
    return (
      <View style={styles.inline}>
        <View style={styles.dots}>
          <AnimatedDot delay={0} color={colors.primary} />
          <AnimatedDot delay={180} color={colors.primary} />
          <AnimatedDot delay={360} color={colors.primary} />
        </View>
        {labelTexto ? (
          <Text style={[styles.label, { color: colors.text }]}>{labelTexto}</Text>
        ) : null}
        {subtituloTexto ? (
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>{subtituloTexto}</Text>
        ) : null}
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={styles.content}>
        <Animated.View style={[styles.logoWrap, { transform: [{ scale: pulse }] }]}>
          <FiapLogo width={132} color={colors.primary} />
        </Animated.View>

        <View style={styles.dots}>
          <AnimatedDot delay={0} color={colors.primary} />
          <AnimatedDot delay={180} color={colors.primary} />
          <AnimatedDot delay={360} color={colors.primary} />
        </View>

        {labelTexto ? (
          <Text style={[styles.label, { color: colors.text }]}>{labelTexto}</Text>
        ) : null}
        {subtituloTexto ? (
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>{subtituloTexto}</Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inline: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['3xl'],
  },
  content: {
    alignItems: 'center',
  },
  logoWrap: {
    marginBottom: spacing['2xl'],
  },
  dots: {
    flexDirection: 'row',
    gap: spacing.xs + 2,
    marginBottom: spacing.xl,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    fontFamily: fontFamily.bold,
    fontSize: fontSize.lg,
  },
  subtitle: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.base,
    marginTop: spacing.xs,
    textAlign: 'center',
    paddingHorizontal: spacing['2xl'],
  },
});
