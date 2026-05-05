# App Cantina FIAP — Instruções para o Claude

## O que é

**CP2 (Checkpoint 2)** da matéria Mobile Development & IoT da FIAP — aplicativo Expo + TypeScript de pedidos da cantina.

**Status:** CP2 entregue. Foundation (sub-projeto 1) **concluído** — monorepo pnpm + Hono + Neon + dark mode premium + pipeline de auditoria. Em fase de portfolio, próximo passo: deploy manual + sub-projeto 2.

Decomposição completa (3 sub-projetos sequenciais):

1. **Foundation** ← CONCLUÍDO (37+ commits, branch `feat/foundation`)
2. **Cantina admin** (multi-tenant, estoque, fornecedores, vitrine on/off)
3. **Customer flows v2** (calendário, filtros, kitchen-flow, validação retirada, recorrentes, Stripe)

📖 **Antes de qualquer ação no projeto, ler:**

- [docs/superpowers/specs/2026-05-05-foundation-design.md](./docs/superpowers/specs/2026-05-05-foundation-design.md) — spec do Foundation
- [docs/ROADMAP.md](./docs/ROADMAP.md) — backlog histórico + status Foundation
- [docs/DEPLOY.md](./docs/DEPLOY.md) — guia de deploy Neon + Render

## Comandos críticos

```powershell
pnpm -r typecheck         # TypeScript strict nos 3 workspaces (deve sair com exit 0)
pnpm -r test              # todos os testes (vitest + Node)
pnpm audit:run            # pipeline de auditoria (4 scripts)

# API local (pglite — sem Postgres real)
$env:USE_PGLITE="true"; $env:JWT_SECRET="local-dev-secret-min-32-chars-please-rotate"
pnpm --filter @cantina/api db:migrate
pnpm --filter @cantina/api db:seed
pnpm --filter @cantina/api dev          # http://localhost:8787

# Mobile (em outro terminal)
pnpm --filter @cantina/mobile start

# Ou ambos juntos
pnpm dev

# Adicionar dep Expo (NUNCA npm install direto)
pnpm --filter @cantina/mobile exec npx expo install <pkg>
```

**Roda typecheck + test antes de cada commit.** Se algum quebrar, conserta antes de seguir.

## Convenções inegociáveis

1. **TypeScript strict + `noUncheckedIndexedAccess`** — `array[i]` retorna `T | undefined`, sempre tratar com `?? default` ou guard.
2. **Path alias `@/`** — `import X from '@/components/X'`, nunca `'../../components/X'`. Cross-package usa `@cantina/shared`.
3. **Cores via tema** — `const { colors } = useTheme()`. Zero cor hardcoded em telas. Tokens em [`apps/mobile/constants/theme.ts`](./apps/mobile/constants/theme.ts).
4. **Styles dinâmicos** — padrão `const styles = useMemo(() => createStyles(colors), [colors])` + `function createStyles(c: ThemeColors) { return StyleSheet.create({ ... }) }`.
5. **Storage keys** — sempre via [`apps/mobile/constants/storage-keys.ts`](./apps/mobile/constants/storage-keys.ts), nunca strings literais.
6. **Validação centralizada** em [`packages/shared/src/validation.ts`](./packages/shared/src/validation.ts). Regra nova → teste correspondente (Vitest em `packages/shared`).
7. **Sem `Alert` em formulários** — erros sempre inline, vermelho, abaixo do campo.
8. **`useSafeAreaInsets()`** nos headers (notch/Dynamic Island).
9. **`Pressable` em vez de `TouchableOpacity`** quando precisar de feedback visual avançado.
10. **Cart é isolado por usuário** (sufixo `:{userId}`) — apenas dados locais (Cart, Favorites no AsyncStorage). Dados server-side (orders, items) usam a API.

## Commits

- **Mensagens em PT, conventional commits** (`feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`).
- **Autor único: `jota0802`** (decisão pós-entrega CP2 — João Victor toca o portfolio agora). Não distribuir mais entre os 4 RMs. Setar uma vez:

  ```powershell
  git config user.name "jota0802"
  git config user.email "jvfranco08@gmail.com"
  ```

- **Co-Authored-By:** trailer `Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>` em commits onde Claude foi load-bearing.
- **Nunca** `update`, `fix`, `asdfsdf` como mensagem.
- **Nunca commitar:** `conta-NAO-COMMITAR.txt`, `.env*`, `__secure__:*`, screenshots privados.

## Pegadinhas

- **Plataforma: Windows + PowerShell.** Use sintaxe PS (`$null` não `/dev/null`, `$env:VAR` não `$VAR`, `\` em paths). Bash do Git/WSL disponível mas evita misturar.
- **Path com parêntese** (`(auth)`, `(tabs)`) precisa de aspas em comando de shell: `"app/(tabs)/x.tsx"` ou escape `app/\(tabs\)/x.tsx`.
- **`cd` não persiste entre comandos Bash** — sempre prefixar caminho absoluto ou usar Edit/Write/Read direto.
- **SecureStore não funciona no web** — fallback automático pro AsyncStorage com prefix `__secure__:` ([lib/secure-store.ts](./lib/secure-store.ts)).
- **Notifications no Expo Go iOS** pedem permissão na hora. Simulador iOS pode não disparar agendadas — testar em device real.
- **Background `expo start` não imprime QR** (sem TTY). Use `--tunnel` + `curl http://localhost:4040/api/tunnels`.
- **Emulador Android não enxerga `localhost`** do host — usar `10.0.2.2:8787` em `EXPO_PUBLIC_API_URL` no Android (`.env.development`).
- **`EXPO_PUBLIC_*` é baked-in no bundle** no build time — trocar API URL exige rebuild via EAS profile.

## Stack

**Mobile (`apps/mobile`):** Expo SDK 55 · TypeScript 5 strict · React 19 · React Native 0.83.6 · Expo Router 55 · TanStack Query v5 · @react-native-async-storage/async-storage · expo-secure-store · expo-notifications · expo-image-picker · expo-haptics · @expo-google-fonts/manrope · react-native-svg · react-native-safe-area-context · @expo/vector-icons · expo-blur · expo-image · react-native-qrcode-svg.

**API (`apps/api`):** Hono 4 · Drizzle ORM + drizzle-kit · Postgres (Neon em prod) + pglite (dev/test) · @node-rs/argon2 · jose · Zod · pino · tsup · Vitest.

**Shared (`packages/shared`):** Zod schemas de validação + tipos compartilhados.

**Monorepo:** pnpm workspaces · concurrently · tsx · prettier.

## Pipeline de auditoria

Conforme §13 do spec do Foundation, o projeto terá auditorias frequentes pra manter docs sincronizados:

- **Quick audit (fim de fase):** `CLAUDE.md` + `HANDOFF.md`
- **Full audit (fim de sub-projeto):** + `ROADMAP.md` + memória + `README.md`
- **Reports:** `docs/superpowers/audits/YYYY-MM-DD-<phase>.md`
- **Helpers:** `pnpm audit:run` (4 scripts em `scripts/`)
- **Como invocar:** "claude, audita fim de fase" ou "audita full"

Pipeline ativo desde Foundation. `pnpm audit:run` disponível a qualquer momento.

## Estrutura de docs/

```text
docs/
├── superpowers/
│   ├── specs/        ← specs aprovados de cada sub-projeto
│   ├── plans/        ← planos gerados por superpowers:writing-plans
│   └── audits/       ← reports de cada auditoria
├── HANDOFF.md        ← evergreen
├── ROADMAP.md        ← evergreen
├── AUDITORIA.md      ← (criado em Foundation) checklist mestre
├── CAPTURAR-PRINTS.md
└── Aula MDI 0X.md / Checkpoint 2.pdf  ← materiais da matéria
```

## Próximos passos

1. **Deploy manual** — seguir `docs/DEPLOY.md` (provisionar Neon + Render, setar secrets).
2. **Merge `feat/foundation` → `main`** após smoke test do deploy.
3. **Brainstorm sub-projeto 2 (Cantina admin)** — spec via `superpowers:brainstorming`.
4. **Brainstorm sub-projeto 3 (Customer flows v2)** — calendário, Stripe, kitchen-flow.
