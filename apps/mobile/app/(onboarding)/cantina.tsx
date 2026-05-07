import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import Button from '@/components/Button';
import { useAuth } from '@/context/AuthContext';
import { useCantina } from '@/context/CantinaContext';
import { useTheme } from '@/context/ThemeContext';
import { apiFetch } from '@/lib/api/client';
import type { ThemeColors } from '@/types';
import type { CantinaPublic, TenantTree, UnidadePublic } from '@cantina/shared';

type CantinaWithEscola = CantinaPublic & { escolaNome: string };

export default function CantinaSelect() {
  const { colors } = useTheme();
  const { updateMe } = useAuth();
  const { setCurrent } = useCantina();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const params = useLocalSearchParams<{ name: string; rm: string }>();

  const [tree, setTree] = useState<TenantTree | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [unidadeId, setUnidadeId] = useState<string>('');
  const [cantinaId, setCantinaId] = useState<string>('');
  const [unidadeOpen, setUnidadeOpen] = useState(false);
  const [cantinaOpen, setCantinaOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

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

  const unidadeSelected = useMemo<UnidadePublic | undefined>(() => {
    return tree?.unidades.find((u) => u.id === unidadeId);
  }, [tree, unidadeId]);

  const cantinasDaUnidade = useMemo<CantinaWithEscola[]>(() => {
    if (!unidadeSelected) return [];
    return unidadeSelected.escolas.flatMap((e) =>
      e.cantinas.map((c) => ({ ...c, escolaNome: e.nome }))
    );
  }, [unidadeSelected]);

  const cantinaSelected = cantinasDaUnidade.find((c) => c.id === cantinaId);

  async function handleConcluir() {
    if (!cantinaId) return;
    setLoading(true);
    setSubmitError(null);
    try {
      await updateMe({
        name: params.name,
        rm: params.rm,
        cantinaId,
      });
      await setCurrent(cantinaId);
      router.replace('/(tabs)');
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Erro ao salvar dados');
    } finally {
      setLoading(false);
    }
  }

  if (fetchError) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.errorText}>{fetchError}</Text>
      </View>
    );
  }

  if (!tree) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Sua cantina</Text>

        <Text style={styles.label}>Unidade</Text>
        <Pressable style={styles.select} onPress={() => setUnidadeOpen(true)}>
          <Text style={styles.selectText}>{unidadeSelected?.nome ?? 'Selecione...'}</Text>
          <Text style={styles.chevron}>▾</Text>
        </Pressable>

        <Text style={styles.label}>Cantina</Text>
        <Pressable
          style={[styles.select, !unidadeId && styles.selectDisabled]}
          onPress={() => { if (unidadeId) setCantinaOpen(true); }}
          disabled={!unidadeId}
        >
          <Text style={styles.selectText}>
            {cantinaSelected
              ? `${cantinaSelected.escolaNome} — ${cantinaSelected.nome}`
              : 'Selecione...'}
          </Text>
          <Text style={styles.chevron}>▾</Text>
        </Pressable>

        {submitError ? <Text style={styles.errorText}>{submitError}</Text> : null}
      </View>

      <Button title="Concluir" onPress={handleConcluir} disabled={!cantinaId || loading} loading={loading} />

      {/* Modal Unidade */}
      <Modal
        visible={unidadeOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setUnidadeOpen(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setUnidadeOpen(false)}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Escolher unidade</Text>
            <FlatList
              data={tree.unidades}
              keyExtractor={(u) => u.id}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.option}
                  onPress={() => {
                    setUnidadeId(item.id);
                    setCantinaId('');
                    setUnidadeOpen(false);
                  }}
                >
                  <Text style={styles.optionText}>{item.nome}</Text>
                </Pressable>
              )}
            />
          </View>
        </Pressable>
      </Modal>

      {/* Modal Cantina */}
      <Modal
        visible={cantinaOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setCantinaOpen(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setCantinaOpen(false)}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Escolher cantina</Text>
            <FlatList
              data={cantinasDaUnidade}
              keyExtractor={(c) => c.id}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.option}
                  onPress={() => {
                    setCantinaId(item.id);
                    setCantinaOpen(false);
                  }}
                >
                  <Text style={styles.optionText}>
                    {item.escolaNome} — {item.nome}
                  </Text>
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
    container: { flex: 1, backgroundColor: c.bg, padding: 24, justifyContent: 'space-between' },
    centered: { justifyContent: 'center', alignItems: 'center' },
    content: { flex: 1, justifyContent: 'center' },
    title: { fontSize: 28, fontWeight: '700', color: c.text, marginBottom: 24 },
    label: { fontSize: 14, fontWeight: '600', color: c.textMuted, marginTop: 16, marginBottom: 8 },
    select: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: c.surface,
      padding: 16,
      borderRadius: 8,
    },
    selectDisabled: { opacity: 0.4 },
    selectText: { fontSize: 16, color: c.text },
    chevron: { fontSize: 14, color: c.textMuted },
    errorText: { color: c.error, marginTop: 16 },
    backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
    sheet: {
      backgroundColor: c.surface,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: 16,
      maxHeight: '70%',
    },
    sheetTitle: { fontSize: 18, fontWeight: '700', color: c.text, marginBottom: 12 },
    option: { padding: 16, borderRadius: 8 },
    optionText: { fontSize: 16, color: c.text },
  });
}
