import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function ItemCardapio({ item, quantidade, onAdicionar, onRemover }) {
  return (
    <View style={styles.container}>
      <View style={styles.emojiContainer}>
        <Text style={styles.emoji}>{item.emoji}</Text>
      </View>

      <View style={styles.info}>
        <Text style={styles.nome}>{item.nome.toUpperCase()}</Text>
        <Text style={styles.descricao}>{item.descricao}</Text>
        <Text style={styles.preco}>R$ {item.preco.toFixed(2)}</Text>
      </View>

      <View style={styles.controles}>
        {quantidade > 0 && (
          <TouchableOpacity
            style={styles.botaoMenos}
            onPress={() => onRemover(item.id)}
          >
            <Text style={styles.botaoTexto}>-</Text>
          </TouchableOpacity>
        )}

        {quantidade > 0 && (
          <Text style={styles.quantidade}>{quantidade}</Text>
        )}

        <TouchableOpacity
          style={styles.botaoMais}
          onPress={() => onAdicionar(item.id)}
        >
          <Text style={styles.botaoTexto}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111111',
    borderRadius: 16,
    padding: 14,
    marginBottom: 8,
  },
  emojiContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 24,
  },
  info: {
    flex: 1,
    marginLeft: 14,
  },
  nome: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 12,
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  descricao: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 12,
    color: '#555555',
    marginTop: 2,
  },
  preco: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 14,
    color: '#ED145B',
    marginTop: 4,
  },
  controles: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  botaoMais: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ED145B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  botaoMenos: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  botaoTexto: {
    fontFamily: 'Manrope_700Bold',
    color: '#FFFFFF',
    fontSize: 18,
    lineHeight: 20,
  },
  quantidade: {
    fontFamily: 'Manrope_700Bold',
    color: '#FFFFFF',
    fontSize: 16,
    minWidth: 20,
    textAlign: 'center',
  },
});
