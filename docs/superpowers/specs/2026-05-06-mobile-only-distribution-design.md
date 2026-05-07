# Mobile-only Distribution + Hardening de Distribuição

**Data:** 2026-05-06
**Autor:** João Victor (jota0802) com Claude Opus 4.7 (1M context)
**Status:** Aprovado em brainstorming, pronto pra implementação

## Contexto

A security review (sessão 2026-05-06) identificou que o fallback web do `secure-store.ts` salva o JWT em `AsyncStorage` (que no web é `localStorage` do navegador). Qualquer XSS no bundle web exfiltra o token. Em mobile native (iOS Keychain / Android Keystore), o token está protegido por hardware.

A decisão foi **eliminar o vetor inteiro** removendo o suporte web, em vez de mitigar com refresh tokens (esforço grande, mudança de arquitetura). O projeto está em fase de portfolio, mobile é o canal principal, e o conforto do `expo start --web` em dev não compensa o risco de alguém eventualmente publicar o bundle web em prod e expor o token.

Em paralelo, falta a infraestrutura de distribuição mobile: hoje o app só roda em Expo Go via QR code local. Pra mostrar o trabalho pra prof/recrutador é preciso ter um APK instalável.

## Decisões já tomadas

| Decisão | Valor escolhido | Razão |
|---|---|---|
| Suporte web | **Removido completamente** | Eliminar vetor de XSS no localStorage do bundle web |
| Modelo de distribuição agora | **APK Android local** (Android Studio + EAS Build local) | Sem custo, sem dependência de cloud, gera arquivo distribuível |
| Modelo de distribuição futuro | **EAS Update + Expo Go** | Free, push de updates sem rebuild, suficiente pra portfolio |
| Build engine | **EAS Build `--local`** (Android Studio + JDK 17) | Ilimitado, grátis, controle total. EAS cloud fica como fallback |
| API URL nos builds | **Sempre `https://cantina-api.onrender.com`** | APK funciona em qualquer rede, qualquer hora, sem Mac ligado |
| Plataforma alvo | **Android primeiro, iOS opcional** | iOS exige $99/ano de Apple Developer, fora de escopo do portfolio |

## Escopo

### O que está dentro

1. **Remoção de código** relacionado a web no `apps/mobile`
2. **Limpeza de configuração CORS** no `apps/api` (origens web não são mais necessárias)
3. **Configuração EAS Build** com profiles `preview` (APK) e `production` (AAB)
4. **Scripts npm** ergonômicos pra build APK e dev no emulador Android
5. **Documentação completa** de distribuição mobile + atualização das docs existentes
6. **Atualização de memória** (Claude Code) refletindo a decisão

### O que está fora

- Implementação efetiva do EAS Update (deixado documentado como "📌 quando ativar")
- Setup TestFlight / Apple Developer Program
- Submissão à Play Store pública
- Refresh tokens / mudança no fluxo de auth
- CSP no bundle web (não tem mais bundle web)

## Mudanças por área

### A. Código mobile

**Arquivos a editar:**

| Arquivo | Mudança |
|---|---|
| `apps/mobile/app.json` | Remover bloco `"web": { "favicon": "..." }` |
| `apps/mobile/package.json` | Remover script `"web": "expo start --web"` |
| `apps/mobile/lib/secure-store.ts` | Remover branch `if (isWeb)`, simplificar pra wrappers diretos do SecureStore |
| `apps/mobile/lib/api/client.ts` | Remover boot guard `__DEV__ && !API_URL.startsWith('https://')` (era pra prevenir build web HTTP) |
| `apps/mobile/components/Onboarding.tsx` | Remover branch `Platform.OS === 'web'` em `slideWidth`, sempre usar `width` da janela |

**Validar e possivelmente editar:**

- `grep` por `Platform.OS === 'web'` em todo o `apps/mobile/` — simplificar removendo o branch web (sempre usar branch nativo)
- **Deps web (`react-native-web`, `react-dom`, `@expo/metro-runtime`):** **NÃO remover nesta sessão.** Várias dessas deps são puxadas como peer ou usadas em tooling interno do Expo SDK 55 mesmo em runtime nativo. Removê-las exige validação caso-a-caso e arrisca quebrar build sem ganho real (são pequenas, não vão pro bundle nativo final). Marcar pra revisitar depois caso o tamanho do APK incomode.

### B. API

**Arquivos a editar:**

| Arquivo | Mudança |
|---|---|
| `apps/api/.env` (local) | `ALLOWED_ORIGINS` reduz pra `http://localhost:8081,http://10.0.2.2:8081` (apenas dev em emulador / device físico no Metro) |
| `apps/api/.env.example` | Mesma mudança |
| `apps/api/src/env.ts` | Atualizar `DEV_DEFAULT_ORIGINS` removendo `localhost:19006` (era do bundle web Expo) |
| Painel Render | `ALLOWED_ORIGINS` em prod precisa de placeholder mínimo (ex: `https://cantina-mobile-only.local`). Mobile native não usa CORS, mas o validator do `env.ts` exige a env não-vazia em prod. **Documentar no MOBILE-DEPLOY.md.** |

### C. Build / EAS

**Arquivos novos:**

`apps/mobile/eas.json`:
```json
{
  "cli": { "version": ">= 13.0.0" },
  "build": {
    "preview": {
      "distribution": "internal",
      "android": { "buildType": "apk" },
      "env": {
        "EXPO_PUBLIC_API_URL": "https://cantina-api.onrender.com"
      }
    },
    "production": {
      "android": { "buildType": "app-bundle" },
      "env": {
        "EXPO_PUBLIC_API_URL": "https://cantina-api.onrender.com"
      }
    }
  },
  "submit": { "production": {} }
}
```

**Arquivos editados:**

`package.json` (raiz do monorepo) — adicionar 2 scripts:
```json
"mobile:android": "pnpm --filter @cantina/mobile run android",
"mobile:build:apk": "cd apps/mobile && eas build --local --profile preview --platform android"
```

### D. Documentação

**Arquivo novo:** `docs/MOBILE-DEPLOY.md`

Estrutura:
1. Pré-requisitos (Android Studio + componentes, JDK 17, env vars, EAS CLI, conta Expo)
2. Build APK (passo a passo)
3. Instalar APK no celular (USB e sem cabo)
4. Dev no emulador (sem EAS, fluxo diário)
5. Pegadinhas (Mac com pouca RAM, Android Studio CLI-only, Render hibernando)
6. Checklist do que validar antes de distribuir o APK
7. **📌 Quando ativar EAS Update + Expo Go** (passos secos pra futuro)
8. **📌 Quando migrar pra Internal Testing no Google Play** ($25, futuro)

**Arquivos atualizados:**

| Arquivo | O que muda |
|---|---|
| `README.md` (raiz) | Topo: "📱 App mobile (Android via Expo, sem build web). Backend Hono + Postgres." Remover qualquer menção a "web" / "navegador". Linkar pra `docs/MOBILE-DEPLOY.md` |
| `CLAUDE.md` | "Comandos críticos": adicionar `mobile:build:apk` e `mobile:android`. "Convenções inegociáveis": adicionar regra mobile-only. "Pegadinhas": remover web, adicionar Android Studio + JDK 17. Atualizar Stack pra refletir remoção (`react-native-web`, `react-dom`, `@expo/metro-runtime` se removidos) |
| `docs/HANDOFF.md` | Status: "Foundation 100% + hardening segurança + mobile-only adotado". Comandos rápidos: `mobile:build:apk` + `mobile:android`. Nova seção curta "🚀 Distribuição" |
| `docs/DEPLOY.md` | Adicionar nota no topo apontando pra `MOBILE-DEPLOY.md` (já fala só do Render) |

### E. Memória (Claude Code)

**Arquivos novos:**

| Arquivo | Tipo | Conteúdo principal |
|---|---|---|
| `feedback_mobile_only.md` | feedback | "Sem suporte web — não usar `Platform.OS === 'web'`. Razão: vulnerabilidade XSS no fallback do SecureStore. Aplicar em: features novas, code review, sugestões de pacote." |
| `feedback_distribuicao_apk.md` | feedback | "Distribuição mobile: APK build local agora; EAS Update + Expo Go quando user pedir. Não sugerir TestFlight ($99/ano) sem pedido explícito." |

**Arquivos atualizados:**

| Arquivo | O que muda |
|---|---|
| `project_estado_atual.md` | Snapshot pós-mobile-only: hardening aplicado, comandos novos, API URL nos APKs, instruções pra retomar |
| `MEMORY.md` | Adicionar 2 entradas pros novos feedbacks |

## Workflow de dev novo

### Setup diário

```bash
# Terminal 1 — emulador headless (sem abrir Android Studio)
emulator -avd <nome_avd>

# Terminal 2 — API + Metro
pnpm dev

# Terminal 3 — primeira vez ou após mudança nativa
pnpm mobile:android
```

Loop normal: edita TSX → save → emulador hot-reload em ~1-2s.

### Diferenças vs antes

- Sem mais `expo start --web` ou abrir `localhost:8081` no Chrome
- Cmd+R no Chrome → tap+R no emulador (ou shake gesture)
- Chrome DevTools → React Native DevTools (`j` no terminal Metro)
- Layout responsive testado via AVDs diferentes (Pixel, tablet) em vez de redimensionar Chrome

### Pra distribuir APK

```bash
pnpm mobile:build:apk        # gera build-XXX.apk em apps/mobile/
# Compartilha o arquivo: USB+adb, cloud, Telegram
```

## Riscos e mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|---|---|---|---|
| Mac trava com Android Studio + Metro + API + browser | Média | Médio (dev frustrante) | Documentar uso headless do emulador (`emulator -avd` sem IDE) |
| Build EAS local falha por config Java/Gradle | Média | Alto (bloqueia distribuição) | Documentar pré-requisitos no detalhe + fallback pra `eas build` cloud (free tier 30/mês) |
| Render hiberna, primeira request demora | Alta | Baixo (UX) | Documentar no MOBILE-DEPLOY.md + warming opcional via cron-ping |
| Remover deps web quebra build mobile | Baixa | Médio (rollback) | Validar com typecheck + smoke test antes de commitar; se quebrar, restaurar deps |
| User esquece de atualizar `DATABASE_URL` no Render | Alta | Alto (deploy fail) | Já documentado no chat; aviso explícito no MOBILE-DEPLOY.md sobre dependência da rotação Neon |
| `ALLOWED_ORIGINS` em prod com placeholder confunde dev futuro | Baixa | Baixo | Comentário inline no `env.ts` explicando: `// Placeholder em prod: app eh mobile-only, native nao usa CORS. Mantemos a env nao-vazia so pra satisfazer o validator fail-fast.` + nota no MOBILE-DEPLOY.md |

## Critérios de sucesso

A implementação está completa quando:

- [ ] `pnpm -r typecheck` passa em todos workspaces
- [ ] `pnpm -r test` passa (35/35 da API + 26 do mobile mantidos)
- [ ] `apps/mobile/app.json` não tem mais entrada `"web"`
- [ ] `pnpm web` no mobile retorna erro "script not found" (script removido)
- [ ] `grep -r "Platform.OS === 'web'" apps/mobile/` retorna zero matches (ou só matches inevitáveis em deps)
- [ ] `apps/mobile/eas.json` existe com profiles `preview` e `production`
- [ ] `pnpm mobile:build:apk` e `pnpm mobile:android` aparecem em `pnpm run` na raiz
- [ ] `docs/MOBILE-DEPLOY.md` existe e cobre os 8 pontos da estrutura
- [ ] `README.md`, `CLAUDE.md`, `HANDOFF.md` atualizados sem menção a web
- [ ] `project_estado_atual.md`, `feedback_mobile_only.md`, `feedback_distribuicao_apk.md` na memória
- [ ] `MEMORY.md` index atualizado
- [ ] `pnpm dev` continua subindo API + Metro sem erro
- [ ] Health check da API responde 200 em `/api/v1/health`

A validação fim-a-fim (rodar `pnpm mobile:build:apk` e instalar no celular) **não é critério desta sessão** — fica pra quando o user testar.

## Sequência de execução

1. **Código mobile** — remover web (app.json, package.json, secure-store, Onboarding, client.ts)
2. **Validar grep** — checar outros `Platform.OS === 'web'` e deps web
3. **Código API** — limpar `ALLOWED_ORIGINS` (.env, .env.example, env.ts)
4. **Build** — criar `eas.json` + scripts no package.json raiz
5. **Docs** — criar `MOBILE-DEPLOY.md`, atualizar README/CLAUDE/HANDOFF/DEPLOY
6. **Memória** — criar feedbacks, atualizar project_estado_atual e MEMORY.md
7. **Validar** — typecheck + tests + smoke do dev local

Cada passo commitado separadamente (conventional commits PT) pra facilitar rollback caso algo quebre.
