# Cantina FIAP — monorepo cliente-servidor (Expo + Hono + Postgres)

Aplicativo mobile para pedidos na cantina da FIAP, evoluído para monorepo pnpm com backend próprio.

---

## Status atual

**Foundation concluído** — 37+ commits no branch `feat/foundation` desde a entrega do CP2.
Deploy ainda manual (aguarda provisioning Neon + Render — ver `docs/DEPLOY.md`).

---

## Arquitetura

Monorepo pnpm com 3 workspaces:

| Package | Tecnologia | Responsabilidade |
| --- | --- | --- |
| `apps/api` | Hono 4 · Drizzle ORM · Postgres/pglite | API REST + auth + jobs |
| `apps/mobile` | Expo SDK 55 · React Native 0.83 · TanStack Query v5 | App iOS/Android/web |
| `packages/shared` | Zod | Schemas de validação + tipos compartilhados |

---

## Como rodar (dev)

```powershell
pnpm install

# API local (pglite — sem Postgres real)
$env:USE_PGLITE="true"; $env:JWT_SECRET="local-dev-secret-min-32-chars-please-rotate"
pnpm --filter @cantina/api db:migrate
pnpm --filter @cantina/api db:seed
pnpm --filter @cantina/api dev    # http://localhost:8787

# Mobile (em outro terminal)
pnpm --filter @cantina/mobile start
```

Ou, para subir os dois juntos:

```powershell
pnpm dev
```

---

## Verificar

```powershell
pnpm -r typecheck    # TypeScript strict nos 3 workspaces
pnpm -r test         # todos os testes (vitest + Node)
pnpm audit:run       # pipeline de auditoria (commit stats, stale strings, ROADMAP cross-ref)
```

---

## Deploy

Ver [`docs/DEPLOY.md`](./docs/DEPLOY.md) — Neon (Postgres) + Render (API), passo a passo manual.

---

## Próximos sub-projetos

Foundation é o primeiro de 3 sub-projetos. Próximos:

- **Cantina admin** — multi-tenant, controle de estoque, fornecedores, vitrine on/off
- **Customer flows v2** — calendário, agendamento, kitchen-flow, validação retirada via QR, recorrentes, Stripe

Ver specs em `docs/superpowers/specs/`.

---

## Histórico — CP2 (FIAP MDI 2026/1)

> Esta seção documenta a entrega original do checkpoint. A evolução pós-CP2 (Foundation refactor) é mantida solo por João Victor Franco como portfolio.
>
> **Checkpoint 2** — Mobile Development & IoT (FIAP — Engenharia de Software, 3º Ano).
> Evolução do CP1 com autenticação completa, persistência local, estado global, validação inline e **7 diferenciais técnicos**.

### Integrantes do Grupo (CP2)

| #  | Nome               | RM     | GitHub                                                |
|----|--------------------|--------|-------------------------------------------------------|
| 1  | Lucca Borges       | 554608 | [@lucksza](https://github.com/lucksza)                |
| 2  | Ruan Melo          | 557599 | [@DevRuanVieira](https://github.com/DevRuanVieira)    |
| 3  | Rodrigo Jimenez    | 558148 | [@roji-menez](https://github.com/roji-menez)          |
| 4  | João Victor Franco | 556790 | [@jota0802](https://github.com/jota0802)              |

---

### Sobre o Projeto (CP2)

**Problema:** A fila na cantina da FIAP gera perda de tempo nos intervalos entre aulas. Alunos enfrentam incerteza sobre disponibilidade de itens e demora no atendimento, especialmente nos horários de pico. Muitos desistem de comprar por falta de tempo.

**Solução:** Um app estilo fast-food onde o aluno cria conta, faz pedido, recebe senha com QR Code e é notificado quando o pedido está pronto — sem filas, sem confusão.

**Fluxo principal:**

1. Criar conta com nome, e-mail e senha (validação inline, sem `Alert`)
2. Fazer login (sessão persistida — não precisa logar de novo ao reabrir)
3. Home com saudação contextual + combo recomendado pelo horário
4. Navegar pelo cardápio digital com busca em tempo real e filtros por categoria
5. Marcar favoritos, montar pedido no carrinho
6. Confirmar e receber senha de 3 dígitos com QR Code
7. Ser notificado quando o pedido está pronto
8. Acompanhar histórico com timeline, cancelar ou refazer pedidos

---

### Diferenciais Implementados (CP2)

> A spec exigia 1 diferencial. Foram implementados 6 oficiais + 1 bônus.

1. **Expo SecureStore** — hash de senha (SHA-256 + salt) armazenado no Keychain/Keystore nativo, com fallback web para AsyncStorage (`__secure__:` prefix)
2. **Animações com Animated API** — shake nos erros, pulse no carrinho, spring na confirmação, parallax no onboarding, cross-fade no toggle de tema — todas com `useNativeDriver`
3. **Dark mode / Tema Dinâmico** — todas as telas via `useTheme()`, zero cor hardcoded, cross-fade suave de 320ms ao alternar, persistido no AsyncStorage
4. **Notificações Locais** — imediata ao confirmar pedido + agendada no `prontoEm` calculado dinamicamente
5. **Câmera & Galeria** — foto de perfil via `expo-image-picker` (câmera + biblioteca + remover), URI persistida no AsyncStorage
6. **Busca em Tempo Real** — filtra 12 itens por nome, descrição, categoria ou tag combinado com chips de categoria
7. **Feedback Tátil (bônus)** — `expo-haptics` em add/remove, confirmar, login, logout, swipe no onboarding
8. **Internacionalização PT/EN/ES (bônus)** — `LocaleContext` com `t(key, vars?)`, 3 idiomas, persistido em `@cantina:locale`

---

### Telas do app (13)

| # | Tela | Descrição |
| --- | --- | --- |
| 1 | Onboarding | 3 slides com parallax no hero + dots animados |
| 2 | Login | E-mail + senha, validação inline, shake nos erros |
| 3 | Cadastro | Nome + e-mail + senha + confirma, 4 validações inline |
| 4 | Recuperar senha | Reset por e-mail (mock) |
| 5 | Home | Saudação contextual, pedido ativo, combo recomendado, favoritos |
| 6 | Cardápio | 12 itens · 3 categorias · busca em tempo real · chips de filtro |
| 7 | Carrinho | Tela dedicada com controle de quantidade e total |
| 8 | Confirmação | Senha + QR Code · animações spring |
| 9 | Pedidos | Histórico com badges coloridos · pull-to-refresh · skeleton loaders |
| 10 | Pedido/[id] | Detalhes + timeline + ações por status |
| 11 | Perfil | Foto editável · toggle tema · logout |
| 12 | Editar perfil | Atualizar nome/e-mail com validação de e-mail único |
| 13 | Sobre | Cards do projeto, integrantes, tecnologias |

---

### Tecnologias (CP2)

| Categoria | Lib |
| --- | --- |
| Core | React Native 0.83 · Expo SDK 55 · React 19 |
| Tipagem | TypeScript 5 (strict + noUncheckedIndexedAccess) |
| Roteamento | Expo Router 55 (file-based, Stack + Tabs) |
| Persistência | @react-native-async-storage/async-storage |
| Segurança | expo-secure-store + expo-crypto (SHA-256) |
| Notificações | expo-notifications |
| Mídia | expo-image-picker · expo-image |
| Visual | expo-blur · react-native-svg · react-native-qrcode-svg |
| Feedback | expo-haptics |
| Tipografia | @expo-google-fonts/manrope (5 pesos) |
| Ícones | @expo/vector-icons (Ionicons) |

---

FIAP — Engenharia de Software — 3º Ano — Mobile Development & IoT — 2026
