import { Image } from 'expo-image';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

type Props = {
  emoji: string;
  imagem?: string;
  size: number;
  borderRadius: number;
  bgColor: string;
};

/**
 * Thumbnail unificado pra itens do cardápio: emoji centralizado como fallback
 * com Image opcional sobreposta. Se a imagem falhar, o emoji permanece visível.
 */
export default function ItemThumbnail({
  emoji,
  imagem,
  size,
  borderRadius,
  bgColor,
}: Props) {
  const [erro, setErro] = useState(false);
  const mostrarImagem = !!imagem && !erro;

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius,
          backgroundColor: bgColor,
        },
      ]}
    >
      <Text style={[styles.emoji, { fontSize: size * 0.5 }]}>{emoji}</Text>
      {mostrarImagem ? (
        <Image
          source={{ uri: imagem }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={220}
          onError={() => setErro(true)}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  emoji: {
    position: 'absolute',
  },
});
