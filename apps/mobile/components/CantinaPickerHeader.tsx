import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useAuth } from '@/context/AuthContext';
import { useCantina } from '@/context/CantinaContext';
import { useTheme } from '@/context/ThemeContext';
import { apiFetch } from '@/lib/api/client';
import { fontFamily, fontSize, radius, spacing } from '@/constants/theme';
import type { ThemeColors } from '@/types';
import type { CantinaPublic, TenantTree } from '@cantina/shared';

export function CantinaPickerHeader() {
  const { user } = useAuth();
  const { currentCantinaId, setCurrent } = useCantina();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [tree, setTree] = useState<TenantTree | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const data = await apiFetch<TenantTree>('/tenants/tree', { auth: false });
        setTree(data);
      } catch {
        // silently ignore — header just won't show picker
      }
    })();
  }, []);

  // Cantinas da unidade do user (deriva via cantinaId default → escola → unidade)
  const cantinasDaUnidade = useMemo<CantinaPublic[]>(() => {
    if (!tree || !user?.cantinaId) return [];
    for (const u of tree.unidades) {
      for (const e of u.escolas) {
        if (e.cantinas.some((c) => c.id === user.cantinaId)) {
          return u.escolas.flatMap((es) => es.cantinas);
        }
      }
    }
    return [];
  }, [tree, user?.cantinaId]);

  const currentCantina = cantinasDaUnidade.find((c) => c.id === currentCantinaId);

  async function handlePick(id: string) {
    await setCurrent(id);
    setOpen(false);
  }

  return (
    <View style={styles.header}>
      <Pressable
        onPress={() => router.push('/perfil/unidade')}
        hitSlop={8}
        accessibilityRole="link"
        accessibilityLabel="Mudar unidade"
      >
        <Text style={styles.linkSecondary}>Mudar unidade</Text>
      </Pressable>

      <Pressable
        style={styles.picker}
        onPress={() => setOpen(true)}
        disabled={cantinasDaUnidade.length === 0}
        accessibilityRole="button"
        accessibilityLabel={`Cantina: ${currentCantina?.nome ?? 'Selecionar'}`}
      >
        <Text style={styles.pickerLabel} numberOfLines={1}>
          {currentCantina?.nome ?? 'Selecionar'}
        </Text>
        <Text style={styles.chevron}>▾</Text>
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="slide"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Escolher cantina</Text>
            <FlatList
              data={cantinasDaUnidade}
              keyExtractor={(c) => c.id}
              renderItem={({ item }) => (
                <Pressable
                  style={[styles.option, item.id === currentCantinaId && styles.optionSelected]}
                  onPress={() => void handlePick(item.id)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: item.id === currentCantinaId }}
                >
                  <Text style={styles.optionText}>{item.nome}</Text>
                  {item.id === currentCantinaId ? (
                    <Text style={styles.optionCheck}>✓</Text>
                  ) : null}
                </Pressable>
              )}
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

function createStyles(c: ThemeColors) {
  return StyleSheet.create({
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.md,
      paddingBottom: spacing.sm,
    },
    linkSecondary: {
      fontFamily: fontFamily.medium,
      fontSize: fontSize.md,
      color: c.textMuted,
      textDecorationLine: 'underline',
    },
    picker: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: c.surface,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm + 2,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: c.border,
      maxWidth: '60%',
    },
    pickerLabel: {
      fontFamily: fontFamily.semibold,
      fontSize: fontSize.base,
      color: c.text,
      flex: 1,
    },
    chevron: {
      fontFamily: fontFamily.regular,
      fontSize: fontSize.md,
      color: c.textMuted,
    },
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.4)',
      justifyContent: 'flex-end',
    },
    sheet: {
      backgroundColor: c.surface,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: spacing.lg,
      maxHeight: '70%',
    },
    sheetTitle: {
      fontFamily: fontFamily.bold,
      fontSize: fontSize.xl,
      color: c.text,
      marginBottom: spacing.md,
    },
    option: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: spacing.md,
      borderRadius: radius.md,
    },
    optionSelected: {
      backgroundColor: c.primarySoft,
    },
    optionText: {
      fontFamily: fontFamily.medium,
      fontSize: fontSize.base,
      color: c.text,
      flex: 1,
    },
    optionCheck: {
      fontFamily: fontFamily.bold,
      fontSize: fontSize.base,
      color: c.primary,
      marginLeft: spacing.sm,
    },
  });
}
