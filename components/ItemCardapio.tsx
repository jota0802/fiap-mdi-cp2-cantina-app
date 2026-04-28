import { useMemo, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import ItemThumbnail from '@/components/ItemThumbnail';
import { useFavorites } from '@/context/FavoritesContext';
import { useTheme } from '@/context/ThemeContext';
import { haptic } from '@/lib/haptics';
import {
  fontFamily,
  fontSize,
  radius,
  spacing,
  tagPalette,
} from '@/constants/theme';
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
  const { isFavorito, toggleFavorito } = useFavorites();
  const ativo = quantidade > 0;
  const favorito = isFavorito(item.id);

  const scale = useRef(new Animated.Value(1)).current;
  const heartScale = useRef(new Animated.Value(1)).current;

  const animatePop = () => {
    Animated.sequence([
      Animated.timing(scale, { toValue: 1.12, duration: 90, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 8 }),
    ]).start();
  };

  const animateHeart = () => {
    Animated.sequence([
      Animated.timing(heartScale, { toValue: 1.3, duration: 110, useNativeDriver: true }),
      Animated.spring(heartScale, {
        toValue: 1,
        useNativeDriver: true,
        speed: 28,
        bounciness: 10,
      }),
    ]).start();
  };

  const handleHeart = () => {
    haptic.light();
    toggleFavorito(item.id);
    animateHeart();
  };

  return (
    <View style={[styles.container, ativo && styles.containerAtivo]}>
      <ItemThumbnail
        emoji={item.emoji}
        imagem={item.imagem}
        size={52}
        borderRadius={radius.md}
        bgColor={colors.surfaceElevated}
      />

      <View style={styles.info}>
        <View style={styles.nomeRow}>
          <Text style={styles.nome} numberOfLines={1}>
            {item.nome}
          </Text>
          <Pressable
            onPress={handleHeart}
            hitSlop={8}
            style={styles.heartButton}
            accessibilityRole="button"
            accessibilityLabel={
              favorito
                ? `Remover ${item.nome} dos favoritos`
                : `Adicionar ${item.nome} aos favoritos`
            }
          >
            <Animated.View style={{ transform: [{ scale: heartScale }] }}>
              <Ionicons
                name={favorito ? 'heart' : 'heart-outline'}
                size={18}
                color={favorito ? colors.error : colors.textSubtle}
              />
            </Animated.View>
          </Pressable>
        </View>
        <Text style={styles.descricao} numberOfLines={2}>
          {item.descricao}
        </Text>
        {item.tags && item.tags.length > 0 ? (
          <View style={styles.tagsRow}>
            {item.tags.slice(0, 3).map((tag) => {
              const t = tagPalette[tag];
              return (
                <View key={tag} style={[styles.tagChip, { backgroundColor: t.bg }]}>
                  <Text style={[styles.tagTexto, { color: t.color }]}>{t.label}</Text>
                </View>
              );
            })}
          </View>
        ) : null}
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
            accessibilityRole="button"
            accessibilityLabel={`Diminuir quantidade de ${item.nome}`}
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
          accessibilityRole="button"
          accessibilityLabel={
            ativo
              ? `Aumentar quantidade de ${item.nome}`
              : `Adicionar ${item.nome} ao carrinho`
          }
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
    info: {
      flex: 1,
    },
    nomeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    nome: {
      flex: 1,
      fontFamily: fontFamily.semibold,
      fontSize: fontSize.base,
      color: c.text,
    },
    heartButton: {
      padding: 2,
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
    tagsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 4,
      marginTop: spacing.xs,
    },
    tagChip: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: radius.sm,
    },
    tagTexto: {
      fontFamily: fontFamily.semibold,
      fontSize: 10,
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
