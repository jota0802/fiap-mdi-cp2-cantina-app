import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import FiapLogo from '../../components/FiapLogo';
import CARDAPIO from '../../data/cardapio';

const DESTAQUES = CARDAPIO.filter((item) => [1, 5, 6, 8].includes(item.id));

export default function Home() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <FiapLogo width={100} color="#ED145B" />
          <Text style={styles.titulo}>CANTINA</Text>
          <Text style={styles.subtitulo}>SEU PEDIDO SEM FILA</Text>
        </View>

        <View style={styles.heroCard}>
          <Text style={styles.heroEmoji}>{'\uD83C\uDF54'}</Text>
          <Text style={styles.heroTitulo}>FACA SEU PEDIDO</Text>
          <Text style={styles.heroDescricao}>
            Escolha seus itens, confirme e retire no balcao com sua senha.
          </Text>
          <TouchableOpacity
            style={styles.heroBotao}
            onPress={() => router.push('/cardapio')}
          >
            <Text style={styles.heroBotaoTexto}>VER CARDAPIO</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.secaoTitulo}>COMO FUNCIONA</Text>
        <View style={styles.passosContainer}>
          <View style={styles.passo}>
            <Text style={styles.passoNumero}>01</Text>
            <Text style={styles.passoTexto}>ESCOLHA{'\n'}SEUS ITENS</Text>
          </View>
          <View style={styles.passo}>
            <Text style={styles.passoNumero}>02</Text>
            <Text style={styles.passoTexto}>CONFIRME{'\n'}O PEDIDO</Text>
          </View>
          <View style={styles.passo}>
            <Text style={styles.passoNumero}>03</Text>
            <Text style={styles.passoTexto}>RETIRE NO{'\n'}BALCAO</Text>
          </View>
        </View>

        <Text style={styles.secaoTitulo}>DESTAQUES</Text>
        <View style={styles.destaquesGrid}>
          {DESTAQUES.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.destaqueCard}
              onPress={() => router.push('/cardapio')}
            >
              <Text style={styles.destaqueEmoji}>{item.emoji}</Text>
              <Text style={styles.destaqueNome}>{item.nome.toUpperCase()}</Text>
              <Text style={styles.destaquePreco}>
                R$ {item.preco.toFixed(2)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    paddingTop: 64,
    paddingBottom: 40,
    gap: 8,
  },
  titulo: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 32,
    color: '#FFFFFF',
    letterSpacing: 8,
    marginTop: 16,
  },
  subtitulo: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 11,
    color: '#555555',
    letterSpacing: 4,
  },
  heroCard: {
    backgroundColor: '#111111',
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    marginBottom: 40,
  },
  heroEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  heroTitulo: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 20,
    color: '#FFFFFF',
    letterSpacing: 3,
    marginBottom: 8,
  },
  heroDescricao: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  heroBotao: {
    backgroundColor: '#ED145B',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 100,
  },
  heroBotaoTexto: {
    fontFamily: 'Manrope_700Bold',
    color: '#FFFFFF',
    fontSize: 13,
    letterSpacing: 2,
  },
  secaoTitulo: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 12,
    color: '#555555',
    letterSpacing: 4,
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  passosContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 40,
  },
  passo: {
    flex: 1,
    backgroundColor: '#111111',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  passoNumero: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 24,
    color: '#ED145B',
    marginBottom: 8,
  },
  passoTexto: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 10,
    color: '#666666',
    textAlign: 'center',
    letterSpacing: 1,
    lineHeight: 16,
  },
  destaquesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 10,
  },
  destaqueCard: {
    width: '48%',
    backgroundColor: '#111111',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  destaqueEmoji: {
    fontSize: 36,
    marginBottom: 10,
  },
  destaqueNome: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 11,
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 1,
  },
  destaquePreco: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 14,
    color: '#ED145B',
    marginTop: 6,
  },
});
