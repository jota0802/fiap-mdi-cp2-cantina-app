# Aula MDI 05 - Layout, Telas & Navegação com Expo Router

Aula MDI 05 - Layout, Telas & Navegação com Expo
Router
Engenharia de Software - 3º Ano
Mobile Development & IOT
 
A utilização do uso de soluções para mobile gera o aumento constante da demanda para o desenvolvimento
de aplicações multiplaforma. Nesta matéria você será capacitado como um Mobile Developer, atendendo a
crescente busca por profissionais com esse perfil. Isso significa ter o controle de múltiplas funções na palma
da sua mão entendendo a fundo o conteúdo de desenvolvimento mobile & IoT, e integrando o melhor da
sociedade 5.0 com os resultados obtidos da evolução da indústria 4.0.
  ⁠
​O que vamos ver hoje?
Revisão rápida de StyleSheet
1.
Flexbox no React Native (o segredo do layout)
2.
O que é Expo Router?
3.
Criando rotas e telas
4.
Navegação entre telas
5.
  Exercício prático
6.
  ⁠
​Revisão Rápida — StyleSheet
import { StyleSheet, View, Text } from 'react-native';
1
export default function App() {
2
return (
3
<View style={styles.container}>
4
<Text style={styles.titulo}>Olá, FIAP! ​
⁠
  ⁠
​
</Text>
5
</View>
6
15/04/2026, 03:52 Aula MDI 05 - Layout, Telas & Navegação com Expo Router
https://whimsical.com/aula-mdi-05-layout-telas-and-navegacao-com-expo-router-QvgpTb88AYu4RXNJ2LZW96 1/8
);
7
}
8
const styles = StyleSheet.create({
9
container: { flex: 1, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'cente
r' },
10
titulo: { fontSize: 24, fontWeight: 'bold', color: '#E83D84' },
11
});
12
StyleSheet funciona como o CSS do React Native — mas com superpoderes de performance! ​
⁠
  ⁠
​
  ⁠
​Flexbox — O Arquiteto do Layout
Pensa assim: o Flexbox é o planta baixa do seu app.
Assim como um arquiteto decide onde fica a cozinha, sala e quarto — o Flexbox decide onde ficam seus
componentes.
Eixos do Flexbox
┌─────────────────────────────┐
1
│ → → → → → → → │ ← Main Axis (padrão: row)
2
│ │
3
│ ↓ Cross Axis │
4
└─────────────────────────────┘
5
No React Native, o padrão é flexDirection: 'column' (ao contrário da web!)
  ⁠
​Flexbox na Prática
// Três cards lado a lado (como o layout do Spotify ​
⁠
  ⁠
​
)
1
<View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 16 }}>
2
<View style={{ flex: 1, height: 100, backgroundColor: '#1DB954', margin: 4, borderRadius: 8
}} />
3
<View style={{ flex: 1, height: 100, backgroundColor: '#1DB954', margin: 4, borderRadius: 8
}} />
4
<View style={{ flex: 1, height: 100, backgroundColor: '#1DB954', margin: 4, borderRadius: 8
}} />
5
</View>
6
Propriedades essenciais
flexDirection row · column Direção dos filhos
justifyContent center · space-between · flex-start Alinha no eixo principal
alignItems center · flex-start · stretch Alinha no eixo cruzado
flex 1 · 2 · 0.5 Quanto espaço ocupar
Propriedade Valores comuns Para que serve
15/04/2026, 03:52 Aula MDI 05 - Layout, Telas & Navegação com Expo Router
https://whimsical.com/aula-mdi-05-layout-telas-and-navegacao-com-expo-router-QvgpTb88AYu4RXNJ2LZW96 2/8
  ⁠
​Expo Router — O GPS do seu App
Sabe quando você usa o Google Maps e ele sabe exatamente qual rua você está?
O Expo Router faz isso com as telas do seu app — cada pasta/arquivo = uma rota!
Por que Expo Router?
  File-based routing — o arquivo é a rota (igual Next.js!)
  Deep linking automático
  Navegação entre tabs, stacks e modals
  Funciona em iOS, Android e Web
  ⁠
​Criando um Projeto com Expo Router
  ⁠
​No terminal do VS Code:
# Caso tenha problema de scripts
1
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy Unrestricted
2
 
3
# Criando o projeto (template blank usa JavaScript por padrão)
4
npx create-expo-app@latest app-router --template blank
5
 
6
cd app-router
7
 
8
# Instalando o Expo Router e dependências necessárias
9
npx expo install expo-router react-native-safe-area-context react-native-screens
10
  ⁠
​Editando o package.json
O template blank não sabe que vamos usar o Expo Router — precisamos avisar!
15/04/2026, 03:52 Aula MDI 05 - Layout, Telas & Navegação com Expo Router
https://whimsical.com/aula-mdi-05-layout-telas-and-navegacao-com-expo-router-QvgpTb88AYu4RXNJ2LZW96 3/8
Abra o package.json e adicione o campo "main" apontando para o Expo Router:
{
1
"name": "app-router",
2
"main": "expo-router/entry",
3
...
4
}
5
  Isso diz ao Expo: "ei, quem manda aqui agora é o Expo Router!"
Sem isso, o app continua usando o App.js da raiz e a navegação não funciona.
  ⁠
​Criando a pasta app/ e os arquivos
O template blank gera um App.js na raiz — mas com Expo Router, as telas ficam dentro da pasta app/ . Crie a
estrutura manualmente no VS Code.
Agora crie os dois arquivos dentro de app/ :
app/_layout.js — a "moldura" de todas as telas (obrigatório!):
import { Stack } from 'expo-router';
1
 
2
export default function Layout() {
3
return <Stack />;
4
}
5
app/index.js — a tela inicial (rota / ).
Pode deletar o App.js da raiz — ele não será mais usado! ​
⁠
  ⁠
​
Estrutura final do projeto:
meu-app/
1
├── app/ ← ​
⁠
  ⁠
​AQUI ficam as telas!
2
│ ├── _layout.js ← Layout raiz (Stack, Tabs, etc.)
3
│ └── index.js ← Tela inicial (rota "/")
4
├── assets/
5
├── package.json ← "main": "expo-router/entry" ​
⁠
  ⁠
​
6
└── app.json
7
Cada arquivo dentro de app/ vira automaticamente uma rota. Mágico? Quase! ​
⁠
  ⁠
​
  ⁠
​Criando Telas (Rotas)
app/index.js — Tela Home
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
1
import { useRouter } from 'expo-router';
2
export default function Home() {
3
15/04/2026, 03:52 Aula MDI 05 - Layout, Telas & Navegação com Expo Router
https://whimsical.com/aula-mdi-05-layout-telas-and-navegacao-com-expo-router-QvgpTb88AYu4RXNJ2LZW96 4/8
const router = useRouter();
4
return (
5
<View style={styles.container}>
6
<Text style={styles.titulo}>​
⁠
  ⁠
​Home</Text>
7
<TouchableOpacity style={styles.botao} onPress={() => router.push('/sobre')}>
8
<Text style={styles.botaoTexto}>Ir para Sobre</Text>
9
</TouchableOpacity>
10
</View>
11
);
12
}
13
const styles = StyleSheet.create({
14
container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f5
f5f5' },
15
titulo: { fontSize: 32, fontWeight: 'bold', marginBottom: 24 },
16
botao: { backgroundColor: '#E83D84', padding: 16, borderRadius: 12 },
17
botaoTexto:{ color: '#fff', fontSize: 16, fontWeight: '600' },
18
});
19
  ⁠
​Segunda Tela
app/sobre.js — Tela Sobre
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
1
import { useRouter } from 'expo-router';
2
export default function Sobre() {
3
const router = useRouter();
4
return (
5
<View style={styles.container}>
6
<Text style={styles.titulo}>​
⁠
  ⁠
​Sobre</Text>
7
<Text style={styles.descricao}>Esse app foi feito na FIAP! ​
⁠
  ⁠
​
</Text>
8
<TouchableOpacity onPress={() => router.back()}>
9
<Text style={styles.voltar}>← Voltar</Text>
10
</TouchableOpacity>
11
</View>
12
);
13
}
14
const styles = StyleSheet.create({
15
container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f
ff' },
16
titulo: { fontSize: 28, fontWeight: 'bold', marginBottom: 12 },
17
descricao: { fontSize: 16, color: '#555', marginBottom: 24 },
18
voltar: { fontSize: 16, color: '#E83D84', fontWeight: '600' },
19
});
20
  ⁠
​Navegação com Tabs (como Instagram, WhatsApp...)
Aquelas abas lá embaixo do app? São Tabs! Veja como é fácil criar:
app/_layout.js
15/04/2026, 03:52 Aula MDI 05 - Layout, Telas & Navegação com Expo Router
https://whimsical.com/aula-mdi-05-layout-telas-and-navegacao-com-expo-router-QvgpTb88AYu4RXNJ2LZW96 5/8
import { Tabs } from 'expo-router';
1
import { Ionicons } from '@expo/vector-icons';
2
export default function Layout() {
3
return (
4
<Tabs screenOptions={{ tabBarActiveTintColor: '#E83D84' }}>
5
<Tabs.Screen
6
name="index"
7
options={{
8
title: 'Home',
9
tabBarIcon: ({ color }) => <Ionicons name="home" size={24} color={color} />,
10
}}
11
/>
12
<Tabs.Screen
13
name="perfil"
14
options={{
15
title: 'Perfil',
16
tabBarIcon: ({ color }) => <Ionicons name="person" size={24} color={color} />,
17
}}
18
/>
19
</Tabs>
20
);
21
}
22
  ⁠
​Resumo de Navegação
import { useRouter } from 'expo-router';
1
const router = useRouter();
2
router.push('/detalhes'); // navega
3
router.push('/produto/42'); // rota dinâmica
4
router.back(); // volta
5
  Dica: rotas dinâmicas ficam em arquivos como app/produto/[id].js
  ⁠
​Rodando o App
# No terminal do VS Code, dentro da pasta do projeto:
1
npx expo start
2
 
3
# Vai aparecer um QR Code — escaneie com o app Expo Go no celular!
4
# Ou pressione 'a' para Android Emulator / 'i' para iOS Simulator
5
router.push('/rota') Vai para nova tela Abrir nova página
router.back() Volta para tela anterior Botão "Voltar" do browser
router.replace('/rota') Substitui tela atual Redirect 301
Método O que faz Analogia
15/04/2026, 03:52 Aula MDI 05 - Layout, Telas & Navegação com Expo Router
https://whimsical.com/aula-mdi-05-layout-telas-and-navegacao-com-expo-router-QvgpTb88AYu4RXNJ2LZW96 6/8
Qualquer mudança no código → o app atualiza instantaneamente. Isso é o Fast Refresh! ​
⁠
  ⁠
​
  ⁠
​Exercício Prático — App "Meu Perfil"
Objetivo: criar um mini-app com 2 telas e navegação entre elas.
O que o app deve ter:
Tela 1 — Home ( app/index.js )
Seu nome em destaque (Text grande)
Uma "foto" simulada (View colorida com inicial do nome)
Botão "Ver meu perfil" → navega para Tela 2
Tela 2 — Perfil ( app/perfil.js )
Curso e turma (ex: "ES · 2026")
3 tecnologias favoritas em cards lado a lado (Flexbox row !)
Botão "Voltar"
Dicas:
npx create-expo-app@latest meu-perfil --template blank
1
 
2
cd meu-perfil
3
 
4
npx expo install expo-router react-native-safe-area-context react-native-screens
5
 
6
# Renomeie App.js para app/index.js e crie a pasta app/
7
npx expo start
8
  Tempo: 30–40 minutos · ​
⁠
  ⁠
​Pode ser em dupla!
15/04/2026, 03:52 Aula MDI 05 - Layout, Telas & Navegação com Expo Router
https://whimsical.com/aula-mdi-05-layout-telas-and-navegacao-com-expo-router-QvgpTb88AYu4RXNJ2LZW96 7/8
  ⁠
​Recap da Aula
  ⁠
​Próxima Aula — #06
Trabalhando com Componentes Diversos + Persistência de Dados
FlatList e ScrollView para listas longas
AsyncStorage para salvar dados localmente
Formulários e inputs
"Um app sem dados é como um WhatsApp sem mensagens." ​
⁠
  ⁠
​
  Recursos:
· ·
Expo Router Docs React Native Flexbox Expo Go App
  ⁠
​Dúvidas?
Contato:
  profhercules.ramos@fiap.com.br
  LinkedIn
#KeepCoding #ReactNative #FIAP
Let's code! ​
⁠
  ⁠
​
​
⁠
  ⁠
​
"O único modo de aprender programação é programando." - Todo desenvolvedor, sempre
Copyright © 2026 Prof. Hercules Ramos
Todos direitos reservados. Reprodução ou divulgação total ou parcial deste documento é expressamente proibido
sem o consentimento formal, por escrito, do Professor (autor).
 
Flexbox Sistema de layout que organiza componentes em linhas/colunas
StyleSheet CSS do React Native com performance otimizada
Expo Router Navegação baseada em arquivos — pasta = rota
router.push() Navega para nova tela
Tabs Barra de navegação inferior (Instagram-style)
Conceito Em uma linha
15/04/2026, 03:52 Aula MDI 05 - Layout, Telas & Navegação com Expo Router
https://whimsical.com/aula-mdi-05-layout-telas-and-navegacao-com-expo-router-QvgpTb88AYu4RXNJ2LZW96 8/8
