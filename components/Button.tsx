import { useRef, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native';

import { fontFamily, fontSize, radius, shadow, spacing } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';

type Variant = 'primary' | 'secondary' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

type Props = {
  title: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
  style?: ViewStyle;
};

export default function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  style,
}: Props) {
  const { colors } = useTheme();
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 60,
      bounciness: 0,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 60,
      bounciness: 6,
    }).start();
  };

  const variantStyles = {
    primary: {
      bg: colors.primary,
      text: colors.primaryText,
      border: 'transparent',
      shadow: shadow.primary,
    },
    secondary: {
      bg: colors.surface,
      text: colors.text,
      border: colors.border,
      shadow: shadow.none,
    },
    ghost: {
      bg: 'transparent',
      text: colors.primary,
      border: colors.borderStrong,
      shadow: shadow.none,
    },
  }[variant];

  const sizeStyles = {
    sm: {
      paddingVertical: spacing.sm + 2,
      paddingHorizontal: spacing.lg,
      fontSize: fontSize.md,
    },
    md: {
      paddingVertical: spacing.md + 2,
      paddingHorizontal: spacing.xl,
      fontSize: fontSize.base,
    },
    lg: {
      paddingVertical: spacing.lg,
      paddingHorizontal: spacing['2xl'],
      fontSize: fontSize.base,
    },
  }[size];

  return (
    <Animated.View
      style={[
        { transform: [{ scale }] },
        fullWidth && styles.fullWidth,
        style,
      ]}
    >
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        accessibilityRole="button"
        accessibilityState={{ disabled: disabled || loading, busy: loading }}
        style={[
          styles.base,
          variantStyles.shadow,
          {
            backgroundColor: variantStyles.bg,
            borderColor: variantStyles.border,
            paddingVertical: sizeStyles.paddingVertical,
            paddingHorizontal: sizeStyles.paddingHorizontal,
            opacity: disabled ? 0.45 : 1,
          },
        ]}
      >
        {loading ? (
          <ActivityIndicator color={variantStyles.text} size="small" />
        ) : (
          <View style={styles.row}>
            {leftIcon}
            <Text
              style={{
                color: variantStyles.text,
                fontFamily: fontFamily.bold,
                fontSize: sizeStyles.fontSize,
              }}
            >
              {title}
            </Text>
            {rightIcon}
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  fullWidth: {
    width: '100%',
  },
});
