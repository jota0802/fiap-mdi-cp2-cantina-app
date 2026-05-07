import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { fontFamily, fontSize, radius, spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useCantina } from '@/context/CantinaContext';
import { useTheme } from '@/context/ThemeContext';
import { apiFetch } from '@/lib/api/client';
import type { ThemeColors } from '@/types';
import type { TenantTree, UnidadePublic } from '@cantina/shared';

export default function TrocarUnidade() {
  const { updateMe } = useAuth();
  const { setCurrent } = useCantina();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [tree, setTree] = useState<TenantTree | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const data = await apiFetch<TenantTree>('/tenants/tree', { auth: false });
        setTree(data);
      } catch {
        setFetchError('Falha ao carregar unidades');
      }
    })();
  }, []);

  function handleSelect(unidade: UnidadePublic) {
    Alert.alert(
      'Trocar unidade?',
      `Sua cantina default será limpa. Você precisará escolher uma nova cantina em "${unidade.nome}".`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Trocar',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await updateMe({ cantinaId: null });
              await setCurrent(null);
              router.replace(`/perfil/cantina-default?unidadeId=${unidade.id}`);
            } catch (err) {
              Alert.alert('Erro', err instanceof Error ? err.message : 'Falha ao trocar unidade');
            } finally {
              setLoading(false);
            }
          },
        },
      ],
    );
  }

  if (fetchError) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: insets.top + spacing.lg }]}>
        <Text style={styles.errorText}>{fetchError}</Text>
      </View>
    );
  }

  if (!tree) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: insets.top + spacing.lg }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.lg }]}>
      <Text style={styles.title}>Trocar unidade</Text>
      <Text style={styles.subtitle}>
        Ao trocar, sua cantina default será redefinida.
      </Text>
      <FlatList
        data={tree.unidades}
        keyExtractor={(u) => u.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Pressable
            style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
            onPress={() => handleSelect(item)}
            disabled={loading}
            accessibilityRole="button"
            accessibilityLabel={item.nome}
          >
            <View style={styles.itemContent}>
              <Text style={styles.itemNome}>{item.nome}</Text>
              <Text style={styles.itemDetalhe}>
                {item.escolas.length} escola{item.escolas.length !== 1 ? 's' : ''}
              </Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        )}
      />
    </View>
  );
}

function createStyles(c: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.bg,
      paddingHorizontal: spacing.xl,
    },
    centered: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    title: {
      fontFamily: fontFamily.extrabold,
      fontSize: fontSize['3xl'],
      color: c.text,
      marginBottom: spacing.sm,
    },
    subtitle: {
      fontFamily: fontFamily.medium,
      fontSize: fontSize.md,
      color: c.textMuted,
      marginBottom: spacing.xl,
    },
    list: {
      gap: spacing.sm,
    },
    item: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: spacing.lg,
      backgroundColor: c.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: c.border,
    },
    itemPressed: {
      opacity: 0.85,
      transform: [{ scale: 0.98 }],
    },
    itemContent: {
      flex: 1,
    },
    itemNome: {
      fontFamily: fontFamily.semibold,
      fontSize: fontSize.base,
      color: c.text,
    },
    itemDetalhe: {
      fontFamily: fontFamily.regular,
      fontSize: fontSize.md,
      color: c.textMuted,
      marginTop: 2,
    },
    chevron: {
      fontFamily: fontFamily.bold,
      fontSize: fontSize.xl,
      color: c.textMuted,
      marginLeft: spacing.sm,
    },
    errorText: {
      fontFamily: fontFamily.medium,
      fontSize: fontSize.base,
      color: c.error,
    },
  });
}
