import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { fontFamily, fontSize, radius, spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useCantina } from '@/context/CantinaContext';
import { useTheme } from '@/context/ThemeContext';
import { apiFetch } from '@/lib/api/client';
import type { ThemeColors } from '@/types';
import type { CantinaPublic, TenantTree } from '@cantina/shared';

export default function CantinaDefault() {
  const { user, updateMe } = useAuth();
  const { setCurrent } = useCantina();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const params = useLocalSearchParams<{ unidadeId?: string }>();

  const [tree, setTree] = useState<TenantTree | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const data = await apiFetch<TenantTree>('/tenants/tree', { auth: false });
        setTree(data);
      } catch {
        setFetchError('Falha ao carregar cantinas');
      }
    })();
  }, []);

  // unidadeId: vem do param (quando vindo da tela de unidade) OU deriva do user.cantinaId
  const targetUnidadeId = useMemo<string | null>(() => {
    if (params.unidadeId) return params.unidadeId;
    if (!tree || !user?.cantinaId) return null;
    for (const u of tree.unidades) {
      for (const e of u.escolas) {
        if (e.cantinas.some((c) => c.id === user.cantinaId)) return u.id;
      }
    }
    return null;
  }, [tree, user?.cantinaId, params.unidadeId]);

  const cantinas = useMemo<CantinaPublic[]>(() => {
    if (!tree || !targetUnidadeId) return [];
    const u = tree.unidades.find((un) => un.id === targetUnidadeId);
    return u?.escolas.flatMap((e) => e.cantinas) ?? [];
  }, [tree, targetUnidadeId]);

  async function handleSelect(cantinaId: string) {
    setLoading(true);
    try {
      await updateMe({ cantinaId });
      await setCurrent(cantinaId);
      router.replace('/(tabs)');
    } catch {
      // erro ignorado — retry pressionando novamente
    } finally {
      setLoading(false);
    }
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
      <Text style={styles.title}>Escolher cantina default</Text>
      <Text style={styles.subtitle}>
        A cantina selecionada será usada como padrão ao abrir o app.
      </Text>
      <FlatList
        data={cantinas}
        keyExtractor={(c) => c.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>Nenhuma cantina encontrada para esta unidade.</Text>
        }
        renderItem={({ item }) => (
          <Pressable
            style={({ pressed }) => [
              styles.item,
              item.id === user?.cantinaId && styles.itemSelecionado,
              pressed && styles.itemPressed,
            ]}
            onPress={() => void handleSelect(item.id)}
            disabled={loading}
            accessibilityRole="button"
            accessibilityLabel={item.nome}
            accessibilityState={{ selected: item.id === user?.cantinaId }}
          >
            <Text style={styles.itemNome}>{item.nome}</Text>
            {item.id === user?.cantinaId ? (
              <Text style={styles.checkmark}>✓</Text>
            ) : null}
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
    itemSelecionado: {
      borderColor: c.primary,
      backgroundColor: c.primarySoft,
    },
    itemPressed: {
      opacity: 0.85,
      transform: [{ scale: 0.98 }],
    },
    itemNome: {
      fontFamily: fontFamily.semibold,
      fontSize: fontSize.base,
      color: c.text,
      flex: 1,
    },
    checkmark: {
      fontFamily: fontFamily.bold,
      fontSize: fontSize.lg,
      color: c.primary,
      marginLeft: spacing.sm,
    },
    empty: {
      fontFamily: fontFamily.medium,
      fontSize: fontSize.base,
      color: c.textMuted,
      textAlign: 'center',
      marginTop: spacing.xl,
    },
    errorText: {
      fontFamily: fontFamily.medium,
      fontSize: fontSize.base,
      color: c.error,
    },
  });
}
