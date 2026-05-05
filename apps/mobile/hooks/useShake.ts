import { useCallback, useRef } from 'react';
import { Animated } from 'react-native';

export function useShake(intensity: number = 8) {
  const translateX = useRef(new Animated.Value(0)).current;

  const shake = useCallback(() => {
    translateX.setValue(0);
    Animated.sequence([
      Animated.timing(translateX, { toValue: intensity, duration: 50, useNativeDriver: true }),
      Animated.timing(translateX, { toValue: -intensity, duration: 50, useNativeDriver: true }),
      Animated.timing(translateX, { toValue: intensity * 0.7, duration: 50, useNativeDriver: true }),
      Animated.timing(translateX, { toValue: -intensity * 0.7, duration: 50, useNativeDriver: true }),
      Animated.timing(translateX, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  }, [translateX, intensity]);

  return { translateX, shake };
}
