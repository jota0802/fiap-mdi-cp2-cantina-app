import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';

import { fontFamily, fontSize, letterSpacing, radius, spacing } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';

type ToastVariant = 'success' | 'error' | 'info';

type Props = {
  message: string;
  variant?: ToastVariant;
  visible: boolean;
  onHide: () => void;
  duration?: number;
};

export default function Toast({
  message,
  variant = 'success',
  visible,
  onHide,
  duration = 2500,
}: Props) {
  const { colors } = useTheme();
  const translateY = useRef(new Animated.Value(-120)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;

    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        speed: 14,
        bounciness: 6,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -120,
          duration: 280,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start(() => onHide());
    }, duration);

    return () => clearTimeout(timer);
  }, [visible, duration, translateY, opacity, onHide]);

  if (!visible) return null;

  const iconName: keyof typeof Ionicons.glyphMap =
    variant === 'success'
      ? 'checkmark-circle'
      : variant === 'error'
        ? 'alert-circle'
        : 'information-circle';

  const accent =
    variant === 'success'
      ? colors.success
      : variant === 'error'
        ? colors.error
        : colors.primary;

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.container,
        {
          backgroundColor: colors.card,
          borderLeftColor: accent,
          opacity,
          transform: [{ translateY }],
        },
      ]}
    >
      <Ionicons name={iconName} size={20} color={accent} />
      <Text style={[styles.message, { color: colors.text }]} numberOfLines={2}>
        {message}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: spacing.xl,
    right: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    borderLeftWidth: 3,
    zIndex: 1000,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  message: {
    flex: 1,
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.base,
    letterSpacing: letterSpacing.normal,
  },
});
