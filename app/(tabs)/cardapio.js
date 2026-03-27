import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import CARDAPIO from '../../data/cardapio';
import ItemCardapio from '../../components/ItemCardapio';

export default function Cardapio() {
  const router = useRouter();
  const [quantidades, setQuantidades] = useState({});

  const adicionarItem = (id) => {
    setQuantidades((prev) => ({
      ...prev,
      [id]: (prev[id] || 0) + 1,
    }));
  };

  const removerItem = (id) => {
    setQuantidades((prev) => {
      const novaQtd = (prev[id] || 0) - 1;
      if (novaQtd <= 0) {
        const novo = { ...prev };
        delete novo[id];
        return novo;
      }
      return { ...prev, [id]: novaQtd };
    });
  };

  const totalItens = Object.values(quantidades).reduce(
    (acc, qty) => acc + qty,
    0
  );

  const totalPreco = Object.entries(quantidades).reduce((acc, [id, qty]) => {
    const item = CARDAPIO.find((i) => i.id === parseInt(id));
    return acc + item.preco * qty;
  }, 0);

  const categorias = [...new Set(CARDAPIO.map((item) => item.categoria))];

  const confirmarPedido = () => {
    if (totalItens === 0) return;

    const itensResumo = Object.entries(quantidades)
      .map(([id, qty]) => {
        const item = CARDAPIO.find((i) => i.id === parseInt(id));
        return `${qty}x ${item.nome}`;
      })
      .join(', ');

    router.push({
      pathname: '/confirmacao',
      params: {
        total: totalPreco.toFixed(2),
        itens: totalItens,
        resumo: itensResumo,
      },
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.titulo}>CARDÁPIO</Text>
        <Text style={styles.subtitulo}>ESCOLHA SEUS ITENS</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {categorias.map((categoria) => (
          <View key={categoria} style={styles.categoriaSection}>
            <Text style={styles.categoriaTitulo}>{categoria.toUpperCase()}</Text>
            {CARDAPIO.filter((item) => item.categoria === categoria).map(
              (item) => (
                <ItemCardapio
                  key={item.id}
                  item={item}
                  quantidade={quantidades[item.id] || 0}
                  onAdicionar={adicionarItem}
                  onRemover={removerItem}
                />
              )
            )}
          </View>
        ))}

        {totalItens === 0 && (
          <View style={styles.estadoVazio}>
            <Text style={styles.estadoVazioEmoji}>{'\uD83D\uDC47'}</Text>
            <Text style={styles.estadoVazioTexto}>
              TOQUE NO + PARA ADICIONAR ITENS
            </Text>
          </View>
        )}

        <View style={styles.espacoFinal} />
      </ScrollView>

      {totalItens > 0 && (
        <View style={styles.barraInferior}>
          <View style={styles.resumo}>
            <Text style={styles.resumoItens}>
              {totalItens} {totalItens === 1 ? 'ITEM' : 'ITENS'}
            </Text>
            <Text style={styles.resumoTotal}>R$ {totalPreco.toFixed(2)}</Text>
          </View>
          <TouchableOpacity
            style={styles.botaoConfirmar}
            onPress={confirmarPedido}
          >
            <Text style={styles.botaoConfirmarTexto}>CONFIRMAR</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  titulo: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 28,
    color: '#FFFFFF',
    letterSpacing: 6,
  },
  subtitulo: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 11,
    color: '#555555',
    letterSpacing: 3,
    marginTop: 4,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  categoriaSection: {
    marginBottom: 12,
  },
  categoriaTitulo: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 11,
    color: '#ED145B',
    letterSpacing: 3,
    marginBottom: 12,
    marginTop: 8,
  },
  estadoVazio: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  estadoVazioEmoji: {
    fontSize: 32,
    marginBottom: 12,
  },
  estadoVazioTexto: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 11,
    color: '#444444',
    letterSpacing: 2,
  },
  espacoFinal: {
    height: 100,
  },
  barraInferior: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#111111',
    borderTopWidth: 1,
    borderTopColor: '#1A1A1A',
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  resumo: {
    flex: 1,
  },
  resumoItens: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 10,
    color: '#555555',
    letterSpacing: 2,
  },
  resumoTotal: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 22,
    color: '#FFFFFF',
    marginTop: 2,
  },
  botaoConfirmar: {
    backgroundColor: '#ED145B',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 100,
  },
  botaoConfirmarTexto: {
    fontFamily: 'Manrope_700Bold',
    color: '#FFFFFF',
    fontSize: 12,
    letterSpacing: 2,
  },
});
