import { useMemo, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, Animated } from 'react-native';

import { useTheme } from '@/context/ThemeContext';
import { fontFamily, fontSize, letterSpacing, radius, spacing } from '@/constants/theme';
import type { ItemCardapio as ItemCardapioModel, ThemeColors } from '@/types';

type Props = {
  item: ItemCardapioModel;
  quantidade: number;
  onAdicionar: (id: number) => void;
  onRemover: (id: number) => void;
};

export default function ItemCardapio({ item, quantidade, onAdicionar, onRemover }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const scale = useRef(new Animated.Value(1)).current;
  const animatePop = () => {
    Animated.sequence([
      Animated.timing(scale, { toValue: 1.12, duration: 90, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 8 }),
    ]).start();
  };

  return (
    <View style={styles.container}>
      <View style={styles.emojiContainer}>
        <Text style={styles.emoji}>{item.emoji}</Text>
      </View>

      <View style={styles.info}>
        <Text style={styles.nome}>{item.nome.toUpperCase()}</Text>
        <Text style={styles.descricao}>{item.descricao}</Text>
        <Text style={styles.preco}>R$ {item.preco.toFixed(2)}</Text>
      </View>

      <View style={styles.controles}>
        {quantidade > 0 ? (
          <Pressable
            style={({ pressed }) => [styles.botaoMenos, pressed && styles.pressed]}
            onPress={() => {
              onRemover(item.id);
              animatePop();
            }}
            hitSlop={8}
          >
            <Text style={styles.botaoMenosTexto}>−</Text>
          </Pressable>
        ) : null}

        {quantidade > 0 ? (
          <Animated.Text style={[styles.quantidade, { transform: [{ scale }] }]}>
            {quantidade}
          </Animated.Text>
        ) : null}

        <Pressable
          style={({ pressed }) => [styles.botaoMais, pressed && styles.pressed]}
          onPress={() => {
            onAdicionar(item.id);
            animatePop();
          }}
          hitSlop={8}
        >
          <Text style={styles.botaoMaisTexto}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.card,
      borderRadius: radius.lg,
      padding: spacing.md + 2,
      marginBottom: spacing.sm,
      borderWidth: 1,
      borderColor: c.border,
    },
    emojiContainer: {
      width: 48,
      height: 48,
      borderRadius: radius.md,
      backgroundColor: c.cardElevated,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emoji: { fontSize: 24 },
    info: {
      flex: 1,
      marginLeft: spacing.md + 2,
    },
    nome: {
      fontFamily: fontFamily.bold,
      fontSize: fontSize.md - 1,
      color: c.text,
      letterSpacing: letterSpacing.normal,
    },
    descricao: {
      fontFamily: fontFamily.regular,
      fontSize: fontSize.md - 1,
      color: c.textSubtle,
      marginTop: 2,
    },
    preco: {
      fontFamily: fontFamily.bold,
      fontSize: fontSize.base,
      color: c.primary,
      marginTop: spacing.xs,
    },
    controles: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm + 2,
    },
    botaoMais: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: c.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    botaoMenos: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: c.cardElevated,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: c.border,
    },
    botaoMaisTexto: {
      fontFamily: fontFamily.bold,
      color: c.primaryText,
      fontSize: fontSize.xl,
      lineHeight: 20,
    },
    botaoMenosTexto: {
      fontFamily: fontFamily.bold,
      color: c.text,
      fontSize: fontSize.xl,
      lineHeight: 20,
    },
    quantidade: {
      fontFamily: fontFamily.bold,
      color: c.text,
      fontSize: fontSize.lg,
      minWidth: 20,
      textAlign: 'center',
    },
    pressed: {
      opacity: 0.7,
    },
  });
