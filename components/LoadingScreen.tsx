import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/context/ThemeContext';
import { fontFamily, fontSize, letterSpacing, spacing } from '@/constants/theme';

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
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(translateY, {
          toValue: -10,
          duration: 320,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 320,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [translateY, delay]);

  return (
    <Animated.View
      style={[
        styles.dot,
        { backgroundColor: color, transform: [{ translateY }] },
      ]}
    />
  );
}

export default function LoadingScreen({
  label = 'CARREGANDO',
  subtitle,
  inline = false,
}: Props) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        inline ? styles.inline : styles.container,
        !inline && { backgroundColor: colors.bg },
      ]}
    >
      <View style={styles.dots}>
        <AnimatedDot delay={0} color={colors.primary} />
        <AnimatedDot delay={160} color={colors.primary} />
        <AnimatedDot delay={320} color={colors.primary} />
      </View>
      {label ? (
        <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      ) : null}
      {subtitle ? (
        <Text style={[styles.subtitle, { color: colors.textSubtle }]}>{subtitle}</Text>
      ) : null}
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
  dots: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  label: {
    fontFamily: fontFamily.extrabold,
    fontSize: fontSize.lg,
    letterSpacing: letterSpacing.widest,
  },
  subtitle: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.sm,
    letterSpacing: letterSpacing.wider,
    marginTop: spacing.sm,
  },
});
