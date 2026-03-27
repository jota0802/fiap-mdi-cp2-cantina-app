# Cantina FIAP

Aplicativo mobile para pedidos na cantina da FIAP. Faça seu pedido pelo celular, receba uma senha e retire no balcão — sem filas, sem espera.

## Integrantes do Grupo

| #  | Nome               | RM     |
|----|--------------------|--------|
| 1  | Lucca Borges       | 554608 |
| 2  | Ruan Melo          | 557599 |
| 3  | Rodrigo Jimenez    | 558148 |
| 4  | João Victor Franco | 556790 |

## Sobre o Projeto

### Problema

A fila na cantina da FIAP gera perda de tempo nos intervalos entre aulas. Alunos enfrentam incerteza sobre disponibilidade de itens e demora no atendimento, especialmente nos horários de pico. Muitos desistem de comprar por falta de tempo.

### Solução

Um app estilo fast-food (BK, McDonald's) onde o aluno:

1. Navega pelo cardápio digital
2. Monta seu pedido com quantidades
3. Confirma e recebe uma **senha de 3 dígitos**
4. Retira no balcão quando o número for chamado no painel

### Funcionalidades

- Cardápio digital organizado por categorias (Bebidas, Lanches, Sobremesas)
- Sistema de adicionar/remover itens com controle de quantidade
- Cálculo automático do total do pedido
- Tela de loading durante processamento do pedido
- Geração de senha aleatória para retirada
- Resumo completo do pedido na confirmação
- Tratamento de estado vazio (sem itens no carrinho)
- Navegação completa entre todas as telas

## Como Rodar o Projeto

### Pré-requisitos

- [Node.js](https://nodejs.org/) (v18 ou superior)
- [Expo Go](https://expo.dev/go) instalado no celular (para testar no dispositivo físico)
- Git

### Passo a passo

```bash
# 1. Clone o repositório
git clone https://github.com/jota0802/fiap-mdi-cp1-cantina-app.git

# 2. Entre na pasta do projeto
cd fiap-mdi-cp1-cantina-app

# 3. Instale as dependências
npm install

# 4. Rode o projeto
npx expo start
```

Depois escaneie o QR Code com o app **Expo Go** no celular, ou pressione `w` para abrir no navegador, ou `a` para abrir no emulador Android.

## Demonstração

### Telas do App

#### Tela 1 — Home

Tela inicial com logo FIAP, seção "Como Funciona" em 3 passos e destaques do cardápio.

<!-- Substituir pelo print real -->
> _Print da tela Home aqui_

#### Tela 2 — Cardápio

Cardápio completo organizado por categorias. O aluno adiciona e remove itens com os botões +/−. Uma barra inferior mostra o total em tempo real.

<!-- Substituir pelo print real -->
> _Print da tela Cardápio aqui_

#### Tela 3 — Confirmação

Após confirmar o pedido, uma tela de loading aparece por 1.5s simulando o processamento. Em seguida, a senha de 3 dígitos é exibida junto com o resumo do pedido.

<!-- Substituir pelo print real -->
> _Print da tela Confirmação aqui_

#### Tela 4 — Sobre

Informações sobre o projeto, problema identificado, solução, integrantes e tecnologias utilizadas.

<!-- Substituir pelo print real -->
> _Print da tela Sobre aqui_

### Vídeo / GIF

<!-- Substituir pelo GIF ou link do vídeo -->
> _GIF ou link do vídeo demonstrando o fluxo principal aqui_

## Decisões Técnicas

### Estrutura do Projeto

```text
fiap-mdi-cp1-cantina-app/
├── app/
│   ├── _layout.js              # Stack raiz + carregamento da fonte Manrope
│   ├── (tabs)/
│   │   ├── _layout.js          # Navegação por Tabs (Início, Cardápio, Sobre)
│   │   ├── index.js            # Tela Home
│   │   ├── cardapio.js         # Tela Cardápio com carrinho
│   │   └── sobre.js            # Tela Sobre
│   └── confirmacao.js          # Tela Confirmação (Stack push)
├── components/
│   ├── ItemCardapio.js         # Componente reutilizável de item do cardápio
│   └── FiapLogo.js             # Logo FIAP renderizada em SVG
├── data/
│   └── cardapio.js             # Dados do cardápio (8 itens, 3 categorias)
└── assets/                     # Ícones e imagens do Expo
```

### Hooks Utilizados

| Hook | Arquivo | Finalidade |
|------|---------|------------|
| `useState` | `cardapio.js` | Gerenciar quantidades dos itens no carrinho |
| `useState` | `confirmacao.js` | Controlar estado de loading e senha gerada |
| `useEffect` | `confirmacao.js` | Gerar senha aleatória após 1.5s (simula processamento) |
| `useFonts` | `_layout.js` | Carregar fonte Manrope do Google Fonts |

### Navegação

- **Expo Router** com layout híbrido: `Tabs` (3 abas) + `Stack` (confirmação empilhada)
- **Tabs:** Home, Cardápio, Sobre
- A tela de Confirmação é acessada via `router.push()` com parâmetros (total, itens, resumo)
- Retorno ao início via `router.replace()` para limpar a pilha de navegação

### Estilização

- **StyleSheet** nativo do React Native em todos os componentes
- Design minimalista dark (background `#0A0A0A`)
- Cor primária FIAP: `#ED145B`
- Fonte **Manrope** (Google Fonts) com 5 pesos (Regular, Medium, SemiBold, Bold, ExtraBold)
- Todos os títulos em CAPS com `letterSpacing`
- Logo FIAP renderizada como SVG via `react-native-svg`

### Componentes Reutilizáveis

| Componente | Descrição |
|------------|-----------|
| `FiapLogo` | Renderiza a logo da FIAP em SVG com props de `width` e `color` customizáveis |
| `ItemCardapio` | Card de item do cardápio com emoji, nome, descrição, preço e controles de quantidade (+/−) |

### Passagem de Dados entre Telas

A tela de **Cardápio** calcula o total e monta o resumo dos itens selecionados, passando via `router.push()` com `params`:

```js
router.push({
  pathname: '/confirmacao',
  params: {
    total: totalPreco.toFixed(2),
    itens: totalItens,
    resumo: itensResumo,
  },
});
```

Na tela de **Confirmação**, os dados são recuperados com `useLocalSearchParams()`.

## Próximos Passos

- Integração com backend para cardápio dinâmico e preços em tempo real
- Sistema de pagamento integrado (PIX, cartão)
- Painel administrativo para a cantina gerenciar pedidos e chamar senhas
- Notificações push quando o pedido estiver pronto
- Histórico de pedidos do aluno
- Autenticação com RM do aluno

---

FIAP — Engenharia de Software — 3º Ano — Mobile Development & IoT — 2026
