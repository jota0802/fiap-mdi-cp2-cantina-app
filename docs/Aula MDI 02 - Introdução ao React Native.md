# Aula MDI 02 - Introdução ao React Native

Aula MDI 02 - Introdução ao React Native
Engenharia de Software - 3º Ano
Mobile Development & IOT
 
A utilização do uso de soluções para mobile gera o aumento constante da demanda para o desenvolvimento
de aplicações multiplaforma. Nesta matéria você será capacitado como um Mobile Developer, atendendo a
crescente busca por profissionais com esse perfil. Isso significa ter o controle de múltiplas funções na palma
da sua mão entendendo a fundo o conteúdo de desenvolvimento mobile & IoT, e integrando o melhor da
sociedade 5.0 com os resultados obtidos da evolução da indústria 4.0.
  ⁠
​Quem sou eu?
Prof. Hercules Ramos
  Desenvolvedor Mobile & Full Stack com foco em UX/UI
  Especialista em Arquitetura e Desenvolvimento de Sistemas, Dados e IA
  Professor na FIAP, FMU e outras instituições
  Consultor de Tecnologia na Teia Studio
  10+ anos de experiência em automação e sistemas inteligentes
Contato:
  profhercules.ramos@fiap.com.br
  LinkedIn
Minha missão: Conectar vocês com o mercado de trabalho através da tecnologia!
15/04/2026, 03:51 Aula MDI 02 - Introdução ao React Native
https://whimsical.com/aula-mdi-02-introducao-ao-react-native-P3p9xyHA4VbNDdFsYyTLVR 1/12
  ⁠
​O que vamos ver hoje?
O que é React Native e por que todo mundo usa
JavaScript: revisão rápida dos conceitos essenciais
Nosso primeiro "Hello World" com Expo
Exercício prático: nivelamento em JavaScript
Spoiler: Ao final da aula, vocês terão uma app funcionando no celular de vocês!  
  ⁠
​React Native: A Ponte entre Web e Mobile
Metáfora: Imagina que você é um chef que só sabe fazer comida italiana (JavaScript/React). Com React Native, você
consegue servir seus pratos tanto em restaurantes brasileiros quanto japoneses (iOS e Android) sem ter que
aprender culinária completamente nova!
Apps que você usa TODO DIA feitos com React Native:
Instagram - Feed, Stories, Reels
Facebook - App principal
Discord - Chat de voz/texto
Shopee - E-commerce
Nubank - Partes do app
  ⁠
​Por que React Native?
Um código → Duas plataformas (iOS + Android)
1
Comparação Rápida:
Swift + Kotlin = 2 códigos JavaScript = 1 código
2 times de devs 1 time
$$$$ $$
Desenvolvimento Nativo React Native
15/04/2026, 03:51 Aula MDI 02 - Introdução ao React Native
https://whimsical.com/aula-mdi-02-introducao-ao-react-native-P3p9xyHA4VbNDdFsYyTLVR 2/12
Quando usar? 90% dos apps que vocês vão criar na carreira!
  ⁠
​JavaScript: Revisão Express
Variáveis (let, const, var)
// ​
⁠
  ⁠
​Use const por padrão
1
const nome = "João";
2
 
3
// ​
⁠
  ⁠
​Use let quando o valor muda
4
let contador = 0;
5
contador = contador + 1;
6
 
7
// ​
⁠
  ⁠
​Evite var (é de 2015 pra trás)
8
var legado = "não use mais";
9
Dica: const não deixa você atirar no próprio pé!
  ⁠
​Arrow Functions: O Jeito Moderno
// Jeito antigo (ainda funciona)
1
function somar(a, b) {
2
return a + b;
3
}
4
 
5
// Jeito moderno (use este!)
6
const somar = (a, b) => {
7
return a + b;
8
};
9
 
10
// Jeito mais moderno ainda (return implícito)
11
const somar = (a, b) => a + b;
12
Por que isso importa? 99% do código React Native usa arrow functions!
Performance máxima Performance quase nativa
Desenvolvimento Nativo React Native
15/04/2026, 03:51 Aula MDI 02 - Introdução ao React Native
https://whimsical.com/aula-mdi-02-introducao-ao-react-native-P3p9xyHA4VbNDdFsYyTLVR 3/12
  ⁠
​Destructuring: Desempacotando Dados
// Imagine um objeto como uma caixa com gavetas
1
const usuario = {
2
nome: "Maria",
3
idade: 21,
4
curso: "Eng. Software"
5
};
6
 
7
// Jeito antigo
8
const nome = usuario.nome;
9
const idade = usuario.idade;
10
 
11
// Jeito moderno (destructuring)
12
const { nome, idade } = usuario;
13
 
14
// Arrays também!
15
const [primeiro, segundo] = ["React", "Native"];
16
console.log(primeiro); // "React"
17
Uso real: Você vai fazer isso 100 vezes por dia no React Native!
  ⁠
​Map, Filter, Reduce: Seus Novos Melhores Amigos
const numeros = [1, 2, 3, 4, 5];
1
 
2
// MAP: Transforma cada item
3
const dobrados = numeros.map(n => n * 2);
4
// [2, 4, 6, 8, 10]
5
 
6
// FILTER: Seleciona itens
7
const pares = numeros.filter(n => n % 2 === 0);
8
// [2, 4]
9
 
10
// REDUCE: Combina tudo em um valor
11
15/04/2026, 03:51 Aula MDI 02 - Introdução ao React Native
https://whimsical.com/aula-mdi-02-introducao-ao-react-native-P3p9xyHA4VbNDdFsYyTLVR 4/12
const soma = numeros.reduce((total, n) => total + n, 0);
12
// 15
13
Cenário real: Mostrar lista de produtos, filtrar por categoria, calcular total do carrinho!
  ⁠
​Async/Await: Esperando as Coisas Acontecerem
// Buscar dados de uma API (ex: Instagram carregando posts)
1
const buscarUsuario = async (id) => {
2
try {
3
const resposta = await fetch(` {id}`);
4 https://api.com/users/$
const dados = await resposta.json();
5
return dados;
6
} catch (erro) {
7
console.log("Deu ruim:", erro);
8
}
9
};
10
 
11
// Usar
12
const usuario = await buscarUsuario(123);
13
Analogia: É como pedir comida no iFood e ficar fazendo outras coisas enquanto espera. Quando chega, você para e
come!
  ⁠
​React Native: Conceitos Fundamentais
Componentes = Blocos de LEGO
import { View, Text } from 'react-native';
1
const MeuComponente = () => {
2
return (
3
<View>
4
<Text>Olá, FIAP! ​
⁠
  ⁠
​
</Text>
5
</View>
6
);
7
};
8
15/04/2026, 03:51 Aula MDI 02 - Introdução ao React Native
https://whimsical.com/aula-mdi-02-introducao-ao-react-native-P3p9xyHA4VbNDdFsYyTLVR 5/12
Cada componente é uma peça do seu app:
<View> = Container (como uma <div> do HTML)
<Text> = Texto (TUDO que é texto precisa estar aqui)
<Image> = Imagens
<TouchableOpacity> = Botão que dá feedback visual
  ⁠
​Styling: CSS, mas não exatamente
import { StyleSheet, View, Text } from 'react-native';
1
 
2
const App = () => {
3
return (
4
<View style={styles.container}>
5
<Text style={styles.titulo}>React Native</Text>
6
</View>
7
);
8
};
9
 
10
const styles = StyleSheet.create({
11
container: {
12
flex: 1,
13
backgroundColor: '#FF0080',
14
justifyContent: 'center',
15
alignItems: 'center'
16
},
17
titulo: {
18
fontSize: 32,
19
color: '#FFF',
20
fontWeight: 'bold'
21
}
22
});
23
Atenção: É camelCase ( backgroundColor ), não kebab-case ( background-color )!
15/04/2026, 03:51 Aula MDI 02 - Introdução ao React Native
https://whimsical.com/aula-mdi-02-introducao-ao-react-native-P3p9xyHA4VbNDdFsYyTLVR 6/12
  ⁠
​Expo: Seu Melhor Amigo
O que é? Ferramentas + bibliotecas que facilitam SUA VIDA!
Instalação Rápida:
# 0. Caso tenha problema de scripts
1
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy Unrestricted
2
 
3
# 1. Instalar Expo CLI
4
npm install -g expo-cli
5
 
6
# 2. Criar projeto (com opção de template)
7
npx create-expo-app MeuPrimeiroApp -t
8
 
9
# 3. Entrar na pasta
10
cd MeuPrimeiroApp
11
 
12
# 4. Rodar
13
npx expo start
14
Expo Go: App no celular que roda seu código em tempo real. É tipo mágica! ​
⁠
  ⁠
​
  ⁠
​Demo: Hello World ao Vivo!
Vamos criar juntos:
import { StatusBar } from 'expo-status-bar';
1
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
2
import { useState } from 'react';
3
15/04/2026, 03:51 Aula MDI 02 - Introdução ao React Native
https://whimsical.com/aula-mdi-02-introducao-ao-react-native-P3p9xyHA4VbNDdFsYyTLVR 7/12
 
4
export default function App() {
5
const [contador, setContador] = useState(0);
6
 
7
return (
8
<View style={styles.container}>
9
<Text style={styles.titulo}>Contador FIAP</Text>
10
<Text style={styles.numero}>{contador}</Text>
11
12
<TouchableOpacity
13
style={styles.botao}
14
onPress={() => setContador(contador + 1)}
15
>
16
<Text style={styles.textoBotao}>Clique Aqui!</Text>
17
</TouchableOpacity>
18
19
<StatusBar style="auto" />
20
</View>
21
);
22
}
23
 
24
const styles = StyleSheet.create({
25
container: {
26
flex: 1,
27
backgroundColor: '#0D1B2A',
28
alignItems: 'center',
29
justifyContent: 'center',
30
},
31
titulo: {
32
fontSize: 28,
33
color: '#FFF',
34
marginBottom: 20,
35
},
36
numero: {
37
fontSize: 72,
38
color: '#00D9FF',
39
fontWeight: 'bold',
40
marginBottom: 30,
41
},
42
botao: {
43
backgroundColor: '#00D9FF',
44
paddingHorizontal: 40,
45
paddingVertical: 15,
46
borderRadius: 10,
47
},
48
textoBotao: {
49
fontSize: 18,
50
fontWeight: 'bold',
51
color: '#0D1B2A',
52
},
53
});
54
15/04/2026, 03:51 Aula MDI 02 - Introdução ao React Native
https://whimsical.com/aula-mdi-02-introducao-ao-react-native-P3p9xyHA4VbNDdFsYyTLVR 8/12
  ⁠
​GitHub: Organizando Nosso Trabalho
Orientação para Criação do Repositório no GitHub
Durante todo o semestre e ano, utilizaremos o GitHub para armazenar e acompanhar a evolução dos códigos das
aulas.
Passo a Passo para Criar o Repositório no GitHub
1. Criar um repositório no GitHub
Acesse e faça login na sua conta (ou crie uma caso ainda não tenha)
https://github.com
Clique no ícone de + (canto superior direito) e selecione "New repository"
Em Repository name, insira: nome-projeto
Escolha a opção "Public" (público) ou "Private" (privado)
Marque a opção "Add a README file" (opcional, mas recomendado)
Clique em "Create repository"
2. Configurar o repositório no VS Code
# Clone o repositório recém-criado
1
git clone
2 https://github.com/SEU-USUARIO-GITHUB/nome-projeto.git
 
3
# Acesse a pasta clonada
4
cd nivelamento-javascript
5
 
6
# Crie um novo arquivo index.js para armazenar os códigos da aula
7
3. Adicionar e enviar os arquivos para o GitHub
# Verifique os arquivos modificados
1
git status
2
 
3
# Adicione todos os arquivos para o commit
4
git add .
5
 
6
# Faça o commit com a mensagem da aula
7
git commit -m "Aula XX/XX/XXXX"
8
 
9
# Envie o código para o GitHub
10
git push origin main
11
15/04/2026, 03:51 Aula MDI 02 - Introdução ao React Native
https://whimsical.com/aula-mdi-02-introducao-ao-react-native-P3p9xyHA4VbNDdFsYyTLVR 9/12
  ⁠
​Exercício Prático: Nivelamento JavaScript
Objetivo: Revisar conceitos fundamentais de JavaScript criando funções práticas.
Arquivo: Crie um arquivo index.js no repositório nivelamento-javascript
Desafios:
// 1. Crie uma função que recebe um array de números e retorna apenas os pares
1
const filtrarPares = (numeros) => {
2
// Seu código aqui
3
};
4
 
5
console.log(filtrarPares([1, 2, 3, 4, 5, 6])); // [2, 4, 6]
6
// 2. Crie uma função que recebe um array de nomes e retorna em MAIÚSCULAS
7
const nomesEmMaiuscula = (nomes) => {
8
// Seu código aqui
9
};
10
 
11
console.log(nomesEmMaiuscula(['joão', 'maria', 'pedro']));
12
// ['JOÃO', 'MARIA', 'PEDRO']
13
 
14
// 3. Crie uma função que calcula a média de um array de notas
15
const calcularMedia = (notas) => {
16
// Seu código aqui
17
};
18
 
19
console.log(calcularMedia([7, 8, 9, 6])); // 7.5
20
 
21
// 4. Crie uma função que recebe um array de produtos (objetos)
22
// e retorna apenas os que custam menos de 50 reais
23
const produtosBaratos = (produtos) => {
24
// Seu código aqui
25
};
26
 
27
const produtos = [
28
{ nome: 'Teclado', preco: 120 },
29
{ nome: 'Mouse', preco: 45 },
30
{ nome: 'Monitor', preco: 800 },
31
{ nome: 'Mousepad', preco: 25 }
32
];
33
 
34
console.log(produtosBaratos(produtos));
35
// [{ nome: 'Mouse', preco: 45 }, { nome: 'Mousepad', preco: 25 }]
36
 
37
// 5. DESAFIO: Crie uma função que simula um carrinho de compras
38
// Deve receber um array de produtos e retornar o total
39
const calcularTotal = (carrinho) => {
40
// Seu código aqui
41
};
42
 
43
console.log(calcularTotal(produtos)); // 990
44
Verificação: Vou passar nas máquinas para verificar o progresso!
15/04/2026, 03:51 Aula MDI 02 - Introdução ao React Native
https://whimsical.com/aula-mdi-02-introducao-ao-react-native-P3p9xyHA4VbNDdFsYyTLVR 10/12
Dica: Use map , filter , reduce e arrow functions!
  ⁠
​Próximos Passos
 
Navegação entre telas
Consumir APIs reais
Armazenamento local
Projeto Final:
App completo com backend
Deploy na Play Store/App Store
Recursos:
Documentação: https://reactnative.dev
Expo Docs: https://docs.expo.dev
React Native Directory: https://reactnative.directory
  ⁠
​Obrigado!
15/04/2026, 03:51 Aula MDI 02 - Introdução ao React Native
https://whimsical.com/aula-mdi-02-introducao-ao-react-native-P3p9xyHA4VbNDdFsYyTLVR 11/12
Dúvidas? Agora é a hora!
Lembrem-se:
Pratiquem MUITO
Quebrem o código (é assim que se aprende)
Comunidade React Native é gigante - usem!
Contato:​
⁠
  ⁠
​profhercules.ramos@fiap.com.br ​
⁠
  ⁠
​LinkedIn
#KeepCoding #ReactNative #FIAP
Copyright © 2026 Prof. Hercules Ramos
Todos direitos reservados. Reprodução ou divulgação total ou parcial deste documento é expressamente proibido
sem o consentimento formal, por escrito, do Professor (autor).
 
15/04/2026, 03:51 Aula MDI 02 - Introdução ao React Native
https://whimsical.com/aula-mdi-02-introducao-ao-react-native-P3p9xyHA4VbNDdFsYyTLVR 12/12
