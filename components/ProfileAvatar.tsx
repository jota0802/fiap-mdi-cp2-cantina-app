import { useMemo, useState } from 'react';
import { Image, Platform, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/context/ThemeContext';
import { fontFamily, letterSpacing } from '@/constants/theme';
import type { ThemeColors } from '@/types';

type Props = {
  uri?: string | null;
  nome: string;
  size?: number;
};

function getIniciais(nome: string): string {
  const parts = nome.trim().split(/\s+/);
  if (parts.length === 0) return '?';
  if (parts.length === 1) {
    const first = parts[0];
    return (first?.charAt(0) ?? '?').toUpperCase();
  }
  const first = parts[0]?.charAt(0) ?? '';
  const last = parts[parts.length - 1]?.charAt(0) ?? '';
  return `${first}${last}`.toUpperCase();
}

/**
 * Blob URLs são session-scoped no web — uma foto escolhida via picker e
 * persistida no AsyncStorage como `blob:http://...` expira no reload e dá
 * ERR_FILE_NOT_FOUND. Evita render dessa URI no web e cai no fallback.
 */
function uriUtilizavel(uri: string | null | undefined): boolean {
  if (!uri) return false;
  if (Platform.OS === 'web' && uri.startsWith('blob:')) return false;
  return true;
}

export default function ProfileAvatar({ uri, nome, size = 96 }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors, size), [colors, size]);
  const [erroLoad, setErroLoad] = useState(false);

  const podeRenderImagem = uriUtilizavel(uri) && !erroLoad;

  if (podeRenderImagem) {
    return (
      <Image
        source={{ uri: uri as string }}
        style={styles.avatar}
        onError={() => setErroLoad(true)}
      />
    );
  }

  return (
    <View style={[styles.avatar, styles.placeholder]}>
      <Text style={styles.iniciais}>{getIniciais(nome)}</Text>
    </View>
  );
}

const createStyles = (c: ThemeColors, size: number) =>
  StyleSheet.create({
    avatar: {
      width: size,
      height: size,
      borderRadius: size / 2,
      borderWidth: 2,
      borderColor: c.primary,
    },
    placeholder: {
      backgroundColor: c.cardElevated,
      alignItems: 'center',
      justifyContent: 'center',
    },
    iniciais: {
      fontFamily: fontFamily.extrabold,
      fontSize: size * 0.4,
      color: c.primary,
      letterSpacing: letterSpacing.normal,
    },
  });
