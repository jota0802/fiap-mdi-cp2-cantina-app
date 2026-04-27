# Aula MDI 06 - Trabalhando com Componentes Diversos & Persistência de Dados

Aula MDI 06 - Trabalhando com Componentes
Diversos & Persistência de Dados
Engenharia de Software - 3º Ano
Mobile Development & IOT
 
A utilização do uso de soluções para mobile gera o aumento constante da demanda para o desenvolvimento
de aplicações multiplaforma. Nesta matéria você será capacitado como um Mobile Developer, atendendo a
crescente busca por profissionais com esse perfil. Isso significa ter o controle de múltiplas funções na palma
da sua mão entendendo a fundo o conteúdo de desenvolvimento mobile & IoT, e integrando o melhor da
sociedade 5.0 com os resultados obtidos da evolução da indústria 4.0.
  ⁠
​Mapa da Aula
O que é persistência de dados?
1.
Onde os dados podem "morar"?
2.
AsyncStorage — o gaveta do seu app
3.
Componentes úteis: FlatList, TextInput, Switch
4.
Projeto prático: Lista de Tarefas com persistência
5.
Objetivo: Ao final dessa aula, você vai criar um app que lembra das coisas mesmo depois de fechar. ​
⁠
  ⁠
​
  ⁠
​O Problema dos Apps com Amnésia
Você já fechou um app e perdeu tudo que tinha digitado?
Isso se chama app com amnésia. Sem persistência, cada vez que o app fecha, os dados somem.
Exemplos reais do dia a dia:
  Notion — salva suas anotações automaticamente
  iFood — lembra do seu endereço e pedidos anteriores
15/04/2026, 03:52 Aula MDI 06 - Trabalhando com Componentes Diversos & Persistência de Dados
https://whimsical.com/aula-mdi-06-trabalhando-com-componentes-diversos-and-persistenci-BnYExK8M6EVDo3KRjqFquy 1/13
  Spotify — sabe qual música você pausou
Persistência = memória do app.
  ⁠
​Onde os Dados Podem Morar?
Pense em diferentes "tipos de memória":
  Hoje vamos focar no AsyncStorage — simples, direto e poderoso para começar.
  ⁠
​AsyncStorage: A Gaveta do App
Metáfora: O AsyncStorage é como uma gaveta no celular do usuário. Você coloca coisas lá ( setItem ), pega
quando precisar ( getItem ) e pode jogar fora ( removeItem ).
Instalação
npx expo install @react-native-async-storage/async-storage
1
API Básica
import AsyncStorage from '@react-native-async-storage/async-storage';
1
 
2
Estado (useState) Memória RAM Dados temporários da sessão
AsyncStorage HD do celular Dados simples locais
SQLite Banco de dados local Dados estruturados/relacionais
API / Firebase Nuvem ☁️ Dados compartilhados/online
Tipo Analogia Quando usar
15/04/2026, 03:52 Aula MDI 06 - Trabalhando com Componentes Diversos & Persistência de Dados
https://whimsical.com/aula-mdi-06-trabalhando-com-componentes-diversos-and-persistenci-BnYExK8M6EVDo3KRjqFquy 2/13
// ​
⁠
  ⁠
​Salvar
3
await AsyncStorage.setItem('nome', 'Maria');
4
 
5
// ​
⁠
  ⁠
​Ler
6
const nome = await AsyncStorage.getItem('nome');
7
 
8
// ​
⁠
  ⁠
​Deletar
9
await AsyncStorage.removeItem('nome');
10
  Atenção: AsyncStorage só salva strings. Para salvar objetos, use JSON.stringify e JSON.parse .
  ⁠
​Salvando Objetos com JSON
// ​
⁠
  ⁠
​Salvando um objeto
1
const usuario = { nome: 'João', idade: 21 };
2
await AsyncStorage.setItem('usuario', JSON.stringify(usuario));
3
 
4
// ​
⁠
  ⁠
​Lendo de volta
5
const dados = await AsyncStorage.getItem('usuario');
6
const usuario = JSON.parse(dados);
7
 
8
console.log(usuario.nome); // João
9
  Dica: Sempre use try/catch em operações assíncronas!
try {
1
await AsyncStorage.setItem('chave', 'valor');
2
} catch (e) {
3
console.error('Erro ao salvar:', e);
4
}
5
  ⁠
​Componentes Essenciais
Antes do projeto, vamos revisar 3 componentes muito usados na prática:
1. FlatList — a lista eficiente
Por que não usar .map() ? Para listas longas, o FlatList renderiza só o que aparece na tela (lazy loading). É
como um buffet — você não coloca tudo no prato de uma vez!
<FlatList
1
data={tarefas}
2
keyExtractor={(item) => item.id}
3
renderItem={({ item }) => <Text>{item.texto}</Text>}
4
/>
5
2. TextInput — campo de texto
<TextInput
1
value={texto}
2
15/04/2026, 03:52 Aula MDI 06 - Trabalhando com Componentes Diversos & Persistência de Dados
https://whimsical.com/aula-mdi-06-trabalhando-com-componentes-diversos-and-persistenci-BnYExK8M6EVDo3KRjqFquy 3/13
onChangeText={setTexto}
3
placeholder="Digite aqui..."
4
style={{ borderWidth: 1, padding: 8 }}
5
/>
6
3. Switch — o famoso toggle
<Switch value={ativo} onValueChange={setAtivo} />
1
  ⁠
​O Ciclo Completo de Persistência
Usuário digita
1
↓
2
useState (memória temporária)
3
↓
4
Usuário aperta "Salvar"
5
↓
6
AsyncStorage.setItem() ← salva no celular
7
↓
8
App fecha / reabre
9
↓
10
useEffect + AsyncStorage.getItem() ← recupera os dados
11
↓
12
useState atualizado → tela re-renderiza ​
⁠
  ⁠
​
13
  Padrão ouro: carregar dados no useEffect com array vazio [] (só roda uma vez, ao abrir o app).
  ⁠
​Estrutura do Projeto Prático
App: MemoList — Lista de tarefas que não esquece
15/04/2026, 03:52 Aula MDI 06 - Trabalhando com Componentes Diversos & Persistência de Dados
https://whimsical.com/aula-mdi-06-trabalhando-com-componentes-diversos-and-persistenci-BnYExK8M6EVDo3KRjqFquy 4/13
MemoList/
1
├── App.js
2
└── components/
3
└── TarefaItem.js
4
Iniciar o projeto
# 0. Caso tenha problema de scripts
1
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy Unrestricted
2
 
3
# 1. Criar o projeto MemoList
4
npx create-expo-app MemoList -t
5
 
6
# 2. Mudar diretório para pasta do projeto
7
cd MemoList
8
 
9
# 3. Instalar biblioteca Async Storage
10
npx expo install @react-native-async-storage/async-storage
11
 
12
# 4. Iniciar projeto
13
npx expo start
14
  ⁠
​Código: TarefaItem.js
// components/TarefaItem.js
1
 
2
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
3
 
4
export default function TarefaItem({ tarefa, onRemover }) {
5
return (
6
<View style={styles.container}>
7
<Text style={styles.texto}>{tarefa.texto}</Text>
8
<TouchableOpacity onPress={() => onRemover(tarefa.id)}>
9
<Text style={styles.remover}>​
⁠
  ⁠
​
</Text>
10
</TouchableOpacity>
11
</View>
12
);
13
}
14
 
15
const styles = StyleSheet.create({
16
container: {
17
flexDirection: 'row',
18
justifyContent: 'space-between',
19
padding: 12,
20
marginVertical: 4,
21
backgroundColor: '#f0f0f0',
22
borderRadius: 8,
23
},
24
texto: { fontSize: 16 },
25
remover: { fontSize: 18 },
26
15/04/2026, 03:52 Aula MDI 06 - Trabalhando com Componentes Diversos & Persistência de Dados
https://whimsical.com/aula-mdi-06-trabalhando-com-componentes-diversos-and-persistenci-BnYExK8M6EVDo3KRjqFquy 5/13
});
27
  ⁠
​Código: App.js
import { useState, useEffect } from 'react';
1
import { View, TextInput, Button, FlatList, StyleSheet } from 'react-native';
2
import AsyncStorage from '@react-native-async-storage/async-storage';
3
import TarefaItem from './components/TarefaItem';
4
 
5
export default function App() {
6
const [tarefas, setTarefas] = useState([]);
7
const [texto, setTexto] = useState('');
8
// ​
⁠
  ⁠
​Carregar ao abrir o app
9
useEffect(() => {
10
carregarTarefas();
11
}, []);
12
const carregarTarefas = async () => {
13
const dados = await AsyncStorage.getItem('tarefas');
14
if (dados) setTarefas(JSON.parse(dados));
15
};
16
const salvarTarefas = async (lista) => {
17
await AsyncStorage.setItem('tarefas', JSON.stringify(lista));
18
};
19
const adicionarTarefa = () => {
20
if (!texto.trim()) return;
21
const nova = { id: Date.now().toString(), texto };
22
const novaLista = [...tarefas, nova];
23
setTarefas(novaLista);
24
salvarTarefas(novaLista);
25
setTexto('');
26
};
27
const removerTarefa = (id) => {
28
const novaLista = tarefas.filter((t) => t.id !== id);
29
setTarefas(novaLista);
30
salvarTarefas(novaLista);
31
};
32
return (
33
<View style={styles.container}>
34
<TextInput
35
value={texto}
36
onChangeText={setTexto}
37
placeholder="Nova tarefa..."
38
style={styles.input}
39
/>
40
<Button title="Adicionar ​
⁠
  ⁠
​
" onPress={adicionarTarefa} />
41
<FlatList
42
data={tarefas}
43
keyExtractor={(item) => item.id}
44
renderItem={({ item }) => (
45
<TarefaItem tarefa={item} onRemover={removerTarefa} />
46
)}
47
15/04/2026, 03:52 Aula MDI 06 - Trabalhando com Componentes Diversos & Persistência de Dados
https://whimsical.com/aula-mdi-06-trabalhando-com-componentes-diversos-and-persistenci-BnYExK8M6EVDo3KRjqFquy 6/13
/>
48
</View>
49
);
50
}
51
 
52
const styles = StyleSheet.create({
53
container: { flex: 1, padding: 40, paddingTop: 60 },
54
input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8,
55
padding: 10, marginBottom: 10, fontSize: 16 },
56
});
57
  ⁠
​Testando no VS Code + Expo Go
Passo a passo:
Abra o terminal no VS Code
1.
Rode npx expo start
2.
Escaneie o QR Code com o Expo Go no celular ou abra o Emulador de Android
3.
Adicione algumas tarefas
4.
Feche o app completamente
5.
Abra de novo → as tarefas ainda estão lá! ​
⁠
  ⁠
​
6.
  "Funciona mesmo?!" — Sim! Porque o AsyncStorage salvou no dispositivo.
  ⁠
​Indo Além (para os curiosos)
Próximos passos naturais:
15/04/2026, 03:52 Aula MDI 06 - Trabalhando com Componentes Diversos & Persistência de Dados
https://whimsical.com/aula-mdi-06-trabalhando-com-componentes-diversos-and-persistenci-BnYExK8M6EVDo3KRjqFquy 7/13
  O MMKV é a lib de storage usada internamente no WhatsApp. É ~30x mais rápido que o AsyncStorage.
Impressionante, né?
  ⁠
​Switch na Prática: Modo Escuro
Metáfora: O Switch é o interruptor de luz da sua sala — liga e desliga um estado booleano com um toque.
No mundo real, é exatamente o que o Notion, iFood e Instagram usam para o modo escuro das configurações.
O que vamos construir:
Um mini-app com Switch que alterna entre tema claro e escuro e salva a preferência do usuário no AsyncStorage.
import { useState, useEffect } from 'react';
1
import { View, Text, Switch, StyleSheet } from 'react-native';
2
import AsyncStorage from '@react-native-async-storage/async-storage';
3
 
4
export default function App() {
5
const [modoEscuro, setModoEscuro] = useState(false);
6
 
7
// ​
⁠
  ⁠
​Carregar preferência salva ao abrir
8
useEffect(() => {
9
const carregar = async () => {
10
const valor = await AsyncStorage.getItem('modoEscuro');
11
if (valor !== null) setModoEscuro(JSON.parse(valor));
12
};
13
SQLite (expo-sqlite) Consultas SQL no celular
Firebase Firestore Dados na nuvem em tempo real
MMKV AsyncStorage mais rápido (usado no WhatsApp!)
Zustand + AsyncStorage Gerenciamento de estado com persistência
Tecnologia Para que serve
15/04/2026, 03:52 Aula MDI 06 - Trabalhando com Componentes Diversos & Persistência de Dados
https://whimsical.com/aula-mdi-06-trabalhando-com-componentes-diversos-and-persistenci-BnYExK8M6EVDo3KRjqFquy 8/13
carregar();
14
}, []);
15
 
16
// ​
⁠
  ⁠
​Salvar sempre que o switch mudar
17
const alternarTema = async (novoValor) => {
18
setModoEscuro(novoValor);
19
await AsyncStorage.setItem('modoEscuro', JSON.stringify(novoValor));
20
};
21
 
22
const tema = {
23
fundo: modoEscuro ? '#1a1a1a' : '#ffffff',
24
texto: modoEscuro ? '#f0f0f0' : '#111111',
25
};
26
 
27
return (
28
<View style={[styles.container, { backgroundColor: tema.fundo }]}>
29
<Text style={[styles.titulo, { color: tema.texto }]}>
30
{modoEscuro ? '​
⁠
  ⁠
​Modo Escuro' : '​
⁠
  ⁠
​Modo Claro'}
31
</Text>
32
 
33
<View style={styles.linha}>
34
<Text style={{ color: tema.texto, fontSize: 16 }}>Tema escuro</Text>
35
<Switch
36
value={modoEscuro}
37
onValueChange={alternarTema}
38
trackColor={{ false: '#ccc', true: '#6200ea' }}
39
thumbColor={modoEscuro ? '#fff' : '#f4f3f4'}
40
/>
41
</View>
42
 
43
<Text style={{ color: tema.texto, marginTop: 20 }}>
44
Feche o app e abra de novo — o tema persiste! ​
⁠
  ⁠
​
45
</Text>
46
</View>
47
);
48
}
49
 
50
const styles = StyleSheet.create({
51
container: { flex: 1, justifyContent: 'center', padding: 32 },
52
titulo: { fontSize: 26, fontWeight: 'bold', marginBottom: 32 },
53
linha: {
54
flexDirection: 'row',
55
justifyContent: 'space-between',
56
alignItems: 'center',
57
},
58
});
59
Props importantes do Switch :
value Estado atual (true/false)
Prop O que faz
15/04/2026, 03:52 Aula MDI 06 - Trabalhando com Componentes Diversos & Persistência de Dados
https://whimsical.com/aula-mdi-06-trabalhando-com-componentes-diversos-and-persistenci-BnYExK8M6EVDo3KRjqFquy 9/13
  Percebeu o padrão? Switch + useState + AsyncStorage = preferência que persiste. É exatamente isso que
apps profissionais fazem nas telas de configuração.
  ⁠
​Switch em Lista: Tarefas Concluídas
Agora vamos combinar tudo: FlatList + Switch por item + AsyncStorage . É quase o que o exercício pede —
presta atenção! ​
⁠
  ⁠
​
A ideia:
Cada tarefa tem um campo concluida: true/false . O Switch de cada item altera só aquela tarefa na lista, e a
lista inteira é salva no AsyncStorage.
import { useState, useEffect } from 'react';
1
import { View, Text, Switch, FlatList, StyleSheet } from 'react-native';
2
import AsyncStorage from '@react-native-async-storage/async-storage';
3
 
4
const TAREFAS_INICIAIS = [
5
{ id: '1', texto: 'Estudar AsyncStorage', concluida: false },
6
{ id: '2', texto: 'Fazer o exercício da aula', concluida: false },
7
{ id: '3', texto: 'Tomar café ​
⁠
  ⁠
​
', concluida: false },
8
];
9
 
10
export default function App() {
11
const [tarefas, setTarefas] = useState(TAREFAS_INICIAIS);
12
 
13
// ​
⁠
  ⁠
​Carregar ao abrir
14
useEffect(() => {
15
const carregar = async () => {
16
const dados = await AsyncStorage.getItem('tarefasComStatus');
17
if (dados) setTarefas(JSON.parse(dados));
18
};
19
carregar();
20
}, []);
21
 
22
// ​
⁠
  ⁠
​Alternar concluída de uma tarefa específica
23
const alternarConcluida = async (id) => {
24
const atualizadas = tarefas.map((t) =>
25
t.id === id ? { ...t, concluida: !t.concluida } : t
26
);
27
setTarefas(atualizadas);
28
await AsyncStorage.setItem('tarefasComStatus', JSON.stringify(atualizadas));
29
};
30
 
31
return (
32
<View style={styles.container}>
33
onValueChange Função chamada ao tocar
trackColor Cor da trilha (false/true)
thumbColor Cor do botão circular
Prop O que faz
15/04/2026, 03:52 Aula MDI 06 - Trabalhando com Componentes Diversos & Persistência de Dados
https://whimsical.com/aula-mdi-06-trabalhando-com-componentes-diversos-and-persistenci-BnYExK8M6EVDo3KRjqFquy 10/13
<Text style={styles.titulo}>Minhas Tarefas</Text>
34
<FlatList
35
data={tarefas}
36
keyExtractor={(item) => item.id}
37
renderItem={({ item }) => (
38
<View style={styles.item}>
39
<Text style={[
40
styles.texto,
41
item.concluida && styles.textoConcluido // ← muda aparência
42
]}>
43
{item.texto}
44
</Text>
45
<Switch
46
value={item.concluida}
47
onValueChange={() => alternarConcluida(item.id)}
48
trackColor={{ false: '#ccc', true: '#4caf50' }}
49
/>
50
</View>
51
)}
52
/>
53
</View>
54
);
55
}
56
 
57
const styles = StyleSheet.create({
58
container: { flex: 1, padding: 40, paddingTop: 60 },
59
titulo: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
60
item: {
61
flexDirection: 'row',
62
justifyContent: 'space-between',
63
alignItems: 'center',
64
padding: 12,
65
marginVertical: 4,
66
backgroundColor: '#f5f5f5',
67
borderRadius: 8,
68
},
69
texto: { fontSize: 16, flex: 1 },
70
textoConcluido: {
71
textDecorationLine: 'line-through', // ← riscado!
72
color: '#aaa',
73
},
74
});
75
  ⁠
​Ponto-chave: atualizar um item dentro de um array
// Padrão essencial: mapear e trocar só o item com o id certo
1
const atualizadas = tarefas.map((t) =>
2
t.id === id ? { ...t, concluida: !t.concluida } : t
3
);
4
  O ...t copia todos os campos da tarefa, e só sobrescreve concluida . Isso se chama imutabilidade — nunca
altere o objeto diretamente!
15/04/2026, 03:52 Aula MDI 06 - Trabalhando com Componentes Diversos & Persistência de Dados
https://whimsical.com/aula-mdi-06-trabalhando-com-componentes-diversos-and-persistenci-BnYExK8M6EVDo3KRjqFquy 11/13
  Agora é sua vez: no exercício você vai aplicar exatamente esse padrão — mas partindo do MemoList que já
construímos juntos.
  ⁠
​Exercício Prático
  ⁠
​Desafio: MemoList Plus
Ponto de partida: o app da aula (MemoList).
Missão (escolha 2 ou mais):
[ ] ​
⁠
  ⁠
​Nível 1 — Adicionar um Switch em cada tarefa para marcar como "concluída" (muda a cor do texto)
[ ] ​
⁠
  ⁠
​Nível 2 — Persistir o estado "concluída" no AsyncStorage
[ ] ​
⁠
  ⁠
​Nível 3 — Adicionar um botão "Limpar tudo" que remove todas as tarefas da tela e do storage
[ ] ​
⁠
  ⁠
​Extra — Mostrar um contador de tarefas pendentes no topo da tela
  ⁠
​Resumo da Aula
A fórmula do app que não esquece:
useState (tela) + AsyncStorage (disco) + useEffect (sincronização)
1
  ⁠
​Recursos
  AsyncStorage Docs
  FlatList Docs
  Expo SQLite
  Firebase + Expo
Bora codar! ​
⁠
  ⁠
​
​
⁠
  ⁠
​
  ⁠
​Dúvidas?
Contato:
  profhercules.ramos@fiap.com.br
  LinkedIn
Persistência Dados que sobrevivem ao fechamento do app
AsyncStorage Chave-valor local, só strings → use JSON
useEffect + [] Carregar dados ao iniciar o app
FlatList Lista performática (melhor que .map() )
TextInput Campo de entrada controlado pelo estado
Conceito O que aprendemos
15/04/2026, 03:52 Aula MDI 06 - Trabalhando com Componentes Diversos & Persistência de Dados
https://whimsical.com/aula-mdi-06-trabalhando-com-componentes-diversos-and-persistenci-BnYExK8M6EVDo3KRjqFquy 12/13
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
 
15/04/2026, 03:52 Aula MDI 06 - Trabalhando com Componentes Diversos & Persistência de Dados
https://whimsical.com/aula-mdi-06-trabalhando-com-componentes-diversos-and-persistenci-BnYExK8M6EVDo3KRjqFquy 13/13
