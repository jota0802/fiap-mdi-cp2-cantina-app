import { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import LoadingScreen from '@/components/LoadingScreen';
import ProfileAvatar from '@/components/ProfileAvatar';
import Toast from '@/components/Toast';
import { useAuth } from '@/context/AuthContext';
import { useOrders } from '@/context/OrdersContext';
import { useTheme } from '@/context/ThemeContext';
import { haptic } from '@/lib/haptics';
import { pickFromCamera, pickFromLibrary } from '@/lib/image-picker';
import { fontFamily, fontSize, letterSpacing, radius, spacing } from '@/constants/theme';
import type { ThemeColors } from '@/types';

export default function PerfilScreen() {
  const router = useRouter();
  const { colors, mode, toggleTheme } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const { user, signOut, updateUser } = useAuth();
  const { orders } = useOrders();

  const [updatingPhoto, setUpdatingPhoto] = useState(false);
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    variant: 'success' | 'error';
  }>({ visible: false, message: '', variant: 'success' });

  if (!user) {
    return <LoadingScreen label="CARREGANDO PERFIL" />;
  }

  const totalPedidos = orders.length;
  const pedidosAtivos = orders.filter((o) => o.status !== 'retirado').length;

  const showToast = (message: string, variant: 'success' | 'error' = 'success') => {
    setToast({ visible: true, message, variant });
  };

  const handlePickFromLibrary = async () => {
    setUpdatingPhoto(true);
    try {
      const picked = await pickFromLibrary();
      if (picked) {
        await updateUser({ fotoUri: picked.uri });
        showToast('Foto atualizada!');
      }
    } catch {
      showToast('Não foi possível atualizar a foto', 'error');
    } finally {
      setUpdatingPhoto(false);
    }
  };

  const handlePickFromCamera = async () => {
    setUpdatingPhoto(true);
    try {
      const picked = await pickFromCamera();
      if (picked) {
        await updateUser({ fotoUri: picked.uri });
        showToast('Foto atualizada!');
      }
    } catch {
      showToast('Não foi possível abrir a câmera', 'error');
    } finally {
      setUpdatingPhoto(false);
    }
  };

  const handleRemoveFoto = async () => {
    setUpdatingPhoto(true);
    try {
      await updateUser({ fotoUri: undefined });
      showToast('Foto removida');
    } finally {
      setUpdatingPhoto(false);
    }
  };

  const handleLogout = async () => {
    haptic.medium();
    await signOut();
    router.replace('/login');
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + spacing.lg }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <ProfileAvatar uri={user.fotoUri} nome={user.nome} size={104} />
          <Text style={styles.nome}>{user.nome.toUpperCase()}</Text>
          <Text style={styles.email}>{user.email}</Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValor}>{totalPedidos}</Text>
            <Text style={styles.statLabel}>PEDIDOS</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValor}>{pedidosAtivos}</Text>
            <Text style={styles.statLabel}>ATIVOS</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitulo}>FOTO DE PERFIL</Text>
          <View style={styles.fotoBotoes}>
            <Pressable
              style={({ pressed }) => [styles.fotoBotao, pressed && styles.pressed]}
              onPress={handlePickFromCamera}
              disabled={updatingPhoto}
            >
              <Ionicons name="camera-outline" size={20} color={colors.primary} />
              <Text style={styles.fotoBotaoTexto}>TIRAR FOTO</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.fotoBotao, pressed && styles.pressed]}
              onPress={handlePickFromLibrary}
              disabled={updatingPhoto}
            >
              <Ionicons name="images-outline" size={20} color={colors.primary} />
              <Text style={styles.fotoBotaoTexto}>GALERIA</Text>
            </Pressable>
            {user.fotoUri ? (
              <Pressable
                style={({ pressed }) => [styles.fotoBotao, pressed && styles.pressed]}
                onPress={handleRemoveFoto}
                disabled={updatingPhoto}
              >
                <Ionicons name="trash-outline" size={20} color={colors.error} />
                <Text style={[styles.fotoBotaoTexto, { color: colors.error }]}>REMOVER</Text>
              </Pressable>
            ) : null}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitulo}>APARÊNCIA</Text>
          <View style={styles.linhaToggle}>
            <View style={styles.linhaToggleInfo}>
              <Ionicons
                name={mode === 'dark' ? 'moon' : 'sunny'}
                size={20}
                color={colors.primary}
              />
              <View>
                <Text style={styles.linhaToggleLabel}>
                  {mode === 'dark' ? 'TEMA ESCURO' : 'TEMA CLARO'}
                </Text>
                <Text style={styles.linhaToggleSub}>
                  {mode === 'dark'
                    ? 'Ative o modo claro para ambientes iluminados'
                    : 'Ative o modo escuro para reduzir o brilho'}
                </Text>
              </View>
            </View>
            <Switch
              value={mode === 'dark'}
              onValueChange={toggleTheme}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#ffffff"
              ios_backgroundColor={colors.border}
            />
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitulo}>AÇÕES</Text>

          <Pressable
            style={({ pressed }) => [styles.linhaAcao, pressed && styles.pressed]}
            onPress={() => router.push('/sobre')}
          >
            <View style={styles.linhaAcaoInfo}>
              <Ionicons name="information-circle-outline" size={20} color={colors.text} />
              <Text style={styles.linhaAcaoLabel}>SOBRE O PROJETO</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textSubtle} />
          </Pressable>

          <View style={styles.divisor} />

          <Pressable
            style={({ pressed }) => [styles.linhaAcao, pressed && styles.pressed]}
            onPress={handleLogout}
          >
            <View style={styles.linhaAcaoInfo}>
              <Ionicons name="log-out-outline" size={20} color={colors.error} />
              <Text style={[styles.linhaAcaoLabel, { color: colors.error }]}>SAIR</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.error} />
          </Pressable>
        </View>

        <Text style={styles.footerHint}>
          Suas credenciais ficam armazenadas com segurança no seu dispositivo
        </Text>
      </ScrollView>

      <Toast
        message={toast.message}
        variant={toast.variant}
        visible={toast.visible}
        onHide={() => setToast((p) => ({ ...p, visible: false }))}
      />
    </View>
  );
}

const createStyles = (c: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: c.bg },
    scrollContent: {
      paddingBottom: spacing['4xl'],
    },
    header: {
      alignItems: 'center',
      gap: spacing.sm,
      paddingHorizontal: spacing.xl,
      marginBottom: spacing['2xl'],
    },
    nome: {
      fontFamily: fontFamily.extrabold,
      fontSize: fontSize.xl,
      color: c.text,
      letterSpacing: letterSpacing.wider,
      marginTop: spacing.md,
    },
    email: {
      fontFamily: fontFamily.medium,
      fontSize: fontSize.md,
      color: c.textMuted,
    },
    statsRow: {
      flexDirection: 'row',
      gap: spacing.md,
      paddingHorizontal: spacing.xl,
      marginBottom: spacing['2xl'],
    },
    statBox: {
      flex: 1,
      backgroundColor: c.card,
      borderRadius: radius.lg,
      padding: spacing.lg,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: c.border,
    },
    statValor: {
      fontFamily: fontFamily.extrabold,
      fontSize: fontSize['3xl'] - 4,
      color: c.primary,
    },
    statLabel: {
      fontFamily: fontFamily.semibold,
      fontSize: fontSize.xs,
      color: c.textSubtle,
      letterSpacing: letterSpacing.wider,
      marginTop: spacing.xs,
    },
    card: {
      backgroundColor: c.card,
      marginHorizontal: spacing.xl,
      marginBottom: spacing.md,
      borderRadius: radius.lg,
      padding: spacing.xl,
      borderWidth: 1,
      borderColor: c.border,
    },
    cardTitulo: {
      fontFamily: fontFamily.extrabold,
      fontSize: fontSize.sm,
      color: c.primary,
      letterSpacing: letterSpacing.wider,
      marginBottom: spacing.lg,
    },
    fotoBotoes: {
      gap: spacing.sm,
    },
    fotoBotao: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      backgroundColor: c.cardElevated,
      paddingVertical: spacing.md + 2,
      paddingHorizontal: spacing.lg,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: c.border,
    },
    fotoBotaoTexto: {
      fontFamily: fontFamily.bold,
      fontSize: fontSize.sm,
      color: c.text,
      letterSpacing: letterSpacing.wide,
    },
    linhaToggle: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.md,
    },
    linhaToggleInfo: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
    linhaToggleLabel: {
      fontFamily: fontFamily.bold,
      fontSize: fontSize.md,
      color: c.text,
      letterSpacing: letterSpacing.normal,
    },
    linhaToggleSub: {
      fontFamily: fontFamily.regular,
      fontSize: fontSize.sm,
      color: c.textMuted,
      marginTop: 2,
      maxWidth: 220,
    },
    linhaAcao: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing.md,
    },
    linhaAcaoInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
    linhaAcaoLabel: {
      fontFamily: fontFamily.bold,
      fontSize: fontSize.md,
      color: c.text,
      letterSpacing: letterSpacing.normal,
    },
    divisor: {
      height: 1,
      backgroundColor: c.border,
    },
    pressed: {
      opacity: 0.6,
    },
    footerHint: {
      fontFamily: fontFamily.regular,
      fontSize: fontSize.sm,
      color: c.textSubtle,
      textAlign: 'center',
      paddingHorizontal: spacing['2xl'],
      marginTop: spacing.lg,
    },
  });
