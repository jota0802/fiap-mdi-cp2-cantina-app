import { useMemo, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, Animated } from 'react-native';

import { useTheme } from '@/context/ThemeContext';
import { haptic } from '@/lib/haptics';
import { fontFamily, fontSize, radius, spacing } from '@/constants/theme';
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
  const ativo = quantidade > 0;

  const scale = useRef(new Animated.Value(1)).current;
  const animatePop = () => {
    Animated.sequence([
      Animated.timing(scale, { toValue: 1.12, duration: 90, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 8 }),
    ]).start();
  };

  return (
    <View style={[styles.container, ativo && styles.containerAtivo]}>
      <View style={styles.emojiContainer}>
        <Text style={styles.emoji}>{item.emoji}</Text>
      </View>

      <View style={styles.info}>
        <Text style={styles.nome} numberOfLines={1}>
          {item.nome}
        </Text>
        <Text style={styles.descricao} numberOfLines={2}>
          {item.descricao}
        </Text>
        <Text style={styles.preco}>R$ {item.preco.toFixed(2)}</Text>
      </View>

      <View style={styles.controles}>
        {ativo ? (
          <Pressable
            style={({ pressed }) => [styles.botaoMenos, pressed && styles.pressed]}
            onPress={() => {
              haptic.light();
              onRemover(item.id);
              animatePop();
            }}
            hitSlop={8}
          >
            <Text style={styles.botaoMenosTexto}>−</Text>
          </Pressable>
        ) : null}

        {ativo ? (
          <Animated.Text style={[styles.quantidade, { transform: [{ scale }] }]}>
            {quantidade}
          </Animated.Text>
        ) : null}

        <Pressable
          style={({ pressed }) => [styles.botaoMais, pressed && styles.pressed]}
          onPress={() => {
            haptic.light();
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
      backgroundColor: c.surface,
      borderRadius: radius.lg,
      padding: spacing.md,
      marginBottom: spacing.sm,
      borderWidth: 1,
      borderColor: c.border,
      gap: spacing.md,
    },
    containerAtivo: {
      borderColor: c.primary,
      backgroundColor: c.primarySoft,
    },
    emojiContainer: {
      width: 52,
      height: 52,
      borderRadius: radius.md,
      backgroundColor: c.surfaceElevated,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emoji: { fontSize: 26 },
    info: {
      flex: 1,
    },
    nome: {
      fontFamily: fontFamily.semibold,
      fontSize: fontSize.base,
      color: c.text,
    },
    descricao: {
      fontFamily: fontFamily.regular,
      fontSize: fontSize.md,
      color: c.textMuted,
      marginTop: 2,
      lineHeight: 17,
    },
    preco: {
      fontFamily: fontFamily.bold,
      fontSize: fontSize.base,
      color: c.text,
      marginTop: spacing.xs,
    },
    controles: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
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
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: c.surfaceElevated,
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
