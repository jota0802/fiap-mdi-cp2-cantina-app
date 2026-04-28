# 🍔 App Cantina FIAP

Aplicativo mobile para pedidos na cantina da FIAP. Faça seu pedido pelo celular, receba uma senha e retire no balcão — sem filas, sem espera.

> **Checkpoint 2** — Mobile Development & IoT (FIAP — Engenharia de Software, 3º Ano).
> Evolução do CP1 com autenticação completa, persistência local, estado global, validação inline e 6+ diferenciais técnicos.

---

## 👥 Integrantes do Grupo

| #  | Nome               | RM     |
|----|--------------------|--------|
| 1  | Lucca Borges       | 554608 |
| 2  | Ruan Melo          | 557599 |
| 3  | Rodrigo Jimenez    | 558148 |
| 4  | João Victor Franco | 556790 |

---

## 📱 Sobre o Projeto

### Problema
A fila na cantina da FIAP gera perda de tempo nos intervalos entre aulas. Alunos enfrentam incerteza sobre disponibilidade de itens e demora no atendimento, especialmente nos horários de pico. Muitos desistem de comprar por falta de tempo.

### Operação da FIAP escolhida
**Cantina** — operação de alta frequência diária com gargalo conhecido (filas em horários de pico).

### Solução
Um app estilo fast-food (BK, McDonald's) onde o aluno:

1. Cria conta com nome, e-mail e senha
2. Faz login (sessão fica salva — não precisa logar de novo ao reabrir)
3. Navega pelo cardápio digital com **busca em tempo real**
4. Monta o pedido com controle de quantidade
5. Confirma e recebe uma **senha de 3 dígitos**
6. É **notificado** quando o pedido está pronto (3 minutos após confirmar)
7. Acompanha o **histórico de pedidos** com status (preparando / pronto / retirado)
8. Personaliza foto de perfil e tema (claro / escuro)

### O que mudou em relação ao CP1

**Funcionalidades novas:**
- Sistema completo de autenticação (cadastro + login + logout) com sessão persistida
- Persistência de pedidos no histórico via AsyncStorage por usuário
- 4 contexts globais (Theme, Auth, Cart, Orders)
- Validação inline em todos os formulários (sem `Alert` ou modais)
- Tab **Pedidos** com histórico, status e pull-to-refresh
- Tab **Perfil** com foto (câmera/galeria), tema dinâmico e logout
- Tela **Sobre** virou Stack screen acessível pelo Perfil
- 6 diferenciais técnicos + 1 bônus implementados

**Refinamentos:**
- Migração 100% para **TypeScript strict** com `noUncheckedIndexedAccess`
- Refatoração de todas as telas para usar **tema dinâmico** via `useTheme()`
- `ActivityIndicator` e dots animados em todos os loadings
- **Skeleton loaders** nas telas com dados assíncronos
- Animações suaves (fade-in, scale, shake, pulse, slide, spring)
- **Feedback tátil** (haptics) em ações importantes

---

## 🚀 Como Rodar

### Pré-requisitos
- [Node.js](https://nodejs.org/) v18+
- [Expo Go](https://expo.dev/go) instalado no celular (iOS ou Android), ou emulador
- Git

### Passo a passo

```bash
# 1. Clone o repositório
git clone https://github.com/jota0802/app-cantina.git

# 2. Entre na pasta
cd app-cantina

# 3. Instale as dependências
npm install

# 4. Rode o projeto
npx expo start
```

Depois escaneie o QR Code com o **Expo Go** no celular, ou pressione:
- `a` → abre Android Emulator
- `i` → abre iOS Simulator (somente Mac)
- `w` → abre no navegador (algumas funcionalidades nativas — câmera, notificações, haptics — não funcionam no web)

### Validar o build
```bash
npm run typecheck  # checa TypeScript strict
```

---

## 🎨 Demonstração

### Telas principais

| # | Tela | Descrição |
|---|------|-----------|
| 1 | **Login** | E-mail + senha, validação inline, shake nos erros |
| 2 | **Cadastro** | Nome + e-mail + senha + confirma, 4 validações |
| 3 | **Início** | Hero animado, "Como funciona" em 3 passos, destaques |
| 4 | **Cardápio** | Lista por categoria + busca em tempo real + badge animado |
| 5 | **Confirmação** | Loading com dots, checkmark animado, senha com spring scale |
| 6 | **Pedidos** | Histórico com status, pull-to-refresh, skeleton loaders |
| 7 | **Perfil** | Foto, stats, tema toggle, logout, link Sobre |
| 8 | **Sobre** | Cards do projeto, integrantes, tecnologias, decisões |

> 📸 Os prints e o GIF da demonstração ficam em [`screenshots/`](./screenshots).
> 📝 Veja [`docs/CAPTURAR-PRINTS.md`](./docs/CAPTURAR-PRINTS.md) para o guia de captura.

### Vídeo do fluxo completo
> 🎬 [Link do vídeo no YouTube/Drive — adicionar antes da entrega]

---

## ⭐ Diferenciais Implementados

> O CP2 exige **pelo menos 1 diferencial**. Implementamos **6 da lista oficial + 1 bônus**.

### 1️⃣ Expo SecureStore — Armazenamento seguro de credenciais
**Arquivo:** [`lib/secure-store.ts`](./lib/secure-store.ts) + [`lib/hash.ts`](./lib/hash.ts)
**Por quê:** Credenciais sensíveis (mesmo em hash) não devem ficar no AsyncStorage cru. SecureStore usa **Keychain** (iOS) e **Keystore** (Android), que são armazenamentos criptografados nativos do SO.
**Como:** O `signUp` calcula SHA-256 + salt via `expo-crypto` e salva no SecureStore com chave `cantina.password_hash_<userId>`. O `signIn` lê e compara hashes.

### 2️⃣ Animações com Animated API
**Onde:**
- Cardápio: pulse no badge do carrinho a cada mudança, scale no contador `+/-` de cada item
- Login/Cadastro: shake horizontal nos erros (5 frames de 50ms)
- Confirmação: checkmark com spring + senha aparecendo com scale 0→1 + fade
- Home: fade-in com translateY suave no header
- Loading: 3 dots saltando em loop com `Animated.loop`
- Toast: slide-down com spring + auto-fade
- Botões: scale 0.97 no press

**Por quê:** Microinterações reduzem percepção de latência, dão feedback imediato e sobem a sensação de qualidade do app sem custo de performance (todas usam `useNativeDriver: true`).

### 3️⃣ Modo Escuro / Tema Dinâmico
**Arquivo:** [`context/ThemeContext.tsx`](./context/ThemeContext.tsx)
**Onde:** Toggle no Perfil que alterna entre `dark` e `light`. Persistido no AsyncStorage e respeita o esquema do sistema no boot.
**Por quê:** Acessibilidade visual — respeita preferência do usuário e ambientes diferentes (dia/noite). **Todas as 8 telas reagem instantaneamente** via `useTheme()` (não há cor hardcoded).

### 4️⃣ Notificações Locais (`expo-notifications`)
**Arquivo:** [`lib/notifications.ts`](./lib/notifications.ts)
**Onde:** Após confirmar pedido em [`app/confirmacao.tsx`](./app/confirmacao.tsx).
- 🔔 **Imediata**: "Pedido confirmado · senha XYZ"
- ⏰ **Agendada (3 min)**: "Senha XYZ pronta para retirada"

**Por quê:** Reproduz UX de apps reais (iFood, Rappi). O usuário não precisa ficar olhando o app — é avisado quando o pedido está pronto.

### 5️⃣ Câmera & Galeria (`expo-image-picker`)
**Arquivo:** [`lib/image-picker.ts`](./lib/image-picker.ts)
**Onde:** Tela Perfil tem **três** botões: "Tirar Foto" (câmera), "Galeria" (biblioteca) e "Remover".
**Por quê:** Personalização aumenta engajamento e ajuda na identificação no balcão. A URI fica persistida no AsyncStorage como parte do `User`.

### 6️⃣ Busca e Filtragem em Tempo Real
**Arquivo:** [`app/(tabs)/cardapio.tsx`](./app/(tabs)/cardapio.tsx)
**Onde:** Tela Cardápio. `TextInput` no header filtra itens em tempo real por **nome**, **descrição** ou **categoria**. Botão `X` aparece quando há texto, EmptyState dedicado se 0 resultados.
**Por quê:** Cardápios crescem. Busca por nome reduz fricção e copia padrão de apps consolidados (iFood, Rappi).

### ✨ Bônus: Feedback Tátil (`expo-haptics`)
**Arquivo:** [`lib/haptics.ts`](./lib/haptics.ts)
**Onde:** add/remove item, confirmar pedido, login OK/erro, cadastro OK/erro, logout.
**Por quê:** Aumenta sensação de qualidade premium — vibração leve confirma a ação sem precisar olhar para a tela.

---

## 🏗️ Decisões Técnicas

### Estrutura de Pastas

```
app-cantina/
├── app/                          # Rotas Expo Router (file-based)
│   ├── (auth)/                   # Grupo: rotas públicas
│   │   ├── _layout.tsx           # Stack + redirect se já logado
│   │   ├── login.tsx
│   │   └── cadastro.tsx
│   ├── (tabs)/                   # Grupo: rotas autenticadas
│   │   ├── _layout.tsx           # Tabs + AUTH GATE (redirect se !user)
│   │   ├── index.tsx             # Início (home)
│   │   ├── cardapio.tsx          # Cardápio + busca em tempo real
│   │   ├── pedidos.tsx           # Histórico
│   │   └── perfil.tsx            # Foto, tema, logout
│   ├── _layout.tsx               # Root: Providers + Splash + StatusBar
│   ├── confirmacao.tsx           # Stack screen (slide_from_bottom)
│   └── sobre.tsx                 # Stack screen (slide_from_right)
├── components/                   # UI reutilizável
│   ├── Button.tsx
│   ├── EmptyState.tsx
│   ├── FiapLogo.tsx
│   ├── Input.tsx
│   ├── ItemCardapio.tsx
│   ├── LoadingScreen.tsx
│   ├── ProfileAvatar.tsx
│   ├── Skeleton.tsx
│   └── Toast.tsx
├── context/                      # Estados globais (Context API)
│   ├── AuthContext.tsx           # user, signUp, signIn, signOut, updateUser
│   ├── CartContext.tsx           # items, totalItens, totalPreco, addItem, removeItem
│   ├── OrdersContext.tsx         # orders, addOrder, markPronto, markRetirado
│   └── ThemeContext.tsx          # mode, colors, toggleTheme
├── hooks/
│   ├── useFadeIn.ts              # fade + translate suaves no mount
│   └── useShake.ts               # shake horizontal de 250ms
├── lib/                          # Wrappers de APIs nativas
│   ├── hash.ts                   # SHA-256 + salt via expo-crypto
│   ├── haptics.ts                # Wrapper expo-haptics seguro
│   ├── image-picker.ts           # Wrapper expo-image-picker (galeria + câmera)
│   ├── notifications.ts          # Wrapper expo-notifications (imediata + agendada)
│   └── secure-store.ts           # Wrapper expo-secure-store + fallback web
├── data/cardapio.ts              # Mock dos 8 itens (3 categorias)
├── types/index.ts                # Tipos compartilhados (User, Order, etc.)
├── constants/
│   ├── theme.ts                  # Paletas dark/light + tipo + spacing + radius
│   └── storage-keys.ts           # Chaves do AsyncStorage centralizadas
├── docs/                         # Materiais das aulas + spec do CP2 + guia de prints
├── screenshots/                  # Prints da demonstração visual
├── assets/                       # Ícones, fontes, splash
├── tsconfig.json                 # TypeScript strict
└── app.json                      # Config Expo (plugins: expo-router, expo-secure-store)
```

### Contexts criados — qual gerencia o quê

| Contexto | Responsabilidade | Persistência |
|---|---|---|
| `ThemeContext` | Tema `dark`/`light`, paleta de cores derivada, toggle | AsyncStorage `@cantina:theme` |
| `AuthContext` | Usuário logado, signUp, signIn, signOut, updateUser, hidratação no boot | AsyncStorage (lista de users + sessão) + SecureStore (hash) |
| `CartContext` | Carrinho de compras isolado por usuário | AsyncStorage `@cantina:cart:{userId}` |
| `OrdersContext` | Histórico de pedidos isolado por usuário, gestão de status | AsyncStorage `@cantina:orders:{userId}` |

### Como a autenticação foi implementada

1. **Cadastro**: nome, email (regex validado), senha (≥6 chars), confirmação (= senha). Senha vira hash SHA-256 com salt via `expo-crypto`.
2. **Armazenamento**: dados do user (id, nome, email, fotoUri, criadoEm) ficam no AsyncStorage com chave `@cantina:users` (array). **Hash da senha fica isolado no SecureStore** com chave `cantina.password_hash_<userId>`.
3. **Login**: busca user por email, lê hash do SecureStore, compara. Se válido, salva sessão (`@cantina:session = userId`).
4. **Sessão persistida**: ao abrir o app, o `AuthContext` lê `@cantina:session` no boot e re-popula o `user` se existir. **O usuário continua logado mesmo após fechar o app.**
5. **Logout**: remove apenas a sessão. O hash continua no SecureStore (usuário pode logar novamente sem recadastrar).

### Como a navegação protegida foi implementada

- O `app/_layout.tsx` (root) wrappa toda a árvore com `<ThemeProvider><AuthProvider><CartProvider><OrdersProvider>`.
- O `app/(tabs)/_layout.tsx` consulta `useAuth()`. Se `!user`, renderiza `<Redirect href="/login" />` — bloqueia acesso a qualquer tela em `(tabs)`.
- O `app/(auth)/_layout.tsx` faz o **gate reverso**: se `user` existe, redireciona para `/`.
- O `app/_layout.tsx` mostra `<LoadingScreen />` enquanto `auth.isHydrating` é `true` ou `!fontsLoaded`, evitando flash de tela errada.

### AsyncStorage — chaves e responsabilidades

| Chave | Conteúdo | Por usuário? |
|---|---|---|
| `@cantina:users` | Lista de todos os usuários cadastrados (sem senha) | Não |
| `@cantina:session` | ID do usuário logado | Não |
| `@cantina:cart:{userId}` | Carrinho do usuário | ✅ |
| `@cantina:orders:{userId}` | Histórico de pedidos | ✅ |
| `@cantina:theme` | `'dark'` ou `'light'` | Não |

### SecureStore — chaves

| Chave | Conteúdo |
|---|---|
| `cantina.password_hash_{userId}` | Hash SHA-256 + salt da senha |

### Validação de formulários (zero `Alert`)

Atende literalmente o requisito do CP2:
- ✅ Erros aparecem **abaixo do campo correspondente**, em vermelho
- ✅ **Sem `Alert`/modal** — apenas inline
- ✅ Botão de submit **desabilitado** enquanto há erros visíveis
- ✅ Validação roda em tempo real após o primeiro submit (não atrapalha primeira digitação)
- ✅ Shake horizontal + haptic.error reforçam o erro visualmente e tatilmente

### TypeScript strict

```json
{
  "strict": true,
  "noImplicitAny": true,
  "strictNullChecks": true,
  "noUncheckedIndexedAccess": true
}
```

`npm run typecheck` deve sempre passar com exit code 0.

---

## 📦 Tecnologias

| Categoria | Lib |
|---|---|
| **Core** | React Native 0.83 · Expo SDK 55 · React 19 |
| **Tipagem** | TypeScript 5 (strict + noUncheckedIndexedAccess) |
| **Roteamento** | Expo Router 55 (file-based, Stack + Tabs) |
| **Persistência** | @react-native-async-storage/async-storage |
| **Segurança** | expo-secure-store + expo-crypto (SHA-256) |
| **Notificações** | expo-notifications |
| **Mídia** | expo-image-picker (câmera + galeria) |
| **Feedback** | expo-haptics |
| **Tipografia** | @expo-google-fonts/manrope (5 pesos) |
| **Ícones** | @expo/vector-icons (Ionicons) |
| **Gráficos** | react-native-svg (logo FIAP) |

---

## 🛣️ Próximos Passos

Funcionalidades que implementaríamos com mais tempo:

- [ ] Backend real (Firebase/Supabase) para sincronizar pedidos entre devices
- [ ] Sistema de avaliação dos itens
- [ ] Cupons de desconto e promoções
- [ ] Pagamento integrado (Pix / cartão)
- [ ] Múltiplos endereços de retirada (campus diferentes)
- [ ] Animação cross-fade da tela inteira ao trocar tema
- [ ] Internacionalização (i18n) PT/EN/ES
- [ ] Testes automatizados (Jest + RNTL + Detox)

---

FIAP — Engenharia de Software — 3º Ano — Mobile Development & IoT — 2026
