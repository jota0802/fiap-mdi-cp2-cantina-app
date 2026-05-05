import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, type ViewStyle } from 'react-native';

import { useTheme } from '@/context/ThemeContext';

type Props = {
  width?: number | `${number}%`;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
};

export default function Skeleton({
  width = '100%',
  height = 16,
  borderRadius = 8,
  style,
}: Props) {
  const { colors } = useTheme();
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.85,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.4,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.base,
        { width, height, borderRadius, backgroundColor: colors.cardElevated, opacity },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
  },
});

export function SkeletonOrderCard() {
  const { colors } = useTheme();
  return (
    <View
      style={[
        skeletonCardStyles.card,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <View style={skeletonCardStyles.headerRow}>
        <Skeleton width={88} height={64} borderRadius={12} />
        <View style={{ flex: 1, gap: 10, alignItems: 'flex-end' }}>
          <Skeleton width={140} height={12} />
          <Skeleton width={90} height={20} borderRadius={20} />
        </View>
      </View>
      <View style={skeletonCardStyles.divisor} />
      <Skeleton width="90%" height={12} />
      <View style={{ height: 8 }} />
      <Skeleton width="60%" height={12} />
      <View style={skeletonCardStyles.footerRow}>
        <Skeleton width={50} height={12} />
        <Skeleton width={80} height={20} />
      </View>
    </View>
  );
}

const skeletonCardStyles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
  },
  headerRow: {
    flexDirection: 'row',
    gap: 16,
  },
  divisor: {
    height: 1,
    marginVertical: 16,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
});
