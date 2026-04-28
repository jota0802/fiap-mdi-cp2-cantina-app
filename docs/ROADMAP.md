# 🛣️ Roadmap de Melhorias — App Cantina

> Backlog priorizado de UX/UI/funcionalidades para evoluir o CP2.
> Notação: 💎 alto impacto · 🔥 médio · ✨ refinamento · 🟢 fácil · 🟡 médio · 🔴 trabalhoso

## 🥇 Top 8 — implementar primeiro (≈5-6h total)

| # | Item | Esforço | Arquivo principal | Critério de aceitação |
|---|---|---|---|---|
| 1 | **Tela de Carrinho dedicada** | 🟡 ~1h | `app/carrinho.tsx` (novo) | Stack screen acessada do cardápio; lista items com edição de quantidade; mostra subtotal/total; botão "CONFIRMAR PEDIDO" envia pra `/confirmacao`; `slide_from_bottom` |
| 2 | **Saudação + card pedido ativo na Home** | 🟢 30min | `app/(tabs)/index.tsx` | Substitui "CANTINA · SEU PEDIDO SEM FILA" por "Bom dia/tarde/noite, {nome}"; se há pedido `pendente`/`pronto`, card grande no topo com senha + status + CTA "Acompanhar" |
| 3 | **"Pedir de novo" no histórico** | 🟡 30min | `app/(tabs)/pedidos.tsx` + `CartContext` | Botão em cada pedido `retirado` chama `cart.clear()` + popula com `order.items` + navega pra `/carrinho` |
| 4 | **Onboarding 3 slides** | 🟡 45min | `app/onboarding.tsx` (novo) + `AsyncStorage` flag | Primeira abertura mostra 3 slides ("Monte seu pedido | Pague no app | Retire na hora"); salva `@cantina:onboarded=true`; pula nas próximas |
| 5 | **Imagens reais nos itens** | 🟡 30min | `data/cardapio.ts` + `expo-image` | Adicionar campo `imagem` (URL Unsplash); `<Image>` substituído por `<expo-image/>` no `ItemCardapio`; placeholder blur enquanto carrega |
| 6 | **Filtro de categoria horizontal (chips)** | 🟢 30min | `app/(tabs)/cardapio.tsx` | ScrollView horizontal com chips `Todas | Bebidas | Lanches | Sobremesas`; filtro combina com busca em tempo real |
| 7 | **Editar perfil (nome/email)** | 🟢 30min | `app/perfil-editar.tsx` (novo) | Stack screen acessada via Perfil; form com Input + validation lib; chama `updateUser`; toast de sucesso |
| 8 | **QR Code da senha** | 🟢 20min | `app/confirmacao.tsx` | Instalar `react-native-qrcode-svg`; renderizar QR com payload `{senha, pedidoId}` abaixo do número |

---

## A. Layout & Visual (refinamento)

| # | Item | Esforço | Detalhes |
|---|---|---|---|
| 9 | **Glassmorphism nas barras** | 🟡 | `expo-blur` na tab bar e header da Home (BlurView com tint do tema) |
| 10 | **Gradients sutis** | 🟢 | `expo-linear-gradient` no card hero, no card da senha e em botões primários (gradient FIAP rosa→roxo) |
| 11 | **Dark mode menos preto** | 🟢 | Trocar `#0A0A0A` por `#0F0F1A` ou `#020617` em `constants/theme.ts` (mais sofisticado) |
| 12 | **Sombras sutis em cards no light theme** | 🟢 | Adicionar `shadowOffset/Radius/elevation` nos cards quando `mode === 'light'` |

## B. Microinterações & Animações

| # | Item | Esforço | Detalhes |
|---|---|---|---|
| 13 | **Migrar pra `react-native-reanimated` 3** | 🔴 | Substituir `Animated` por Reanimated em pelo menos shake/scale/pulse — UI thread, 60fps consistente |
| 14 | **`Layout` animations no FlatList de pedidos** | 🟡 | `LinearTransition` do Reanimated quando o status muda — pedido pulsa/glow ao virar `pronto` |
| 15 | **Animação Lottie no checkmark** | 🟢 | `lottie-react-native` na confirmação substituindo Ionicon estático |
| 16 | **Ripple effect no Android** | 🟢 | `Pressable` com `android_ripple={{ color: ... }}` em todos os toques |
| 17 | **Banner in-app pra notificação foreground** | 🟢 | `Notifications.addNotificationReceivedListener` + Toast custom quando app está aberto |

## C. Conteúdo & Dados

| # | Item | Esforço | Detalhes |
|---|---|---|---|
| 18 | **Tags em itens** | 🟢 | Campo `tags?: string[]` no tipo `ItemCardapio` (`vegano`, `sem glúten`, `quente`, `frio`, `+18`); chips coloridos abaixo da descrição |
| 19 | **Cardápio com mais itens (12-16)** | 🟢 | Expandir `data/cardapio.ts` pra demo mais densa |
| 20 | **Categoria com ícone próprio** | 🟢 | Tipo `Categoria` ganha `icone: keyof Ionicons` pra usar nos chips de filtro (#6) |

## D. Fluxo & Funcionalidades

| # | Item | Esforço | Detalhes |
|---|---|---|---|
| 21 | **Favoritos** | 🟡 | `FavoritesContext` persistido por user; coração no `ItemCardapio`; tab de favoritos no Perfil |
| 22 | **Recover de senha mockado** | 🟢 | Link "Esqueci minha senha" no login → form de email → gera nova senha mockada (mostrar pra demo) |
| 23 | **Estimativa de tempo dinâmica** | 🟡 | Calcular `secondsFromNow` na notificação como `pedidosPendentes × tempoMedioPorPedido` em vez de 180s fixo |
| 24 | **Biometria pra desbloquear** | 🔴 | `expo-local-authentication`; após primeiro login, perguntar se quer ativar; substitui senha nas próximas aberturas |
| 25 | **Cancelar pedido** | 🟢 | Botão "Cancelar" em pedidos `pendente`; muda status pra novo `'cancelado'`; cancela auto-promote e a notification agendada |

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
