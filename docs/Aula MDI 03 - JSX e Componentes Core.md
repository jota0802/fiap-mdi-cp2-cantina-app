# Aula MDI 03 - JSX e Componentes Core

Aula MDI 03 - JSX e Componentes Core
Engenharia de Software - 3º Ano
Mobile Development & IOT
 
A utilização do uso de soluções para mobile gera o aumento constante da demanda para o desenvolvimento
de aplicações multiplaforma. Nesta matéria você será capacitado como um Mobile Developer, atendendo a
crescente busca por profissionais com esse perfil. Isso significa ter o controle de múltiplas funções na palma
da sua mão entendendo a fundo o conteúdo de desenvolvimento mobile & IoT, e integrando o melhor da
sociedade 5.0 com os resultados obtidos da evolução da indústria 4.0.
  ⁠
​O que vamos ver hoje?
Revisão rápida de JavaScript essencial
1.
O que é JSX?
2.
Componentes Core: View , Text , Image
3.
Estrutura de um App React Native
4.
  Hands-on: criando nosso primeiro App com Expo
5.
Objetivo: sair daqui sabendo montar a tela de qualquer app do zero.
  ⁠
​Revisão: JavaScript que você precisa saber
Sem isso o JSX vai parecer grego. Com isso, vai parecer inglês.
Variáveis
const nome = "FIAP"; // valor fixo
1
let contador = 0; // valor mutável
2
Arrow Functions
15/04/2026, 03:51 Aula MDI 03 - JSX e Componentes Core
https://whimsical.com/aula-mdi-03-jsx-e-componentes-core-ShBZHw2wSYSaFbX5eXarmX 1/9
// Jeito antigo
1
function saudacao(nome) { return "Olá " + nome; }
2
// Jeito moderno ​
⁠
  ⁠
​
3
const saudacao = (nome) => `Olá ${nome}`;
4
Desestruturação
const usuario = { nome: "Ana", idade: 21 };
1
const { nome, idade } = usuario; // extrai direto!
2
Template Literals
const app = "Instagram";
1
console.log(`Bem-vindo ao ${app}!`); // sem + concatenação ​
⁠
  ⁠
​
2
  ⁠
​O que é JSX?
Imagine que o HTML e o JavaScript tiveram um filho. Esse filho é o JSX.
JSX = JavaScript XML — uma sintaxe que parece HTML, mas é JavaScript.
// Isso é JSX ​
⁠
  ⁠
​
1
const tela = (
2
<View>
3
<Text>Olá, mundo!</Text>
4
</View>
5
);
6
O que acontece por baixo dos panos:
// O que o compilador gera ​
⁠
  ⁠
​
1
React.createElement(View, null,
2
React.createElement(Text, null, "Olá, mundo!")
3
15/04/2026, 03:51 Aula MDI 03 - JSX e Componentes Core
https://whimsical.com/aula-mdi-03-jsx-e-componentes-core-ShBZHw2wSYSaFbX5eXarmX 2/9
)
4
  ⁠
​Regras de ouro do JSX
  ⁠
​Componentes Core — Os tijolos do app
Pensa assim: você está construindo um LEGO. O React Native te dá as peças base. Você monta o que quiser.
No browser você tem <div> , <p> , <img> ...
No React Native você tem:
  ⁠
​View — O contêiner universal
<View> é como uma caixa invisível. Você usa para organizar e agrupar tudo.
Sempre feche as tags <Image /> não <Image>
Um elemento raiz envolva tudo em <View>
JavaScript entre {} <Text>{nome}</Text>
className → style no React Native não tem CSS
<div> <View> Contêiner, layout
<p> , <span> <Text> Todo texto
<img> <Image> Imagens
<button> <TouchableOpacity> Botões
<input> <TextInput> Campos de texto
Regra Exemplo
Web React Native Para quê?
15/04/2026, 03:51 Aula MDI 03 - JSX e Componentes Core
https://whimsical.com/aula-mdi-03-jsx-e-componentes-core-ShBZHw2wSYSaFbX5eXarmX 3/9
Pensa no layout do WhatsApp: cada mensagem é uma <View> com <Text> dentro.
import { View } from 'react-native';
1
 
2
export default function App() {
3
return (
4
<View style={{ flex: 1, backgroundColor: '#fff' }}>
5
{/* seu conteúdo aqui */}
6
</View>
7
);
8
}
9
Flexbox no React Native
Por padrão, View usa flexDirection: 'column' (diferente do browser!)
<View style={{ flexDirection: 'row', gap: 10 }}>
1
<View style={{ width: 50, height: 50, backgroundColor: 'red' }} />
2
<View style={{ width: 50, height: 50, backgroundColor: 'blue' }} />
3
</View>
4
  ⁠
​Text — Todo texto passa por aqui
No React Native, não existe texto solto. Tudo dentro de <Text> .
Se você escrever texto fora do <Text> , o app quebra. Sem exceção.
import { Text } from 'react-native';
1
 
2
// ​
⁠
  ⁠
​Certo
3
<Text style={{ fontSize: 24, fontWeight: 'bold' }}>
4
Olá, FIAP! ​
⁠
  ⁠
​
5
</Text>
6
 
7
// ​
⁠
  ⁠
​Com variável
8
const app = "TikTok";
9
<Text>Bem-vindo ao {app}</Text>
10
 
11
// ​
⁠
  ⁠
​ERRADO — app vai crashar
12
<View>
13
texto solto aqui vai quebrar tudo
14
</View>
15
  ⁠
​Image — Imagens locais e remotas
Funciona como uma <img> do HTML, mas com superpoderes para mobile.
import { Image } from 'react-native';
1
 
2
// Imagem local (dentro do projeto)
3
<Image
4
15/04/2026, 03:51 Aula MDI 03 - JSX e Componentes Core
https://whimsical.com/aula-mdi-03-jsx-e-componentes-core-ShBZHw2wSYSaFbX5eXarmX 4/9
source={require('./assets/logo.png')}
5
style={{ width: 100, height: 100 }}
6
/>
7
 
8
// Imagem remota (URL — como o avatar do Instagram)
9
<Image
10
source={{ uri: ' }}
11 https://picsum.photos/200'
style={{ width: 100, height: 100, borderRadius: 50 }}
12
/>
13
  Obrigatório definir width e height para imagens remotas!
  ⁠
​Estrutura de um App React Native
Vamos dissecar um app como se fosse uma cirurgia. ​
⁠
  ⁠
​
meu-app/
1
├── assets/ → imagens, fontes, ícones
2
├── app.json → configurações do Expo
3
├── App.js → ponto de entrada ← COMEÇA AQUI
4
├── package.json → dependências
5
└── node_modules/ → não mexa aqui ​
⁠
 
6
App.js — O coração do app
import { StatusBar } from 'expo-status-bar';
1
import { StyleSheet, Text, View } from 'react-native';
2
 
3
// Componente = função que retorna JSX
4
export default function App() {
5
return (
6
<View style={styles.container}>
7
<Text>Open up App.js to start working on your app!</Text>
8
<StatusBar style="auto" />
9
</View>
10
);
11
}
12
 
13
// Estilos com StyleSheet (melhor performance que objeto inline)
14
const styles = StyleSheet.create({
15
container: {
16
flex: 1,
17
backgroundColor: '#fff',
18
alignItems: 'center',
19
justifyContent: 'center',
20
},
21
});
22
Anatomia explicada:
import → traz os componentes que vamos usar
export default function App() → nosso componente principal
15/04/2026, 03:51 Aula MDI 03 - JSX e Componentes Core
https://whimsical.com/aula-mdi-03-jsx-e-componentes-core-ShBZHw2wSYSaFbX5eXarmX 5/9
return (...) → o JSX que será renderizado na tela
StyleSheet.create → nosso "CSS" do React Native
  ⁠
​Iniciando com Expo CLI
Expo é como o "modo fácil" do React Native. A Netflix, a Shopify, a Coinbase usam Expo em projetos reais.
Passo a passo no terminal PowerShell dentro do VS Code:
# 0. Caso tenha problema de scripts
1
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy Unrestricted
2
 
3
# 1. Criar o projeto
4
npx create-expo-app@latest meu-perfil --template blank
5
 
6
# 2. Entrar na pasta
7
cd meu-perfil
8
 
9
# 3. Rodar o projeto
10
npx expo start
11
Para visualizar:
Celular físico → instale o app Expo Go e escaneie o QR Code
Emulador Android → pressione a no terminal
Simulador iOS → pressione i no terminal (só no Mac)
  ⁠
​Componentes na prática — Cartão de Perfil
Vamos reproduzir algo parecido com um perfil do Instagram:
import { View, Text, Image, StyleSheet } from 'react-native';
1
 
2
export default function App() {
3
const usuario = {
4
15/04/2026, 03:51 Aula MDI 03 - JSX e Componentes Core
https://whimsical.com/aula-mdi-03-jsx-e-componentes-core-ShBZHw2wSYSaFbX5eXarmX 6/9
nome: "Ada Lovelace",
5
bio: "Primeira programadora da história ​
⁠
  ⁠
​
",
6
seguidores: "2.4M",
7
avatar: " ",
8 https://picsum.photos/seed/ada/200
};
9
return (
10
<View style={styles.container}>
11
{/* Avatar */}
12
<Image
13
source={{ uri: usuario.avatar }}
14
style={styles.avatar}
15
/>
16
{/* Nome */}
17
<Text style={styles.nome}>{usuario.nome}</Text>
18
{/* Bio */}
19
<Text style={styles.bio}>{usuario.bio}</Text>
20
{/* Stats */}
21
<View style={styles.stats}>
22
<Text style={styles.stat}>​
⁠
  ⁠
​{usuario.seguidores} seguidores</Text>
23
</View>
24
</View>
25
);
26
}
27
const styles = StyleSheet.create({
28
container: {
29
flex: 1,
30
alignItems: 'center',
31
justifyContent: 'center',
32
backgroundColor: '#0a0a0a',
33
padding: 20,
34
},
35
avatar: {
36
width: 120,
37
height: 120,
38
borderRadius: 60,
39
borderWidth: 3,
40
borderColor: '#E1306C',
41
marginBottom: 16,
42
},
43
nome: {
44
fontSize: 22,
45
fontWeight: 'bold',
46
color: '#fff',
47
marginBottom: 8,
48
},
49
bio: {
50
fontSize: 14,
51
color: '#aaa',
52
textAlign: 'center',
53
marginBottom: 16,
54
},
55
stats: {
56
backgroundColor: '#1a1a1a',
57
15/04/2026, 03:51 Aula MDI 03 - JSX e Componentes Core
https://whimsical.com/aula-mdi-03-jsx-e-componentes-core-ShBZHw2wSYSaFbX5eXarmX 7/9
paddingHorizontal: 20,
58
paddingVertical: 10,
59
borderRadius: 20,
60
},
61
stat: {
62
color: '#fff',
63
fontSize: 14,
64
},
65
});
66
  ⁠
​Recapitulando
JSX → sintaxe que mistura JS + XML/HTML
1
View → caixa/contêiner para organizar layout
2
Text → TODO texto precisa estar aqui
3
Image → imagens locais (require) ou remotas (uri)
4
StyleSheet → nosso sistema de estilização
5
App.js → ponto de entrada do app
6
  Regra mental: se vai aparecer na tela → é um componente. Se é lógica → é JavaScript puro.
  ⁠
​Exercício Prático — Meu App de Apresentação
Objetivo
Criar um app que funcione como um cartão de visita digital seu — tipo um mini Linktree personalizado.
O que o app deve ter:
[ ] Sua foto (pode ser qualquer imagem da internet)
[ ] Seu nome em destaque
[ ] Seu curso e ano
[ ] Uma frase que te representa
[ ] Pelo menos 2 "links" (só o visual, não precisa funcionar): GitHub, LinkedIn, portfólio, etc.
[ ] Cores customizadas — sem deixar o app no padrão branco
  ⁠
​Dicas
Use borderRadius: 999 para deixar a foto redonda
Experimente backgroundColor no container para mudar o fundo
Quer deixar bonito? Use fontWeight: 'bold' e brinque com fontSize
"Qualquer tecnologia suficientemente avançada é indistinguível de magia."
— Arthur C. Clarke
React Native ainda não é magia, mas chega perto. ​
⁠
  ⁠
​
Próxima aula → Fast Refresh e o Ciclo de Desenvolvimento Ágil ​
⁠
  ⁠
​
15/04/2026, 03:51 Aula MDI 03 - JSX e Componentes Core
https://whimsical.com/aula-mdi-03-jsx-e-componentes-core-ShBZHw2wSYSaFbX5eXarmX 8/9
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
 
15/04/2026, 03:51 Aula MDI 03 - JSX e Componentes Core
https://whimsical.com/aula-mdi-03-jsx-e-componentes-core-ShBZHw2wSYSaFbX5eXarmX 9/9
