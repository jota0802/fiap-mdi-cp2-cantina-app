# 🛣️ Roadmap de Melhorias — App Cantina

> Backlog priorizado de UX/UI/funcionalidades para evoluir o CP2.
> Notação: 💎 alto impacto · 🔥 médio · ✨ refinamento · 🟢 fácil · 🟡 médio · 🔴 trabalhoso

## 🥇 Top 8 — TODOS CONCLUÍDOS ✅

| # | Item | Status |
|---|---|---|
| 1 | **Tela de Carrinho dedicada** | ✅ Stack screen com edição de quantidade, totais, integração com cardápio ("Revisar pedido") |
| 2 | **Saudação + card pedido ativo na Home** | ✅ Saudação dinâmica por hora; bento grid com pedido ativo, quick actions e destaques |
| 3 | **"Pedir de novo" no histórico** | ✅ Botão em pedidos `retirado` recria o cart e navega pra /carrinho |
| 4 | **Onboarding 3 slides** | ✅ Primeira abertura mostra 3 slides (Pedir / Confirmar / Retirar); flag `@cantina:onboarded` |
| 5 | **Imagens reais nos itens** | ✅ Campo `imagem` (URLs Unsplash) renderizado via `expo-image` em `ItemThumbnail`, com fallback emoji |
| 6 | **Filtro de categoria horizontal (chips)** | ✅ ScrollView horizontal com chips `Todas/Bebidas/Lanches/Sobremesas` + ícones Ionicons |
| 7 | **Editar perfil (nome/email)** | ✅ Stack screen `perfil-editar` com validação inline e checagem de email único |
| 8 | **QR Code da senha** | ✅ QR de 92px no hero card primary com `react-native-qrcode-svg`; payload `cantina:senha:{n}:order:{id}` |

## 🎨 Design System aplicado (28/04/2026)

Pós-redesign premium minimalista, todas as telas seguem agora:

- **Tipografia hierárquica:** eyebrow `xs/widest/UPPER` → título `extrabold/3xl/sentence` → body `medium/md`. Sem `letterSpacing.ultra` em títulos longos.
- **Cores menos pretas:** `bg #0E0E16`, `surface #181826`, `surfaceElevated #1F1F30` no dark; `#F7F7F8` / `#FFFFFF` no light.
- **Tokens novos:** `surface`, `surfaceElevated`, `surfaceHover`, `borderStrong`, `separator`, `primarySoft`, `primaryDeep`, `bgElevated`.
- **Shadow tokens:** `shadow.sm/md/lg/primary` prontos pra spread.
- **Bento grids:** Home (cardápio big + carrinho/histórico stacked), Perfil (3 stat cards), Confirmação (itens/total bento).
- **Pressed soft:** `opacity 0.85 + scale 0.98` em Pressables.

---

## A. Layout & Visual (refinamento)

| # | Item | Status |
|---|---|---|
| 9 | **Glassmorphism nas barras** | ✅ `BlurView` na tab bar com tint dinâmico por tema |
| 10 | **Gradients sutis** | ⏳ `expo-linear-gradient` no card hero, na senha e em botões primários |
| 11 | **Dark mode menos preto** | ✅ Tokens novos em `theme.ts` (#0E0E16, #181826) |
| 12 | **Sombras sutis em cards no light theme** | ✅ Tokens `shadow.sm/md/lg/primary` |

## B. Microinterações & Animações

| # | Item | Esforço | Detalhes |
|---|---|---|---|
| 13 | **Migrar pra `react-native-reanimated` 3** | 🔴 | Substituir `Animated` por Reanimated em pelo menos shake/scale/pulse — UI thread, 60fps consistente |
| 14 | **`Layout` animations no FlatList de pedidos** | 🟡 | `LinearTransition` do Reanimated quando o status muda — pedido pulsa/glow ao virar `pronto` |
| 15 | **Animação Lottie no checkmark** | 🟢 | `lottie-react-native` na confirmação substituindo Ionicon estático |
| 16 | **Ripple effect no Android** | 🟢 | `Pressable` com `android_ripple={{ color: ... }}` em todos os toques |
| 17 | **Banner in-app pra notificação foreground** | 🟢 | `Notifications.addNotificationReceivedListener` + Toast custom quando app está aberto |

## C. Conteúdo & Dados

| # | Item | Status |
|---|---|---|
| 18 | **Tags em itens** | ✅ Tipo `Tag` com 8 tags + `tagPalette` colorido + chips abaixo da descrição |
| 19 | **Cardápio com mais itens** | ✅ 12 itens (4 novos: Brigadeiro, Salada Caesar, Refrigerante, Croissant) |
| 20 | **Categoria com ícone próprio** | ✅ Já no chip de filtro (cardapio.tsx) |

## D. Fluxo & Funcionalidades

| # | Item | Status |
|---|---|---|
| 21 | **Favoritos** | ✅ `FavoritesContext` + heart toggle no ItemCardapio + seção "Seus favoritos" na Home |
| 22 | **Recover de senha mockado** | ✅ Link "Esqueceu sua senha?" no login → tela `recover-senha.tsx` com form de redefinição |
| 23 | **Estimativa de tempo dinâmica** | ✅ `lib/estimativa.ts` calcula prazo (90s base + 60s/pedido pendente, cap 600s); persistido em `Order.prontoEm` |
| 24 | **Biometria pra desbloquear** | ⏳ `expo-local-authentication` |
| 25 | **Cancelar pedido** | ✅ Status `cancelado` + botão com Alert de confirmação em pedidos pendentes |

## E. Acessibilidade & Performance

| # | Item | Esforço | Detalhes |
|---|---|---|---|
| 26 | **`accessibilityLabel` + `accessibilityRole` em todos os toques** | 🟢 | VoiceOver/TalkBack funcional. Botões viram `role="button"`, inputs `role="text"`, links `role="link"` |
| 27 | **Dynamic Type** | 🟢 | Multiplicar `fontSize` por `PixelRatio.getFontScale()` (cap em 1.5x) |
| 28 | **`expo-image` em vez de `Image`** | 🟢 | Cache, lazy, blur placeholder; combinar com #5 |
| 29 | **Sound feedback (`expo-av`)** | 🟢 | Sons curtos (~50ms): "blip" add, "chime" confirmar, "blop" erro |
| 30 | **Microcopy humanizado** | 🟢 | Substituir CAPS gritado por linguagem mais quente em mensagens-chave (Empty States, splash, confirmação, erros) |

---

## 🎯 Sequência sugerida de execução

**Sprint 1 (top 3):**
- Carrinho dedicado (#1)
- Home com saudação + card ativo (#2)
- Pedir de novo (#3)

**Sprint 2 (impressão visual):**
- Onboarding (#4)
- Imagens reais (#5)
- Filtro de categoria (#6)
- Tags em itens (#18) + cardápio expandido (#19)

**Sprint 3 (refinamento profissional):**
- Editar perfil (#7)
- QR Code (#8)
- Gradients (#10)
- Microcopy (#30)
- Acessibilidade (#26)

**Sprint 4 (extras se sobrar tempo):**
- Glassmorphism (#9)
- Lottie (#15)
- Favoritos (#21)
- Biometria (#24)

---

## 📦 Dependências novas necessárias

| Para | Lib | Comando |
|---|---|---|
| #1, #7 | (já existentes) | — |
| #4 | nada nova | — |
| #5, #28 | `expo-image` | `npx expo install expo-image` |
| #8 | `react-native-qrcode-svg` | `npm install react-native-qrcode-svg` (já tem `react-native-svg`) |
| #9 | `expo-blur` | `npx expo install expo-blur` |
| #10 | `expo-linear-gradient` | `npx expo install expo-linear-gradient` |
| #15 | `lottie-react-native` | `npx expo install lottie-react-native` |
| #24 | `expo-local-authentication` | `npx expo install expo-local-authentication` |
| #29 | `expo-av` | `npx expo install expo-av` |

---

## 🧪 Como validar cada melhoria

Para qualquer item:

```bash
npx tsc --noEmit    # zero erros
npm test            # 26 (ou mais) testes Node passando
npx expo-doctor     # 18/18
```

Se a feature criar lógica testável (validação, math, etc.), **adicionar teste em `test/*.test.mjs`**.

---

FIAP — Mobile Development & IoT — 2026
