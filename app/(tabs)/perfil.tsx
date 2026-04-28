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
import {
  fontFamily,
  fontSize,
  radius,
  shadow,
  spacing,
} from '@/constants/theme';
import type { ThemeColors } from '@/types';

function formatarDataMembro(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
  } catch {
    return '—';
  }
}

function primeiroNome(nome: string): string {
  return nome.trim().split(' ')[0] ?? nome;
}

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
    return <LoadingScreen label="Carregando perfil" />;
  }

  const totalPedidos = orders.length;
  const pedidosAtivos = orders.filter((o) => o.status !== 'retirado').length;
  const totalGasto = orders.reduce((acc, o) => acc + o.total, 0);

  const showToast = (message: string, variant: 'success' | 'error' = 'success') => {
    setToast({ visible: true, message, variant });
  };

  const handlePickFromLibrary = async () => {
    setUpdatingPhoto(true);
    try {
      const picked = await pickFromLibrary();
      if (picked) {
        await updateUser({ fotoUri: picked.uri });
        showToast('Foto atualizada');
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
        showToast('Foto atualizada');
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
        {/* Header com subtítulo */}
        <View style={styles.header}>
          <Text style={styles.tituloPagina}>Perfil</Text>
          <Text style={styles.subtitulo}>
            Olá, {primeiroNome(user.nome)} · membro desde{' '}
            {formatarDataMembro(user.criadoEm)}
          </Text>
        </View>

        {/* Card hero do usuário com foto editável */}
        <View style={styles.userCard}>
          <Pressable
            onPress={handlePickFromLibrary}
            disabled={updatingPhoto}
            style={({ pressed }) => [styles.avatarPressable, pressed && styles.pressedSoft]}
            accessibilityRole="button"
            accessibilityLabel="Trocar foto de perfil"
          >
            <ProfileAvatar uri={user.fotoUri} nome={user.nome} size={64} />
            <View style={styles.avatarBadge}>
              <Ionicons name="camera" size={12} color={colors.primaryText} />
            </View>
          </Pressable>
          <View style={styles.userInfo}>
            <Text style={styles.userNome} numberOfLines={1}>
              {user.nome}
            </Text>
            <Text style={styles.userEmail} numberOfLines={1}>
              {user.email}
            </Text>
          </View>
        </View>

        {/* Bento de stats: 3 cards */}
        <View style={styles.statsBento}>
          <StatCard
            label="Pedidos"
            valor={String(totalPedidos)}
            icon="receipt-outline"
            colors={colors}
            styles={styles}
          />
          <StatCard
            label="Ativos"
            valor={String(pedidosAtivos)}
            icon="time-outline"
            colors={colors}
            styles={styles}
            destaque={pedidosAtivos > 0}
          />
          <StatCard
            label="Total"
            valor={`R$ ${totalGasto.toFixed(0)}`}
            icon="cash-outline"
            colors={colors}
            styles={styles}
          />
        </View>

        {/* Foto de perfil — apenas botões secundários */}
        <Text style={styles.sectionTitle}>Foto de perfil</Text>
        <View style={styles.fotoBento}>
          <Pressable
            style={({ pressed }) => [styles.fotoBotao, pressed && styles.pressedSoft]}
            onPress={handlePickFromCamera}
            disabled={updatingPhoto}
            accessibilityRole="button"
            accessibilityLabel="Tirar foto com a câmera"
          >
            <View style={styles.fotoIconWrap}>
              <Ionicons name="camera-outline" size={18} color={colors.primary} />
            </View>
            <Text style={styles.fotoBotaoTexto}>Câmera</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.fotoBotao, pressed && styles.pressedSoft]}
            onPress={handlePickFromLibrary}
            disabled={updatingPhoto}
            accessibilityRole="button"
            accessibilityLabel="Escolher foto da galeria"
          >
            <View style={styles.fotoIconWrap}>
              <Ionicons name="images-outline" size={18} color={colors.primary} />
            </View>
            <Text style={styles.fotoBotaoTexto}>Galeria</Text>
          </Pressable>

          {user.fotoUri ? (
            <Pressable
              style={({ pressed }) => [styles.fotoBotao, pressed && styles.pressedSoft]}
              onPress={handleRemoveFoto}
              disabled={updatingPhoto}
              accessibilityRole="button"
              accessibilityLabel="Remover foto de perfil"
            >
              <View style={[styles.fotoIconWrap, { backgroundColor: 'rgba(248, 113, 113, 0.14)' }]}>
                <Ionicons name="trash-outline" size={18} color={colors.error} />
              </View>
              <Text style={[styles.fotoBotaoTexto, { color: colors.error }]}>Remover</Text>
            </Pressable>
          ) : null}
        </View>

        {/* Aparência */}
        <Text style={styles.sectionTitle}>Aparência</Text>
        <View style={styles.themeCard}>
          <View style={styles.themeInfo}>
            <View style={styles.themeIconWrap}>
              <Ionicons
                name={mode === 'dark' ? 'moon' : 'sunny'}
                size={18}
                color={colors.primary}
              />
            </View>
            <View style={styles.themeTextos}>
              <Text style={styles.themeLabel}>
                {mode === 'dark' ? 'Tema escuro' : 'Tema claro'}
              </Text>
              <Text style={styles.themeSub}>
                {mode === 'dark'
                  ? 'Ative o claro pra ambientes iluminados'
                  : 'Ative o escuro pra reduzir o brilho'}
              </Text>
            </View>
          </View>
          <Switch
            value={mode === 'dark'}
            onValueChange={toggleTheme}
            trackColor={{ false: colors.borderStrong, true: colors.primary }}
            thumbColor="#ffffff"
            ios_backgroundColor={colors.borderStrong}
          />
        </View>

        {/* Ações */}
        <Text style={styles.sectionTitle}>Conta</Text>
        <View style={styles.acoesCard}>
          <Pressable
            style={({ pressed }) => [styles.linhaAcao, pressed && styles.pressedSoft]}
            onPress={() => router.push('/perfil-editar')}
            accessibilityRole="button"
            accessibilityLabel="Editar dados do perfil"
          >
            <View style={styles.linhaAcaoEsquerda}>
              <View style={[styles.linhaAcaoIconWrap, { backgroundColor: colors.primarySoft }]}>
                <Ionicons name="create-outline" size={18} color={colors.primary} />
              </View>
              <View>
                <Text style={styles.linhaAcaoLabel}>Editar dados</Text>
                <Text style={styles.linhaAcaoSub}>Alterar nome ou e-mail</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textSubtle} />
          </Pressable>

          <View style={styles.divisor} />

          <Pressable
            style={({ pressed }) => [styles.linhaAcao, pressed && styles.pressedSoft]}
            onPress={() => router.push('/sobre')}
            accessibilityRole="button"
            accessibilityLabel="Sobre o projeto"
          >
            <View style={styles.linhaAcaoEsquerda}>
              <View style={styles.linhaAcaoIconWrap}>
                <Ionicons name="information-circle-outline" size={18} color={colors.text} />
              </View>
              <View>
                <Text style={styles.linhaAcaoLabel}>Sobre o projeto</Text>
                <Text style={styles.linhaAcaoSub}>Equipe, stack e detalhes</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textSubtle} />
          </Pressable>

          <View style={styles.divisor} />

          <Pressable
            style={({ pressed }) => [styles.linhaAcao, pressed && styles.pressedSoft]}
            onPress={handleLogout}
            accessibilityRole="button"
            accessibilityLabel="Sair da conta"
          >
            <View style={styles.linhaAcaoEsquerda}>
              <View style={[styles.linhaAcaoIconWrap, { backgroundColor: 'rgba(248, 113, 113, 0.14)' }]}>
                <Ionicons name="log-out-outline" size={18} color={colors.error} />
              </View>
              <View>
                <Text style={[styles.linhaAcaoLabel, { color: colors.error }]}>Sair</Text>
                <Text style={styles.linhaAcaoSub}>Encerrar sessão</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.error} />
          </Pressable>
        </View>

        <Text style={styles.footerHint}>
          Suas credenciais ficam protegidas no dispositivo
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

type StatCardProps = {
  label: string;
  valor: string;
  icon: keyof typeof Ionicons.glyphMap;
  colors: ThemeColors;
  styles: ReturnType<typeof createStyles>;
  destaque?: boolean;
};

function StatCard({ label, valor, icon, colors, styles, destaque }: StatCardProps) {
  return (
    <View style={[styles.statCard, destaque && styles.statCardDestaque]}>
      <View style={[styles.statIcon, destaque && { backgroundColor: colors.surface }]}>
        <Ionicons
          name={icon}
          size={14}
          color={destaque ? colors.primaryText : colors.textMuted}
        />
      </View>
      <Text style={[styles.statValor, destaque && { color: colors.primaryText }]}>{valor}</Text>
      <Text style={[styles.statLabel, destaque && { color: 'rgba(255,255,255,0.85)' }]}>
        {label}
      </Text>
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
      paddingHorizontal: spacing.xl,
      marginBottom: spacing.lg,
    },
    tituloPagina: {
      fontFamily: fontFamily.extrabold,
      fontSize: fontSize['3xl'],
      color: c.text,
    },
    subtitulo: {
      fontFamily: fontFamily.medium,
      fontSize: fontSize.md,
      color: c.textMuted,
      marginTop: spacing.xs,
    },

    /* User card */
    userCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.lg,
      marginHorizontal: spacing.xl,
      marginBottom: spacing.lg,
      backgroundColor: c.surface,
      borderRadius: radius.xl,
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: c.border,
    },
    avatarPressable: {
      position: 'relative',
    },
    avatarBadge: {
      position: 'absolute',
      bottom: -2,
      right: -2,
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: c.primary,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: c.surface,
    },
    userInfo: { flex: 1 },
    userNome: {
      fontFamily: fontFamily.bold,
      fontSize: fontSize.lg,
      color: c.text,
    },
    userEmail: {
      fontFamily: fontFamily.medium,
      fontSize: fontSize.md,
      color: c.textMuted,
      marginTop: 2,
    },

    /* Stats bento */
    statsBento: {
      flexDirection: 'row',
      gap: spacing.sm,
      paddingHorizontal: spacing.xl,
      marginBottom: spacing.xl,
    },
    statCard: {
      flex: 1,
      backgroundColor: c.surface,
      borderRadius: radius.lg,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: c.border,
      gap: spacing.sm,
    },
    statCardDestaque: {
      backgroundColor: c.primary,
      borderColor: c.primary,
      ...shadow.primary,
    },
    statIcon: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: c.surfaceElevated,
      alignItems: 'center',
      justifyContent: 'center',
    },
    statValor: {
      fontFamily: fontFamily.extrabold,
      fontSize: fontSize.xl,
      color: c.text,
    },
    statLabel: {
      fontFamily: fontFamily.medium,
      fontSize: fontSize.md,
      color: c.textMuted,
    },

    /* Section title */
    sectionTitle: {
      fontFamily: fontFamily.bold,
      fontSize: fontSize.md,
      color: c.textMuted,
      paddingHorizontal: spacing.xl,
      marginBottom: spacing.sm,
      marginTop: spacing.sm,
    },

    /* Foto bento */
    fotoBento: {
      flexDirection: 'row',
      gap: spacing.sm,
      paddingHorizontal: spacing.xl,
      marginBottom: spacing.lg,
    },
    fotoBotao: {
      flex: 1,
      backgroundColor: c.surface,
      borderRadius: radius.lg,
      paddingVertical: spacing.md + 2,
      alignItems: 'center',
      gap: spacing.sm,
      borderWidth: 1,
      borderColor: c.border,
    },
    fotoIconWrap: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: c.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    fotoBotaoTexto: {
      fontFamily: fontFamily.semibold,
      fontSize: fontSize.md,
      color: c.text,
    },

    /* Theme card */
    themeCard: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.md,
      marginHorizontal: spacing.xl,
      marginBottom: spacing.lg,
      backgroundColor: c.surface,
      borderRadius: radius.lg,
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: c.border,
    },
    themeInfo: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
    themeIconWrap: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: c.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    themeTextos: { flex: 1 },
    themeLabel: {
      fontFamily: fontFamily.semibold,
      fontSize: fontSize.base,
      color: c.text,
    },
    themeSub: {
      fontFamily: fontFamily.medium,
      fontSize: fontSize.md,
      color: c.textMuted,
      marginTop: 2,
    },

    /* Ações card */
    acoesCard: {
      marginHorizontal: spacing.xl,
      marginBottom: spacing.xl,
      backgroundColor: c.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: c.border,
      overflow: 'hidden',
    },
    linhaAcao: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: spacing.lg,
    },
    linhaAcaoEsquerda: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
    linhaAcaoIconWrap: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: c.surfaceElevated,
      alignItems: 'center',
      justifyContent: 'center',
    },
    linhaAcaoLabel: {
      fontFamily: fontFamily.semibold,
      fontSize: fontSize.base,
      color: c.text,
    },
    linhaAcaoSub: {
      fontFamily: fontFamily.medium,
      fontSize: fontSize.md,
      color: c.textMuted,
      marginTop: 2,
    },
    divisor: {
      height: 1,
      backgroundColor: c.separator,
      marginHorizontal: spacing.lg,
    },

    pressedSoft: {
      opacity: 0.85,
      transform: [{ scale: 0.98 }],
    },
    footerHint: {
      fontFamily: fontFamily.regular,
      fontSize: fontSize.md,
      color: c.textSubtle,
      textAlign: 'center',
      paddingHorizontal: spacing['2xl'],
      marginTop: spacing.lg,
    },
  });
