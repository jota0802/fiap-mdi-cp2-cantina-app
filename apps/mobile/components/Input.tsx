import { Ionicons } from '@expo/vector-icons';
import { useState, type ReactNode } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';

import { fontFamily, fontSize, radius, spacing } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';

type Props = TextInputProps & {
  label?: string;
  error?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  rightSlot?: ReactNode;
  shakeAnim?: Animated.Value;
};

export default function Input({
  label,
  error,
  icon,
  rightSlot,
  shakeAnim,
  ...inputProps
}: Props) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);

  const borderColor = error
    ? colors.error
    : focused
      ? colors.primary
      : colors.border;

  const wrapperStyle = shakeAnim ? { transform: [{ translateX: shakeAnim }] } : undefined;

  const content = (
    <>
      {label ? (
        <Text style={[styles.label, { color: colors.textMuted }]}>{label}</Text>
      ) : null}
      <View
        style={[
          styles.inputContainer,
          { backgroundColor: colors.inputBg, borderColor },
        ]}
      >
        {icon ? (
          <Ionicons
            name={icon}
            size={18}
            color={focused || error ? (error ? colors.error : colors.primary) : colors.textSubtle}
            style={styles.icon}
          />
        ) : null}
        <TextInput
          {...inputProps}
          placeholderTextColor={colors.textSubtle}
          style={[
            styles.input,
            { color: colors.text, fontFamily: fontFamily.regular },
            inputProps.style,
          ]}
          onFocus={(e) => {
            setFocused(true);
            inputProps.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            inputProps.onBlur?.(e);
          }}
        />
        {rightSlot}
      </View>
      {error ? (
        <Text style={[styles.error, { color: colors.error }]}>{error}</Text>
      ) : null}
    </>
  );

  if (shakeAnim) {
    return <Animated.View style={[styles.wrapper, wrapperStyle]}>{content}</Animated.View>;
  }
  return <View style={styles.wrapper}>{content}</View>;
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: spacing.md,
  },
  label: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.md,
    marginBottom: spacing.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
  },
  icon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    paddingVertical: spacing.md + 2,
    fontSize: fontSize.lg,
  },
  error: {
    fontFamily: fontFamily.medium,
    fontSize: fontSize.md,
    marginTop: spacing.xs + 2,
    marginLeft: spacing.xs,
  },
});
