import { View, Text, StyleSheet } from 'react-native';

import { fontFamily, fontSize, letterSpacing, spacing } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';

type Props = {
  emoji?: string;
  title: string;
  subtitle?: string;
};

export default function EmptyState({ emoji, title, subtitle }: Props) {
  const { colors } = useTheme();
  return (
    <View style={styles.container}>
      {emoji ? <Text style={styles.emoji}>{emoji}</Text> : null}
      <Text style={[styles.title, { color: colors.textSubtle }]}>
        {title.toUpperCase()}
      </Text>
      {subtitle ? (
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>{subtitle}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: spacing['5xl'],
    paddingHorizontal: spacing.xl,
  },
  emoji: {
    fontSize: 36,
    marginBottom: spacing.md,
  },
  title: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.sm,
    letterSpacing: letterSpacing.wide,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: fontFamily.regular,
    fontSize: fontSize.md,
    marginTop: spacing.sm,
    textAlign: 'center',
    lineHeight: 20,
  },
});
