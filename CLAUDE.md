# App Cantina FIAP — Instruções para o Claude

## O que é

**CP2 (Checkpoint 2)** da matéria Mobile Development & IoT da FIAP — aplicativo Expo + TypeScript de pedidos da cantina.

**Status:** CP2 entregue. Foundation (sub-projeto 1) **concluído** + hardening de segurança aplicado + **mobile-only adotado em 2026-05-06** (sem build web). Em fase de portfolio.

Decomposição completa (3 sub-projetos sequenciais):

1. **Foundation** ← CONCLUÍDO (37+ commits, branch `feat/foundation`, mergeado em main)
2. **Cantina admin** (multi-tenant, estoque, fornecedores, vitrine on/off)
3. **Customer flows v2** (calendário, filtros, kitchen-flow, validação retirada, recorrentes, Stripe)

📖 **Antes de qualquer ação no projeto, ler:**

- [docs/superpowers/specs/2026-05-05-foundation-design.md](./docs/superpowers/specs/2026-05-05-foundation-design.md) — spec do Foundation
- [docs/superpowers/specs/2026-05-06-mobile-only-distribution-design.md](./docs/superpowers/specs/2026-05-06-mobile-only-distribution-design.md) — spec mobile-only + distribuição APK
- [docs/ROADMAP.md](./docs/ROADMAP.md) — backlog histórico + status Foundation
- [docs/DEPLOY.md](./docs/DEPLOY.md) — backend (Neon + Render)
- [docs/MOBILE-DEPLOY.md](./docs/MOBILE-DEPLOY.md) — mobile (APK Android via EAS Build local)

## Comandos críticos

```bash
pnpm -r typecheck         # TypeScript strict nos 3 workspaces (deve sair com exit 0)
pnpm -r test              # todos os testes (vitest + Node)
pnpm audit:run            # pipeline de auditoria (4 scripts)

# Setup .env (apps/api/.env) com USE_PGLITE=true ou DATABASE_URL+sslmode
pnpm --filter @cantina/api db:migrate
pnpm --filter @cantina/api db:seed
pnpm dev                  # API + Metro juntos (concurrently)

# Dev mobile no emulador Android
emulator -avd <nome_avd>  # roda emulador headless (sem Android Studio aberto)
pnpm mobile:android       # primeira vez ou após mudança nativa

# Build APK pra distribuir (precisa Android Studio + JDK 17 + EAS CLI)
pnpm mobile:build:apk     # gera apps/mobile/build-XXX.apk

# Criar staff por cantina (gera senha aleatória, mostra uma vez)
pnpm api:create-staff --cantina=<id> --email=<email> --name="<nome>"

# Adicionar dep Expo (NUNCA npm install direto)
pnpm --filter @cantina/mobile exec npx expo install <pkg>
```

PowerShell equivalente: trocar `$env:VAR=...` por valores no `.env`. Setup completo do mobile em [docs/MOBILE-DEPLOY.md](./docs/MOBILE-DEPLOY.md).

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
11. **Mobile-only — sem `Platform.OS === 'web'`.** App não tem mais bundle web (decisão 2026-05-06 por segurança: localStorage do navegador era vetor de XSS pro JWT). Testar sempre em emulador Android ou device físico, nunca em navegador. Ao adicionar feature/lib nova, verificar que funciona em RN nativo. Detalhes: [`docs/MOBILE-DEPLOY.md`](./docs/MOBILE-DEPLOY.md).
12. **Tenants são hierárquicos: `unidades` → `escolas` → `cantinas` → `cantina_items`** (cardápio per-cantina via junction). Cliente sem vínculo fixo de cantina permanente — escolhe default no onboarding, edita no Perfil; troca rápida via picker no topo da home (sessão local em AsyncStorage, distinto do default em DB). Staff vinculado a UMA cantina (`users.cantina_id NOT NULL` quando role=staff, validado por CHECK). API recebe contexto via header `X-Cantina-Id` (middleware [`apps/api/src/middleware/tenant-context.ts`](./apps/api/src/middleware/tenant-context.ts) **aplicado** em items, orders, favorites). Endpoint público `GET /api/v1/tenants/tree` retorna a árvore completa com cache 1h. `cantina_items` carrega `preco`, `estoque` (CHECK >= 0), `disponivel` (operacional), `visivel` (vitrine — Fase C controla UI). API filtra `WHERE disponivel=true AND visivel=true`; item com `estoque=0` ainda aparece como "esgotado" (frontend renderiza badge + botão disabled). `POST /orders` decrementa estoque atomicamente em transação Drizzle via `UPDATE ... WHERE estoque >= qtd`; race detected → 409 Conflict. Scripts destrutivos (`db:reset`, `create-staff`) detectam prod via [`apps/api/src/scripts/_safety.ts`](./apps/api/src/scripts/_safety.ts) e exigem frase exata por TTY.

13. **Onboarding mobile completa user.name/rm/cantinaId via `PATCH /auth/me`**. Signup só email + senha + confirma senha (`name=null, rm=null, cantinaId=null` no insert). Onboarding em 3 telas: welcome → nome+RM → unidade+cantina. RM 6 dígitos exatos (`^[0-9]{6}$` regex via Zod + CHECK no banco), **read-only após onboarding** (display-only no Perfil). Sem persistência mid-flow (fechar app entre telas volta pra welcome). Trocar unidade no Perfil limpa `cantina_id` automaticamente e força repicker. Gate em `(tabs)/_layout.tsx` redireciona pra onboarding se `user.name && user.rm && user.cantinaId` não estiverem todos setados.

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

- **Plataforma:** Mac/zsh ou Windows/PowerShell. Use sintaxe da sua shell. `cd` não persiste entre comandos Bash — sempre caminho absoluto ou use Edit/Write/Read direto.
- **Path com parêntese** (`(auth)`, `(tabs)`) precisa de aspas em comando de shell: `"app/(tabs)/x.tsx"` ou escape `app/\(tabs\)/x.tsx`.
- **EAS Build local** exige Android Studio + JDK 17 + `ANDROID_HOME`/`JAVA_HOME` setados. Detalhes em [docs/MOBILE-DEPLOY.md](./docs/MOBILE-DEPLOY.md).
- **Mac com pouca RAM:** rodar emulador Android headless via CLI (`emulator -avd <nome>`) em vez de Android Studio aberto — economiza ~3GB de RAM.
- **Notifications no iOS Simulator** podem não disparar agendadas — testar em device real.
- **Emulador Android não enxerga `localhost`** do host — usar `10.0.2.2:8787` em `EXPO_PUBLIC_API_URL` em dev.
- **`EXPO_PUBLIC_*` é baked-in no bundle** no build time — trocar API URL exige rebuild via EAS profile.
- **APK distribuído aponta sempre pro Render** ([apps/mobile/eas.json](./apps/mobile/eas.json)) — primeira request depois de hibernar (free tier) demora ~30s.
- **`ALLOWED_ORIGINS` em prod** precisa de placeholder não-vazio (mobile native não usa CORS, mas o validator do `env.ts` faz fail-fast). Ver [docs/MOBILE-DEPLOY.md](./docs/MOBILE-DEPLOY.md#allowed_origins-em-prod-com-placeholder).

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

1. **Build APK preview e validar** — `pnpm mobile:build:apk` + instalar no celular Android (ver `docs/MOBILE-DEPLOY.md`).
2. **Fase B do sub-projeto 2** — estoque + cardápio por cantina + "ver geral" (junction `cantina_items`). Brainstorm separado.
3. **Fase C** — vitrine on/off + role staff aplicado nas rotas + `markRetirado`. Brainstorm separado.
4. **Fase D** — fornecedores + housekeeping (`PATCH /auth/me`, reset-password, contador `senha`). Brainstorm separado.
5. **Brainstorm sub-projeto 3 (Customer flows v2)** — calendário, Stripe, kitchen-flow.
6. **Quando user pedir:** ativar EAS Update + Expo Go (passos secos em `docs/MOBILE-DEPLOY.md`).
