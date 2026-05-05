# App Cantina FIAP — Instruções para o Claude

## O que é

**CP2 (Checkpoint 2)** da matéria Mobile Development & IoT da FIAP — aplicativo Expo + TypeScript de pedidos da cantina.

**Status:** CP2 entregue ao professor. Em fase de evolução pós-entrega como portfolio. Próximo grande refactor:

**Sub-projeto 1 (Foundation)** — monorepo + backend separado (Hono+Neon) + dark mode premium + pipeline de auditoria. **Spec aprovado:** [docs/superpowers/specs/2026-05-05-foundation-design.md](./docs/superpowers/specs/2026-05-05-foundation-design.md).

Decomposição completa do refactor (3 sub-projetos sequenciais):

1. **Foundation** ← em planejamento agora
2. **Cantina admin** (multi-tenant, estoque, fornecedores, vitrine on/off)
3. **Customer flows v2** (calendário, filtros, kitchen-flow, validação retirada, recorrentes, Stripe)

📖 **Antes de qualquer ação no projeto, ler:**

- [docs/superpowers/specs/2026-05-05-foundation-design.md](./docs/superpowers/specs/2026-05-05-foundation-design.md) — spec do refactor
- [docs/HANDOFF.md](./docs/HANDOFF.md) — estado atual pré-refactor
- [docs/ROADMAP.md](./docs/ROADMAP.md) — backlog histórico (top 8 + tier 2 já concluídos)

## Comandos críticos (estado atual, pré-Foundation)

```powershell
npx tsc --noEmit          # TypeScript strict (deve sair com exit 0)
npm test                  # 26 testes Node (validation + hash + cart + recomendacao)
npx expo-doctor           # Config Expo (deve dar 18/18)
npx expo start            # Dev server
npx expo install <pkg>    # Adicionar dep (NUNCA usar npm install direto pra pacotes Expo)
```

**Roda os 3 primeiros antes de cada commit.** Se algum quebrar, conserta antes de seguir.

> ⚠️ Após Foundation ser implementado os comandos mudam pra `pnpm` workspaces — ver §6.1 do spec.

## Convenções inegociáveis

1. **TypeScript strict + `noUncheckedIndexedAccess`** — `array[i]` retorna `T | undefined`, sempre tratar com `?? default` ou guard.
2. **Path alias `@/`** — `import X from '@/components/X'`, nunca `'../../components/X'`. Pós-Foundation, cross-package vira `@cantina/shared`.
3. **Cores via tema** — `const { colors } = useTheme()`. Zero cor hardcoded em telas. Tokens em [constants/theme.ts](./constants/theme.ts) (vira `apps/mobile/constants/theme.ts` pós-Foundation).
4. **Styles dinâmicos** — padrão `const styles = useMemo(() => createStyles(colors), [colors])` + `function createStyles(c: ThemeColors) { return StyleSheet.create({ ... }) }`.
5. **Storage keys** — sempre via [constants/storage-keys.ts](./constants/storage-keys.ts), nunca strings literais.
6. **Validação centralizada** em [lib/validation.ts](./lib/validation.ts) (vira `packages/shared/validation` pós-Foundation). Regra nova → teste correspondente.
7. **Sem `Alert` em formulários** — erros sempre inline, vermelho, abaixo do campo.
8. **`useSafeAreaInsets()`** nos headers (notch/Dynamic Island).
9. **`Pressable` em vez de `TouchableOpacity`** quando precisar de feedback visual avançado.
10. **Cart é isolado por usuário** (sufixo `:{userId}`). Pós-Foundation, dados server-side não usam essa convenção; só Cart e Favorites locais usam.

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
- **Pós-Foundation: emulador Android não enxerga `localhost`** do host — usar `10.0.2.2:8787` em `EXPO_PUBLIC_API_URL` no Android.
- **Pós-Foundation: `EXPO_PUBLIC_*` é baked-in no bundle** no build time — trocar API URL exige rebuild via EAS profile.

## Stack atual

Expo SDK 55 · TypeScript 5 strict · React 19 · React Native 0.83.6 · Expo Router 55 · @react-native-async-storage/async-storage · expo-secure-store · expo-crypto · expo-notifications · expo-image-picker · expo-haptics · @expo-google-fonts/manrope · react-native-svg · react-native-safe-area-context · @expo/vector-icons · expo-blur · expo-image · react-native-qrcode-svg.

**A ser adicionado em Foundation:** pnpm workspaces · Hono · Drizzle ORM · Postgres (Neon) + pglite · @node-rs/argon2 · Zod · TanStack Query v5 · pino · Vitest · supertest · @testing-library/react-native.

## Pipeline de auditoria

Conforme §13 do spec do Foundation, o projeto terá auditorias frequentes pra manter docs sincronizados:

- **Quick audit (fim de fase):** `CLAUDE.md` + `HANDOFF.md`
- **Full audit (fim de sub-projeto):** + `ROADMAP.md` + memória + `README.md`
- **Reports:** `docs/superpowers/audits/YYYY-MM-DD-<phase>.md`
- **Helpers:** `pnpm audit:run` (4 scripts em `scripts/`)
- **Como invocar:** "claude, audita fim de fase" ou "audita full"

Antes de Foundation existir, auditoria é manual ad-hoc — eu (Claude) sinalizo proativamente quando uma mudança bate auditoria.

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

1. **Gerar plano de execução do Foundation** via skill `superpowers:writing-plans` (lê o spec aprovado).
2. **Executar Foundation** em fases (cada fase = 1 PR ou bundle de commits, com auditoria quick no fim).
3. **Auditoria full** ao concluir Foundation.
4. **Brainstorm sub-projeto 2 (Cantina admin).**
5. **Brainstorm sub-projeto 3 (Customer flows v2).**
