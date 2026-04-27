# Aula MDI 07 - Gerenciamento de Estado Global e Mock de Dados

Aula MDI 07 - Gerenciamento de Estado Global e
Mock de Dados
Engenharia de Software - 3º Ano
Mobile Development & IOT
 
A utilização do uso de soluções para mobile gera o aumento constante da demanda para o desenvolvimento
de aplicações multiplaforma. Nesta matéria você será capacitado como um Mobile Developer, atendendo a
crescente busca por profissionais com esse perfil. Isso significa ter o controle de múltiplas funções na palma
da sua mão entendendo a fundo o conteúdo de desenvolvimento mobile & IoT, e integrando o melhor da
sociedade 5.0 com os resultados obtidos da evolução da indústria 4.0.
  ⁠
​O que vamos ver hoje?
O problema do "passa dados pra cá, passa pra lá"
1.
Context API — estado global de verdade
2.
O que é Mock de Dados e por que usar
3.
Criando um mock simples com JSON
4.
Exercício prático com Expo
5.
1. O Problema: Prop Drilling ​
⁠
  ⁠
​
Imagina o WhatsApp. O nome do usuário logado aparece no perfil, no chat, nas configurações...
Sem estado global, você teria que passar esse dado de componente em componente como uma batata quente. ​
⁠
  ⁠
​
App
1
└── Home
2
└── Header ← precisa do nome
3
└── ChatList
4
15/04/2026, 03:52 Aula MDI 07 - Gerenciamento de Estado Global e Mock de Dados
https://whimsical.com/aula-mdi-07-gerenciamento-de-estado-global-e-mock-de-dados-8wUrpD7i8Lf4jaS9kih3s5 1/9
└── ChatItem ← também precisa do nome
5
Isso se chama Prop Drilling — e é uma dor de cabeça enorme em apps reais.
  Solução: Colocar o estado em um lugar acessível por qualquer componente da árvore.
2. Context API — O "Armazém Central" ​
⁠
  ⁠
​
Metáfora: Pensa no iFood. O restaurante (contexto) tem o cardápio (dados). Qualquer tela do app (componente) pode
consultar esse cardápio sem precisar que alguém fique passando ele de mão em mão.
Como funciona em 3 passos:
1. createContext() → Cria o armazém
1
2. Provider → Disponibiliza os dados
2
3. useContext() → Qualquer componente acessa
3
Exemplo mínimo:
context/UserContext.js
import { createContext, useState, useContext } from 'react';
1
const UserContext = createContext();
2
export function UserProvider({ children }) {
3
const [user, setUser] = useState({ nome: 'Hercules', plano: 'Premium' });
4
return (
5
<UserContext.Provider value={{ user, setUser }}>
6
{children}
7
</UserContext.Provider>
8
);
9
}
10
export function useUser() {
11
return useContext(UserContext);
12
}
13
App.js — Envolve tudo com o Provider
import { UserProvider } from './context/UserContext';
1
15/04/2026, 03:52 Aula MDI 07 - Gerenciamento de Estado Global e Mock de Dados
https://whimsical.com/aula-mdi-07-gerenciamento-de-estado-global-e-mock-de-dados-8wUrpD7i8Lf4jaS9kih3s5 2/9
import HomeScreen from './screens/HomeScreen';
2
export default function App() {
3
return (
4
<UserProvider>
5
<HomeScreen />
6
</UserProvider>
7
);
8
}
9
screens/HomeScreen.js — Acessa de qualquer lugar!
import { useUser } from '../context/UserContext';
1
import { View, Text } from 'react-native';
2
export default function HomeScreen() {
3
const { user } = useUser();
4
return (
5
<View>
6
<Text>Olá, {user.nome}! Plano: {user.plano}</Text>
7
</View>
8
);
9
}
10
  Sem passar props! Qualquer tela acessa useUser() e pronto.
3. Atualizando o Estado Global ​
⁠
  ⁠
​
O mesmo contexto pode expor a função setUser para qualquer componente alterar o estado.
import { useUser } from '../context/UserContext';
1
import { Button, View } from 'react-native';
2
export default function ConfigScreen() {
3
const { setUser } = useUser();
4
function fazerUpgrade() {
5
setUser(prev => ({ ...prev, plano: 'Ultra' }));
6
}
7
return (
8
<View>
9
<Button title="Fazer Upgrade ​
⁠
  ⁠
​
" onPress={fazerUpgrade} />
10
</View>
11
);
12
}
13
  Toda tela que usa useUser() vai re-renderizar automaticamente quando o estado mudar. Igual ao Spotify
atualizando o nome do usuário em todas as telas ao mesmo tempo.
4. Mock de Dados — Fingindo que tem backend ​
⁠
  ⁠
​
Mock de dados = dados falsos, mas com formato real. Serve para:
Desenvolver o app sem precisar do backend pronto
Testar diferentes cenários (lista vazia, erro, lista cheia)
15/04/2026, 03:52 Aula MDI 07 - Gerenciamento de Estado Global e Mock de Dados
https://whimsical.com/aula-mdi-07-gerenciamento-de-estado-global-e-mock-de-dados-8wUrpD7i8Lf4jaS9kih3s5 3/9
Apresentar um protótipo funcional pro cliente
  Grandes times usam isso no dia a dia. No Nubank, enquanto o time de backend cria a API de empréstimos, o
time mobile já desenvolve a tela com dados mockados.
5. Criando um Mock com JSON ​
⁠
  ⁠
​
data/produtos.js
export const produtos = [
1
{ id: '1', nome: 'Tênis Air Max', preco: 599.90, categoria: 'Calçados' },
2
{ id: '2', nome: 'Camiseta Básica', preco: 89.90, categoria: 'Roupas' },
3
{ id: '3', nome: 'Mochila Urbana', preco: 249.90, categoria: 'Acessórios' },
4
{ id: '4', nome: 'Boné Snapback', preco: 69.90, categoria: 'Acessórios' },
5
];
6
Usando no componente:
import { FlatList, Text, View } from 'react-native';
1
import { produtos } from '../data/produtos';
2
export default function ListaProdutos() {
3
return (
4
<FlatList
5
data={produtos}
6
keyExtractor={item => item.id}
7
renderItem={({ item }) => (
8
<View>
9
<Text>{item.nome} — R$ {item.preco.toFixed(2)}</Text>
10
</View>
11
)}
12
/>
13
);
14
}
15
Saída esperada:
Tênis Air Max — R$ 599.90
1
Camiseta Básica — R$ 89.90
2
Mochila Urbana — R$ 249.90
3
Boné Snapback — R$ 69.90
4
6. Mock + Context = Combo Poderoso ​
⁠
  ⁠
​
Agora juntamos os dois conceitos: mock de dados dentro de um contexto global.
context/CarrinhoContext.js
import { createContext, useState, useContext } from 'react';
1
const CarrinhoContext = createContext();
2
export function CarrinhoProvider({ children }) {
3
const [carrinho, setCarrinho] = useState([]);
4
function adicionarItem(produto) {
5
15/04/2026, 03:52 Aula MDI 07 - Gerenciamento de Estado Global e Mock de Dados
https://whimsical.com/aula-mdi-07-gerenciamento-de-estado-global-e-mock-de-dados-8wUrpD7i8Lf4jaS9kih3s5 4/9
setCarrinho(prev => [...prev, produto]);
6
}
7
function removerItem(id) {
8
setCarrinho(prev => prev.filter(p => p.id !== id));
9
}
10
return (
11
<CarrinhoContext.Provider value={{ carrinho, adicionarItem, removerItem }}>
12
{children}
13
</CarrinhoContext.Provider>
14
);
15
}
16
export function useCarrinho() {
17
return useContext(CarrinhoContext);
18
}
19
  É exatamente assim que apps de e-commerce como Shopee e Amazon organizam o carrinho globalmente!
7. Estrutura do Projeto Final ​
⁠
  ⁠
​
MeuApp/
1
├── App.js
2
├── context/
3
│ ├── UserContext.js
4
│ └── CarrinhoContext.js
5
├── data/
6
│ └── produtos.js
7
├── screens/
8
│ ├── HomeScreen.js
9
│ ├── ProdutosScreen.js
10
│ └── CarrinhoScreen.js
11
└── components/
12
└── ProdutoCard.js
13
  Organização é tudo. Um projeto bagunçado cresce como uma gaveta de cabos — difícil de achar qualquer coisa
depois.
15/04/2026, 03:52 Aula MDI 07 - Gerenciamento de Estado Global e Mock de Dados
https://whimsical.com/aula-mdi-07-gerenciamento-de-estado-global-e-mock-de-dados-8wUrpD7i8Lf4jaS9kih3s5 5/9
8. Resumão Visual ​
⁠
  ⁠
​
Mock: dados falsos com estrutura real → usados pelo contexto ou direto nas telas
Context API: estado global acessível por qualquer componente sem prop drilling
  ⁠
​Exercício Prático — Mini Loja com Estado Global
Objetivo
Criar um app de mini loja onde o usuário pode ver produtos (mockados) e adicioná-los ao carrinho usando Context
API.
Setup
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy Unrestricted
1
 
2
npx create-expo-app mini-loja --template blank
3
 
4
cd mini-loja
5
 
6
npm start
7
O que construir
Estrutura de arquivos:
15/04/2026, 03:52 Aula MDI 07 - Gerenciamento de Estado Global e Mock de Dados
https://whimsical.com/aula-mdi-07-gerenciamento-de-estado-global-e-mock-de-dados-8wUrpD7i8Lf4jaS9kih3s5 6/9
mini-loja/
1
├── App.js
2
├── context/CarrinhoContext.js
3
├── data/produtos.js
4
└── screens/
5
├── ProdutosScreen.js
6
└── CarrinhoScreen.js
7
Passo 1 — Mock de dados ( data/produtos.js )
export const produtos = [
1
{ id: '1', nome: '​
⁠
  ⁠
​Fone Bluetooth', preco: 199.90 },
2
{ id: '2', nome: '​
⁠
  ⁠
​Teclado Mecânico', preco: 349.90 },
3
{ id: '3', nome: '​
⁠
  ⁠
​Mouse Gamer', preco: 159.90 },
4
];
5
Passo 2 — Contexto do carrinho ( context/CarrinhoContext.js )
import { createContext, useContext, useState } from 'react';
1
const CarrinhoContext = createContext();
2
export function CarrinhoProvider({ children }) {
3
const [carrinho, setCarrinho] = useState([]);
4
function adicionar(produto) {
5
setCarrinho(prev => [...prev, produto]);
6
}
7
return (
8
<CarrinhoContext.Provider value={{ carrinho, adicionar }}>
9
{children}
10
</CarrinhoContext.Provider>
11
);
12
}
13
export const useCarrinho = () => useContext(CarrinhoContext);
14
Passo 3 — Tela de Produtos ( screens/ProdutosScreen.js )
import { View, Text, FlatList, Button, StyleSheet } from 'react-native';
1
import { produtos } from '../data/produtos';
2
import { useCarrinho } from '../context/CarrinhoContext';
3
export default function ProdutosScreen() {
4
const { adicionar, carrinho } = useCarrinho();
5
return (
6
<View style={styles.container}>
7
<Text style={styles.titulo}>​
⁠
  ⁠
​Produtos</Text>
8
<Text>​
⁠
  ⁠
​Itens no carrinho: {carrinho.length}</Text>
9
<FlatList
10
data={produtos}
11
keyExtractor={item => item.id}
12
renderItem={({ item }) => (
13
<View style={styles.card}>
14
<Text style={styles.nome}>{item.nome}</Text>
15
<Text>R$ {item.preco.toFixed(2)}</Text>
16
15/04/2026, 03:52 Aula MDI 07 - Gerenciamento de Estado Global e Mock de Dados
https://whimsical.com/aula-mdi-07-gerenciamento-de-estado-global-e-mock-de-dados-8wUrpD7i8Lf4jaS9kih3s5 7/9
<Button title="Adicionar ao Carrinho" onPress={() => adicionar(item)} />
17
</View>
18
)}
19
/>
20
</View>
21
);
22
}
23
const styles = StyleSheet.create({
24
container: { flex: 1, padding: 20, paddingTop: 60 },
25
titulo: { fontSize: 24, fontWeight: 'bold', marginBottom: 10 },
26
card: { backgroundColor: '#f0f0f0', padding: 15, marginVertical: 8, borderRadius: 10 },
27
nome: { fontSize: 16, fontWeight: '600' },
28
});
29
Passo 4 — App.js com Provider
import { View } from 'react-native';
1
import { CarrinhoProvider } from './context/CarrinhoContext';
2
import ProdutosScreen from './screens/ProdutosScreen';
3
export default function App() {
4
return (
5
<CarrinhoProvider>
6
<ProdutosScreen />
7
</CarrinhoProvider>
8
);
9
}
10
  ⁠
​Resultado esperado
Lista de 3 produtos aparecem na tela
Ao clicar "Adicionar ao Carrinho", o contador atualiza em tempo real
O estado do carrinho é global — pronto para ser acessado por qualquer tela
  ⁠
​Desafio:
Criar uma CarrinhoScreen.js que exibe os itens do carrinho usando useCarrinho() e adicionar navegação
básica com dois botões na App.js para alternar entre as telas. Adicione mais 4 itens no Mock de Dados
produtos.js . Além de mostrar a soma dos valores dos produtos.
  ⁠
​Referências e Próximos Passos
  React Context — Docs oficiais
  Expo Getting Started
  ⁠
​Dúvidas?
Contato:
  profhercules.ramos@fiap.com.br
  LinkedIn
#KeepCoding #ReactNative #FIAP
15/04/2026, 03:52 Aula MDI 07 - Gerenciamento de Estado Global e Mock de Dados
https://whimsical.com/aula-mdi-07-gerenciamento-de-estado-global-e-mock-de-dados-8wUrpD7i8Lf4jaS9kih3s5 8/9
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
 
15/04/2026, 03:52 Aula MDI 07 - Gerenciamento de Estado Global e Mock de Dados
https://whimsical.com/aula-mdi-07-gerenciamento-de-estado-global-e-mock-de-dados-8wUrpD7i8Lf4jaS9kih3s5 9/9
