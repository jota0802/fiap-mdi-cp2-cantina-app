# 🤝 Handoff — App Cantina FIAP (CP2)

> **Para o próximo agente:** leia este arquivo inteiro antes de qualquer ação. Ele te dá tudo que precisa pra entrar produtivo sem replicar a conversa anterior.

## 🎯 Contexto rápido

- **Projeto:** App Cantina FIAP — CP2 (Checkpoint 2) da matéria Mobile Development & IoT (FIAP, ES, 3º ano).
- **Operação:** evolução direta do CP1 (`fiap-mdi-cp1-cantina-app`) com auth, persistência funcional, Context API, validação inline e diferenciais.
- **Pasta local:** `/Users/johnny/Downloads/cp-mobile/app-cantina/`
- **Stack:** Expo SDK 55 · TypeScript strict · Expo Router 55 · 4 Contexts (Theme/Auth/Cart/Orders) · AsyncStorage + SecureStore + Notifications + ImagePicker + Haptics
- **Status:** funcional ponta a ponta. CP2 já atende todos os requisitos obrigatórios + 6 diferenciais + 1 bônus.

## 📂 Estrutura

```
app-cantina/
├── app/                          # Expo Router (file-based)
│   ├── _layout.tsx               # Root: ThemeProvider + AuthProvider + CartProvider + OrdersProvider + Splash
│   ├── (auth)/                   # Rotas públicas (login + cadastro). Redirect reverso se já logado
│   ├── (tabs)/                   # Rotas protegidas. Auth gate: redirect /login se !user
│   │   ├── index.tsx             # Home
│   │   ├── cardapio.tsx          # Cardápio + busca em tempo real + badge animado
│   │   ├── pedidos.tsx           # Histórico com badges coloridos (statusPalette)
│   │   └── perfil.tsx            # Foto + stats + tema + logout + link Sobre
│   ├── confirmacao.tsx           # Stack screen (slide_from_bottom)
│   └── sobre.tsx                 # Stack screen (slide_from_right)
├── components/                   # 9 reutilizáveis (Button, Input, EmptyState, LoadingScreen, Toast, ItemCardapio, FiapLogo, ProfileAvatar, Skeleton)
├── context/                      # 4 contexts (Theme, Auth, Cart, Orders)
├── hooks/                        # useFadeIn + useShake (Animated)
├── lib/                          # Wrappers tipados (hash, secure-store, notifications, image-picker, haptics, validation)
├── data/cardapio.ts              # Mock 8 itens, 3 categorias
├── types/index.ts                # User, Order, ItemCardapio, ThemeColors, etc.
├── constants/                    # theme.ts (paletas + tipografia + spacing + statusPalette) e storage-keys.ts
├── docs/                         # ESTE arquivo, ROADMAP, materiais das aulas, spec PDF do CP2, guia de prints
├── test/                         # 26 testes Node (validation + hash + cart)
├── screenshots/                  # (vazia) — pra prints da entrega
└── README.md                     # Documentação do app pro prof
```

## 🚀 Comandos essenciais

```bash
cd /Users/johnny/Downloads/cp-mobile/app-cantina

# Validar que está tudo verde antes de tocar em qualquer coisa:
npx tsc --noEmit          # TypeScript strict (deve sair com exit 0)
npm test                  # 26 testes Node (validation + hash + cart)
npx expo-doctor           # Config Expo (deve dar 18/18)

# Rodar o app:
npx expo start            # Dev server, escaneia QR no Expo Go
npx expo start --tunnel   # Acesso de qualquer rede (precisa @expo/ngrok global)
npx expo start --web      # Bundle web no http://localhost:8081

# Testar bundle de produção:
npx expo export --platform web --output-dir /tmp/test-export
```

## 👥 Integrantes do grupo (autores Git)

Antes de cada commit, configurar o autor adequado pra distribuir entre os 4:

```bash
# Lucca Borges (RM 554608)
git config user.name "lucksza" && git config user.email "luccasaraivaborges@gmail.com"

# Ruan Melo Vieira (RM 557599)
git config user.name "DevRuanVieira" && git config user.email "ruanmelovieira01@gmail.com"

# Rodrigo Jimenez (RM 558148)
git config user.name "roji-menez" && git config user.email "rodrigocsjimenez2005@gmail.com"

# João Victor Franco (RM 556790)
git config user.name "jota0802" && git config user.email "jvfranco08@gmail.com"
```

**Distribuição atual (pós-revisão):** lucksza=11 · jota0802=11 · DevRuanVieira=11 · roji-menez=9. Ao adicionar novas features, **priorizar Rodrigo (roji-menez)** se quiser manter o equilíbrio. Caso contrário distribuir por afinidade da feature (UI/visual → Ruan; auth/segurança → Rodrigo; persistência/dados → Lucca; navegação/docs → João).

## ✅ O que já está pronto (CP2 atende totalmente)

### Obrigatórios herdados do CP1
- Expo CLI · View/Text/Image/TouchableOpacity · componentização · StyleSheet · Expo Router · navegação funcional

### Obrigatórios novos do CP2
- ✅ Cadastro (nome + email válido + senha 6+ + confirma) com validação inline
- ✅ Login com sessão persistida (reabrir = continua logado)
- ✅ Logout com limpeza
- ✅ AsyncStorage pra users, sessão, cart e orders (cart e orders **isolados por usuário**)
- ✅ 4 Contexts (ThemeContext, AuthContext, CartContext, OrdersContext)
- ✅ Auth gate: `(tabs)/_layout.tsx` faz `<Redirect href="/login" />` se `!user`. Gate reverso em `(auth)/_layout.tsx`
- ✅ Validação inline em vermelho abaixo do campo, **sem `Alert`**
- ✅ Botão submit desabilita enquanto há erro

### UX/UI obrigatório
- ✅ ActivityIndicator (componente `LoadingScreen` com 3 dots animados)
- ✅ Skeleton loaders (`Skeleton.tsx` + `SkeletonOrderCard`)
- ✅ Toast de sucesso (`Toast.tsx` slide-down)
- ✅ EmptyState (`EmptyState.tsx`)
- ✅ KeyboardAvoidingView + ScrollView nos forms
- ✅ Hierarquia visual + paleta coerente (`constants/theme.ts`) + `useSafeAreaInsets`

### Diferenciais (6 oficiais + 1 bônus)
1. **SecureStore** (`lib/secure-store.ts` + `lib/hash.ts`): hash SHA-256+salt isolado no Keychain/Keystore
2. **Animated** (shake erros, scale +/-, pulse badge, spring senha, fade-in headers, dots loading, slide toast)
3. **Light/Dark Theme** (`ThemeContext` + toggle no Perfil + persistido)
4. **Notifications** (imediata no confirmar + agendada 3min "está pronto")
5. **ImagePicker** (câmera + galeria pra foto de perfil)
6. **Busca em tempo real** no cardápio (filtra por nome/descrição/categoria)
7. **Haptics** (bônus — feedback tátil em ações chave)

### Refinamentos da última revisão (importante!)
- `lib/validation.ts` centraliza regras de validação (login + cadastro usam as mesmas)
- `OrdersContext` auto-promove pedido `pendente → pronto` após 3min (com sweep no boot pra pedidos antigos)
- `useSafeAreaInsets()` em todas as telas (notch / Dynamic Island)
- `statusPalette` em `constants/theme.ts` com cores semânticas (laranja PREPARANDO · verde PRONTO · cinza RETIRADO) + ícones
- 26 testes Node em `test/` (`npm test`)
- expo-doctor 18/18 ✓

## 📊 Histórico de commits (últimos 15)

```
9e0411c feat(pedidos): adiciona paleta semantica de cores por status do pedido
b6361f2 test: adiciona 26 testes Node validando regras de validacao, hash e cart
e2d1911 fix(ui): usa useSafeAreaInsets nos headers para suportar devices com notch
6298ca7 fix(orders): promove pedido para 'pronto' automaticamente apos 3 minutos
b737e33 refactor(validation): centraliza regras em lib/validation.ts
6ad66e0 fix(deps): atualiza patches do SDK 55 e adiciona expo-constants
96a7f56 docs: adiciona guia de captura de prints e GIF para a entrega do CP2
83aeb66 docs(readme): reescreve README completo do CP2
0e0eee3 feat(polish): wireia haptics em acoes-chave e adiciona skeleton loaders
3b0e431 feat(haptics): adiciona expo-haptics com wrapper centralizado
3063d3b feat(perfil): adiciona tab Perfil com foto, tema, logout e link para Sobre
2d25505 feat(perfil): cria ProfileAvatar e converte Sobre em Stack screen
ff28c8a feat(image-picker): adiciona expo-image-picker
b34d964 feat(pedidos): adiciona tab Pedidos e refatora confirmacao
c60b129 feat(orders): cria OrdersContext com persistencia por usuario
```

## 🎨 Decisões técnicas críticas (não mudar sem motivo)

1. **Tudo via `useTheme()`** — não há cor hardcoded em telas. Cor sempre vem de `colors.X` (ThemeColors do tema atual).
2. **`createStyles(c: ThemeColors)` + `useMemo`** — padrão pra gerar styles dinâmicos por tema sem perder performance.
3. **Validação centralizada** — qualquer regra nova vai pra `lib/validation.ts`. Login e cadastro são clientes; testes em `test/validation.test.mjs`.
4. **Storage keys centralizadas** — todas em `constants/storage-keys.ts`. **Nunca** hardcode.
5. **Cart e Orders são isolados por user** (`@cantina:cart:{userId}` e `@cantina:orders:{userId}`). Quando user muda, contexts re-hidratam.
6. **TypeScript strict + `noUncheckedIndexedAccess`** — `array[index]` retorna `T | undefined`. Sempre tratar.
7. **Path alias `@/`** — usar `import X from '@/components/X'`, não relativos `../../`.
8. **Mensagens de commit em PT, conventional** (`feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`). Nunca `update`/`fix`/`asdfsdf`.

## 🛣️ Próximos passos — IMPLEMENTAR AGORA

O usuário aprovou implementação **completa do top 8** do roadmap. Detalhes em [`docs/ROADMAP.md`](./ROADMAP.md). Resumo:

| # | Feature | Esforço | Sugestão de autor | Status |
|---|---|---|---|---|
| 1 | Tela de Carrinho dedicada (`app/carrinho.tsx`) | 🟡 ~1h | Rodrigo (menos commits) | 🟡 **WIP — tela criada, falta wire no cardápio** |
| 2 | Saudação + card pedido ativo na Home | 🟢 30min | Ruan | ⏳ |
| 3 | "Pedir de novo" no histórico | 🟡 30min | Lucca | ⏳ |
| 4 | Onboarding 3 slides | 🟡 45min | João | ⏳ |
| 5 | Imagens reais (`expo-image`) | 🟡 30min | Ruan | ⏳ |
| 6 | Filtro de categoria horizontal (chips) | 🟢 30min | Rodrigo | ⏳ |
| 7 | Editar perfil (nome/email) | 🟢 30min | João | ⏳ |
| 8 | QR Code da senha (`react-native-qrcode-svg`) | 🟢 20min | Lucca | ⏳ |

### ⚠️ Estado WIP do #1 (Carrinho) — o que já está feito e o que falta

**Já feito:**
- `app/carrinho.tsx` criado (~370 linhas) — Stack screen com lista de items, controles de quantidade (+/-), botão limpar, totais, aviso de retirada, barra inferior fixa "CONFIRMAR PEDIDO" → `/confirmacao`. Empty state quando vazio com CTA pra cardápio.
- `app/_layout.tsx` registra `Stack.Screen name="carrinho"` com `slide_from_bottom`.
- TypeScript strict passa.

**Falta:**
- **Integrar com o cardápio**: em `app/(tabs)/cardapio.tsx`, o botão "CONFIRMAR" da barra inferior deve virar **"REVISAR PEDIDO"** e fazer `router.push('/carrinho')` em vez de ir direto pra `/confirmacao`. O badge do header também deve abrir o carrinho ao tocar.
- **Testar manualmente** o fluxo: Cardápio → Carrinho → Confirmação.
- **Atualizar README.md** com a tela nova (na tabela "Telas principais" e na seção de fluxo).
- **Commit final** quando terminar a integração (autor: Rodrigo continuar).

**Sequência recomendada:** 1 → 6 → 5 → 2 → 3 → 7 → 8 → 4

**Nas implementações, sempre:**
1. Trocar autor git (`git config user.name/email`) antes de tocar arquivos
2. Adicionar dep com `npx expo install <pkg>` (não `npm install` direto)
3. Criar/atualizar tipos em `types/index.ts` quando novos shapes aparecerem
4. Para lógica testável, **adicionar teste em `test/*.test.mjs`**
5. Rodar `npx tsc --noEmit && npm test` antes de commitar
6. Commit em PT seguindo conventional commits
7. Atualizar README.md com a feature nova quando relevante

## ⚠️ Pegadinhas conhecidas

- **`cd` não persiste entre comandos Bash** — o cwd default é `/Users/johnny/Downloads/cp-mobile`, não `app-cantina`. Sempre prefixar `cd /Users/johnny/Downloads/cp-mobile/app-cantina && ...` em comandos.
- **Path com parêntese** (`(auth)`, `(tabs)`) precisa de aspas ou escape em shell: `git mv "app/(tabs)/x.tsx" ...` ou `app/\(tabs\)/x.tsx`.
- **SecureStore não funciona no web** — `lib/secure-store.ts` tem fallback pro AsyncStorage com prefix `__secure__:`.
- **Notifications no Expo Go iOS** precisam de permissão (vai pedir na hora). No simulador iOS as notificações agendadas podem não disparar — testar em device real.
- **Não rodar `npm install <expo-pkg>` direto** — sempre `npx expo install` pra pegar versão compatível com SDK.
- **Após renomear pasta cp1-cantina-app → app-cantina**, o repo local não tem `remote`. Quando for subir pro GitHub, criar repo novo (nome sugerido `app-cantina` ou `fiap-mdi-cp2-cantina-app` se quiser seguir convenção do PDF).
- **Background jobs do Bash não imprimem QR code** — pra ver, precisa rodar em foreground (mas trava o agente) ou usar `--tunnel` + ler ngrok admin (`curl http://localhost:4040/api/tunnels`).

## 🔗 Referências essenciais

- **Spec do CP2:** [`docs/Checkpoint 2 - Mobile Development & IoT.pdf`](./Checkpoint%202%20-%20Mobile%20Development%20%26%20IoT.pdf)
- **Aulas da matéria:** `docs/Aula MDI 0X - *.md` (e o PDF da Aula 08)
- **README do app:** [`../README.md`](../README.md) (visão pro avaliador)
- **Roadmap completo:** [`./ROADMAP.md`](./ROADMAP.md) (30 melhorias categorizadas)
- **Guia de prints:** [`./CAPTURAR-PRINTS.md`](./CAPTURAR-PRINTS.md)
- **Lista dos 4 git users:** `/Users/johnny/Downloads/cp-mobile/usuários.txt`

## 🟢 Comece por aqui

```bash
cd /Users/johnny/Downloads/cp-mobile/app-cantina
cat docs/HANDOFF.md            # você está aqui
cat docs/ROADMAP.md            # próximos passos
npx tsc --noEmit && npm test   # confirma baseline verde
npx expo-doctor                # confirma config OK

# Pegar a primeira feature do top 8 e seguir o checklist em "Próximos passos"
```

Boa entrega 🚀
