# Aula MDI 04 - Estado, Hooks & Estilização no React Native

Aula MDI 04 - Estado, Hooks & Estilização no React
Native
Engenharia de Software - 3º Ano
Mobile Development & IOT
 
A utilização do uso de soluções para mobile gera o aumento constante da demanda para o desenvolvimento
de aplicações multiplaforma. Nesta matéria você será capacitado como um Mobile Developer, atendendo a
crescente busca por profissionais com esse perfil. Isso significa ter o controle de múltiplas funções na palma
da sua mão entendendo a fundo o conteúdo de desenvolvimento mobile & IoT, e integrando o melhor da
sociedade 5.0 com os resultados obtidos da evolução da indústria 4.0.
  ⁠
​Roadmap de hoje
  ⁠
​O que é Estado?
Pense no estado como a memória de curto prazo do seu componente.
1 O que é estado e por que ele importa?
2 useState — memória do componente
3 useEffect — reagindo a mudanças
4 Estilização no React Native com StyleSheet
5 Mãos na massa com Expo CLI
6 ������ Exercício Prático
# Tópico
15/04/2026, 03:51 Aula MDI 04 - Estado, Hooks & Estilização no React Native
https://whimsical.com/aula-mdi-04-estado-hooks-and-estilizacao-no-react-native-5c6jwPXSLJMtTPiSzVzfKy 1/10
Assim como o Instagram "lembra" quantas curtidas um post tem — o componente precisa lembrar de valores que
mudam.
Sem estado → tela estática (HTML dos anos 90 ​
⁠
  ⁠
​
)
Com estado → tela viva, que reage ao usuário
  ⁠
​useState — O Gancho da Memória
import { useState } from 'react';
1
 
2
const [valor, setValor] = useState(valorInicial);
3
// ​
⁠
  ⁠
​ler ​
⁠
  ⁠
​alterar ​
⁠
  ⁠
​começa com
4
Exemplo real: contador de likes
import { View, Text, Button } from 'react-native';
1
import { useState } from 'react';
2
export default function LikeButton() {
3
const [likes, setLikes] = useState(0);
4
return (
5
<View>
6
<Text>​
⁠
  ⁠
​{likes} curtidas</Text>
7
<Button title="Curtir" onPress={() => setLikes(likes + 1)} />
8
</View>
9
);
10
}
11
  Regra de ouro: nunca altere o estado direto. Sempre use o setter ( setLikes ).
  ⁠
​Ciclo de Vida com useState
15/04/2026, 03:51 Aula MDI 04 - Estado, Hooks & Estilização no React Native
https://whimsical.com/aula-mdi-04-estado-hooks-and-estilizacao-no-react-native-5c6jwPXSLJMtTPiSzVzfKy 2/10
Componente monta → renderiza com estado inicial
1
↓
2
Usuário interage → setter chamado
3
↓
4
Estado muda → componente RE-RENDERIZA
5
↓
6
Tela atualizada ​
⁠
  ⁠
​
7
  ⁠
​useEffect — Reagindo ao Mundo
useEffect é o serviço de entregas do componente.
Você diz: "quando isso acontecer, faça aquilo".
useEffect(() => {
1
// código que roda após render
2
}, [dependências]); // ​
⁠
  ⁠
​array de controle
3
Exemplo: buscar dados da API ao abrir tela
import { useEffect, useState } from 'react';
1
import { Text, View } from 'react-native';
2
export default function Clima() {
3
const [temp, setTemp] = useState(null);
4
useEffect(() => {
5
// Simula uma chamada de API (ex: OpenWeather)
6
setTimeout(() => setTemp(28), 1000);
7
}, []); // roda só uma vez ao montar
8
[] vazio Só na montagem (uma vez)
[valor] Sempre que valor mudar
sem array Toda re-renderização
Dependências Quando executa
15/04/2026, 03:51 Aula MDI 04 - Estado, Hooks & Estilização no React Native
https://whimsical.com/aula-mdi-04-estado-hooks-and-estilizacao-no-react-native-5c6jwPXSLJMtTPiSzVzfKy 3/10
return (
9
<View>
10
<Text>{temp ? `​
⁠
  ⁠
​${temp}°C em SP` : 'Carregando...'}</Text>
11
</View>
12
);
13
}
14
  ⁠
​Estilização no React Native
No RN não existe CSS. Usamos JavaScript que vira CSS nativo.
É como falar português com sotaque carioca — parece igual, mas tem diferenças! ​
⁠
  ⁠
​
import { StyleSheet } from 'react-native';
1
const styles = StyleSheet.create({
2
container: {
3
flex: 1,
4
backgroundColor: '#1a1a2e',
5
alignItems: 'center',
6
justifyContent: 'center',
7
},
8
titulo: {
9
fontSize: 24,
10
color: '#e94560',
11
fontWeight: 'bold',
12
},
13
});
14
  Propriedades em camelCase: background-color → backgroundColor
  ⁠
​Flexbox no React Native
O RN usa Flexbox por padrão — o flexDirection padrão é column (diferente do CSS web!).
<View style={{ flexDirection: 'row', gap: 10 }}>
1
<View style={{ flex: 1, backgroundColor: 'coral', height: 80 }} />
2
<View style={{ flex: 2, backgroundColor: 'skyblue', height: 80 }} />
3
</View>
4
  ⁠
​Juntando tudo — App Temático
import { useState, useEffect } from 'react';
1
flexDirection row column (padrão!)
class ✅ ❌ use style={}
Unidades px, rem, % apenas números
Propriedade CSS Web React Native
15/04/2026, 03:51 Aula MDI 04 - Estado, Hooks & Estilização no React Native
https://whimsical.com/aula-mdi-04-estado-hooks-and-estilizacao-no-react-native-5c6jwPXSLJMtTPiSzVzfKy 4/10
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
2
export default function App() {
3
const [count, setCount] = useState(0);
4
const [msg, setMsg] = useState('Toque para começar!');
5
useEffect(() => {
6
if (count === 5) setMsg('​
⁠
  ⁠
​Você é incrível!');
7
if (count === 10) setMsg('​
⁠
  ⁠
​Nível pro desbloqueado!');
8
}, [count]);
9
return (
10
<View style={styles.container}>
11
<Text style={styles.msg}>{msg}</Text>
12
<Text style={styles.counter}>{count}</Text>
13
<TouchableOpacity style={styles.btn} onPress={() => setCount(count + 1)}>
14
<Text style={styles.btnText}>TAP!</Text>
15
</TouchableOpacity>
16
</View>
17
);
18
}
19
const styles = StyleSheet.create({
20
container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f
0f0f' },
21
msg: { color: '#aaa', fontSize: 16, marginBottom: 12 },
22
counter: { color: '#fff', fontSize: 72, fontWeight: 'bold' },
23
btn: { marginTop: 24, backgroundColor: '#6c63ff', paddingHorizontal: 40, paddingVerti
cal: 16, borderRadius: 50 },
24
btnText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
25
});
26
  ⁠
​Expo CLI — Setup Rápido
Expo é o atalho. É como usar o Vercel pra web — você foca no app, não na config.
# 0. Caso tenha problema de scripts
1
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy Unrestricted
2
 
3
# 1. Criar projeto
4
npx create-expo-app meu-app -t
5
 
6
# 2. Entrar na pasta
7
cd meu-app
8
 
9
# 3. Rodar
10
npx expo start
11
Depois é só escanear o QR code com o app Expo Go no celular — ou rodar no emulador!
15/04/2026, 03:51 Aula MDI 04 - Estado, Hooks & Estilização no React Native
https://whimsical.com/aula-mdi-04-estado-hooks-and-estilizacao-no-react-native-5c6jwPXSLJMtTPiSzVzfKy 5/10
Estrutura de exemplo
meu-app/
1
├── app/ ← suas telas
2
├── assets/ ← imagens, fontes
3
├── components/ ← componentes reutilizáveis
4
└── package.json
5
  ⁠
​Guia Rápido — Links em Texto e Botão
No React Native não existe <a href> . Mas temos o Linking — a API nativa que abre URLs, e-mails, telefones e até
outros apps.
  ⁠
​Importação
import { Linking } from 'react-native';
1
  ⁠
​Link em Texto (estilo hiperlink)
Use <Text> com onPress e Linking.openURL() . Combine com estilo para parecer um link de verdade.
import { Text, StyleSheet } from 'react-native';
1
import { Linking } from 'react-native';
2
 
3
export default function LinkTexto() {
4
return (
5
<Text
6
style={styles.link}
7
onPress={() => Linking.openURL(' }
8 https://expo.dev')
>
9
​
⁠
  ⁠
​Acessar documentação do Expo
10
</Text>
11
);
12
}
13
 
14
15/04/2026, 03:51 Aula MDI 04 - Estado, Hooks & Estilização no React Native
https://whimsical.com/aula-mdi-04-estado-hooks-and-estilizacao-no-react-native-5c6jwPXSLJMtTPiSzVzfKy 6/10
const styles = StyleSheet.create({
15
link: {
16
color: '#4fc3f7',
17
textDecorationLine: 'underline',
18
fontSize: 16,
19
},
20
});
21
  ⁠
​Link em Botão (TouchableOpacity)
Use TouchableOpacity para ter controle total do estilo do botão.
import { TouchableOpacity, Text, Linking, StyleSheet } from 'react-native';
1
 
2
export default function BotaoLink() {
3
return (
4
<TouchableOpacity
5
style={styles.botao}
6
onPress={() => Linking.openURL(' }
7 https://github.com')
>
8
<Text style={styles.texto}>​
⁠
  ⁠
​Abrir GitHub</Text>
9
</TouchableOpacity>
10
);
11
}
12
 
13
const styles = StyleSheet.create({
14
botao: {
15
backgroundColor: '#24292e',
16
paddingHorizontal: 24,
17
paddingVertical: 12,
18
borderRadius: 8,
19
},
20
texto: {
21
color: '#fff',
22
fontWeight: 'bold',
23
},
24
});
25
  ⁠
​Tipos de URL suportados
Site web https://fiap.com.br
E-mail mailto:contato@fiap.com.br
Telefone tel:+5511999999999
WhatsApp whatsapp://send?phone=5511999999999
Maps https://maps.google.com/?q=FIAP+SP
Tipo Exemplo
15/04/2026, 03:51 Aula MDI 04 - Estado, Hooks & Estilização no React Native
https://whimsical.com/aula-mdi-04-estado-hooks-and-estilizacao-no-react-native-5c6jwPXSLJMtTPiSzVzfKy 7/10
// Abrir WhatsApp direto no contato
1
Linking.openURL('whatsapp://send?phone=5511999999999&text=Olá!');
2
 
3
// Abrir e-mail com assunto preenchido
4
Linking.openURL('mailto:prof@fiap.com.br?subject=Dúvida Aula 04');
5
  Dica: use await Linking.canOpenURL(url) antes de abrir para verificar se o app/protocolo está disponível no
dispositivo.
  ⁠
​Comparativo rápido
  ⁠
​Exercício Prático
  ⁠
​App: Contador de Hidratação
Crie um app simples que ajuda o usuário a registrar quantos copos d'água bebeu no dia (inspirado em apps como
Plant Nanny ou o lembrete de água do Apple Watch).
Requisitos
[ ] Mostrar o total de copos bebidos na tela
[ ] Botão + para adicionar um copo
[ ] Botão Resetar para zerar o dia
[ ] Quando atingir 8 copos, exibir mensagem: "​
⁠
  ⁠
​Meta do dia atingida!"
[ ] Estilizar o app com StyleSheet (fundo escuro, texto grande, botões coloridos)
[ ] Usar useEffect para detectar quando a meta for atingida
Dica de estrutura
export default function HidratacaoApp() {
1
const [copos, setCopos] = useState(0);
2
const [meta, setMeta] = useState(false);
3
useEffect(() => {
4
// sua lógica aqui
5
}, [copos]);
6
return (
7
// sua UI aqui
8
);
9
}
10
Bônus ​
⁠
  ⁠
​
Adicionar um emoji de copo ( ​
⁠
  ⁠
​
) para cada unidade registrada
<Text onPress> Link inline no meio de um parágrafo
<TouchableOpacity> Botão estilizado que abre link
<Pressable> Quando precisa de feedback visual avançado (iOS/Android)
Componente Quando usar
15/04/2026, 03:51 Aula MDI 04 - Estado, Hooks & Estilização no React Native
https://whimsical.com/aula-mdi-04-estado-hooks-and-estilizacao-no-react-native-5c6jwPXSLJMtTPiSzVzfKy 8/10
Mudar a cor do fundo quando a meta for atingida
  Tempo: 30 minutos
  ⁠
​Resumo da Aula
  ⁠
​Próxima Aula
Aula 05 — Layout, Telas e Navegação com Expo Router
Vamos criar apps com múltiplas telas e navegação tipo Instagram/TikTok ​
⁠
  ⁠
​
  ⁠
​Dúvidas?
Contato:
  profhercules.ramos@fiap.com.br
  LinkedIn
#KeepCoding #ReactNative #FIAP
useState Armazena dados que mudam Memória RAM do componente
useEffect Reage a mudanças / ciclo de vida Serviço de notificações
StyleSheet Estiliza componentes CSS com sotaque JS
Flexbox Layout responsivo Grade invisível que organiza tudo
Expo CLI Ambiente de dev simplificado Vercel do React Native
Conceito Para que serve Analogia
15/04/2026, 03:51 Aula MDI 04 - Estado, Hooks & Estilização no React Native
https://whimsical.com/aula-mdi-04-estado-hooks-and-estilizacao-no-react-native-5c6jwPXSLJMtTPiSzVzfKy 9/10
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
 
15/04/2026, 03:51 Aula MDI 04 - Estado, Hooks & Estilização no React Native
https://whimsical.com/aula-mdi-04-estado-hooks-and-estilizacao-no-react-native-5c6jwPXSLJMtTPiSzVzfKy 10/10
