import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';

export default function Confirmacao() {
  const router = useRouter();
  const { total, itens, resumo } = useLocalSearchParams();
  const [senha, setSenha] = useState(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      const novaSenha = Math.floor(Math.random() * 900) + 100;
      setSenha(novaSenha);
      setCarregando(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  if (carregando) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingDot}>{'\u25CF'}</Text>
          <Text style={styles.loadingTexto}>PROCESSANDO</Text>
          <Text style={styles.loadingSubtexto}>AGUARDE UM MOMENTO</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.confirmado}>PEDIDO CONFIRMADO</Text>

        <View style={styles.senhaContainer}>
          <Text style={styles.senhaLabel}>SUA SENHA</Text>
          <Text style={styles.senhaNumero}>{senha}</Text>
        </View>

        <Text style={styles.senhaInstrucao}>
          APRESENTE ESTE NUMERO NO BALCAO
        </Text>

        <View style={styles.resumoCard}>
          <View style={styles.resumoLinha}>
            <Text style={styles.resumoLabel}>ITENS</Text>
            <Text style={styles.resumoValor}>{itens}</Text>
          </View>

          <View style={styles.divisor} />

          <Text style={styles.resumoDetalhe}>{resumo}</Text>

          <View style={styles.divisor} />

          <View style={styles.resumoLinha}>
            <Text style={styles.totalLabel}>TOTAL</Text>
            <Text style={styles.totalValor}>R$ {total}</Text>
          </View>
        </View>

        <View style={styles.avisoContainer}>
          <Text style={styles.avisoTexto}>
            AGUARDE SEU NUMERO NO PAINEL DA CANTINA
          </Text>
        </View>

        <TouchableOpacity
          style={styles.botaoPrimario}
          onPress={() => router.replace('/')}
        >
          <Text style={styles.botaoPrimarioTexto}>VOLTAR AO INICIO</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.botaoSecundario}
          onPress={() => router.replace('/cardapio')}
        >
          <Text style={styles.botaoSecundarioTexto}>NOVO PEDIDO</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
    justifyContent: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 40,
  },
  loadingDot: {
    fontSize: 24,
    color: '#ED145B',
    marginBottom: 20,
  },
  loadingTexto: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 16,
    color: '#FFFFFF',
    letterSpacing: 4,
  },
  loadingSubtexto: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 11,
    color: '#444444',
    letterSpacing: 3,
    marginTop: 8,
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  confirmado: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 14,
    color: '#FFFFFF',
    letterSpacing: 4,
    marginBottom: 32,
  },
  senhaContainer: {
    backgroundColor: '#ED145B',
    borderRadius: 24,
    paddingVertical: 32,
    paddingHorizontal: 48,
    alignItems: 'center',
    marginBottom: 12,
  },
  senhaLabel: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 10,
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 4,
    marginBottom: 8,
  },
  senhaNumero: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 72,
    color: '#FFFFFF',
    letterSpacing: 12,
  },
  senhaInstrucao: {
    fontFamily: 'Manrope_500Medium',
    fontSize: 10,
    color: '#555555',
    letterSpacing: 2,
    marginBottom: 32,
  },
  resumoCard: {
    backgroundColor: '#111111',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    marginBottom: 16,
  },
  resumoLinha: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resumoLabel: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 11,
    color: '#555555',
    letterSpacing: 2,
  },
  resumoValor: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 14,
    color: '#FFFFFF',
  },
  divisor: {
    height: 1,
    backgroundColor: '#1A1A1A',
    marginVertical: 14,
  },
  resumoDetalhe: {
    fontFamily: 'Manrope_400Regular',
    fontSize: 13,
    color: '#666666',
    lineHeight: 22,
  },
  totalLabel: {
    fontFamily: 'Manrope_700Bold',
    fontSize: 13,
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  totalValor: {
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 22,
    color: '#ED145B',
  },
  avisoContainer: {
    backgroundColor: '#111111',
    borderRadius: 12,
    padding: 14,
    width: '100%',
    marginBottom: 28,
    borderLeftWidth: 3,
    borderLeftColor: '#ED145B',
  },
  avisoTexto: {
    fontFamily: 'Manrope_600SemiBold',
    fontSize: 10,
    color: '#666666',
    letterSpacing: 2,
    lineHeight: 18,
  },
  botaoPrimario: {
    backgroundColor: '#ED145B',
    paddingVertical: 16,
    borderRadius: 100,
    alignItems: 'center',
    width: '100%',
    marginBottom: 10,
  },
  botaoPrimarioTexto: {
    fontFamily: 'Manrope_700Bold',
    color: '#FFFFFF',
    fontSize: 12,
    letterSpacing: 2,
  },
  botaoSecundario: {
    backgroundColor: 'transparent',
    paddingVertical: 14,
    borderRadius: 100,
    alignItems: 'center',
    width: '100%',
    borderWidth: 1,
    borderColor: '#1A1A1A',
  },
  botaoSecundarioTexto: {
    fontFamily: 'Manrope_600SemiBold',
    color: '#555555',
    fontSize: 12,
    letterSpacing: 2,
  },
});
