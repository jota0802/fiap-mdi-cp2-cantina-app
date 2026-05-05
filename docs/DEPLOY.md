# Deploy — Neon + Render (manual provisioning)

> Executar quando estiver pronto pra subir o backend pela primeira vez.
> O `render.yaml` na raiz do repo automatiza a maior parte; só falta provisionar Neon + setar secrets.

## Pré-requisitos

- Conta Neon (https://console.neon.tech) — free tier OK
- Conta Render (https://dashboard.render.com) — free tier OK
- Repo já no GitHub (este)
- Branch `feat/foundation` ou `main` com `render.yaml` commitado

## Passo 1 — Provisionar Neon

1. Login em https://console.neon.tech
2. **New Project**:
   - Name: `cantina`
   - Region: **US East (Ohio)** — mais próximo de Render Oregon (latência DB)
   - Postgres version: 16+ (default)
3. Copiar a `DATABASE_URL` da connection string (formato `postgresql://user:pass@host/db?sslmode=require`)
4. Salvar localmente em `apps/api/.env.production` (gitignored — não commita):
   ```
   DATABASE_URL=postgresql://...neon.tech/cantina?sslmode=require
   ```

## Passo 2 — Aplicar schema no Neon

Localmente, com `DATABASE_URL` apontando pro Neon:

```powershell
$env:DATABASE_URL="postgresql://...neon.tech/cantina?sslmode=require"
$env:JWT_SECRET="any-secret-min-32-chars-for-cli-only"
$env:USE_PGLITE="false"
pnpm --filter @cantina/api db:migrate
pnpm --filter @cantina/api db:seed
```

Verificar que o seed populou os 12 itens:

```sql
-- Conectar ao psql do Neon (via console web ou psql cli)
SELECT count(*) FROM items;  -- deve dar 12
```

## Passo 3 — Render Web Service

1. https://dashboard.render.com → **New** → **Web Service**
2. **Connect repository** `fiap-mdi-cp2-cantina-app`
3. Render lê `render.yaml` automaticamente — vai mostrar a config detectada
4. **Antes do primeiro deploy**, ir em **Environment** e setar manualmente:
   - `DATABASE_URL` = (cola do Neon, mesma do Passo 2)
   - `ALLOWED_ORIGINS` = `https://<seu-mobile-web-host>` (ou múltiplos separados por vírgula). Em desenvolvimento ainda sem mobile web deployado, deixar `http://localhost:8081,http://localhost:19006` pra liberar o Expo Go web. **NUNCA usar `*` em prod** — o env.ts tem fail-fast.
5. **Save & Deploy**

> **Workaround do `db:migrate` no buildCommand:** o `render.yaml` inclui `pnpm db:migrate` no build. Isso vai falhar no PRIMEIRO deploy se o DATABASE_URL estiver vazio. Workaround:
> - Setar `DATABASE_URL` no Environment ANTES de Save & Deploy (passo 4 acima)
> - OU temporariamente comentar `pnpm db:migrate` no `render.yaml`, fazer 1 deploy, rodar migrate via Render Shell, descomentar e re-deploy

## Passo 4 — Verificar saúde

```powershell
curl https://cantina-api.onrender.com/api/v1/health
```

Esperado: `{"status":"ok","uptime":N,"version":"0.0.0","env":"production"}`.

> **Cold start free tier:** primeira chamada pode demorar 30-60s (free tier do Render dorme após 15min de inatividade).

## Passo 5 — UptimeRobot (opcional, evita cold start)

1. https://uptimerobot.com → **Add Monitor**
2. Type: **HTTP(s)**
3. URL: `https://cantina-api.onrender.com/api/v1/health`
4. Interval: **5 minutes**
5. Save

Free tier do UptimeRobot mantém o Render acordado 24/7 a custo zero (até 50 monitors gratuitos).

## Passo 6 — Mobile env de produção

Criar `apps/mobile/.env.production` apontando pro Render:

```
EXPO_PUBLIC_API_URL=https://cantina-api.onrender.com
```

> **Lembrar:** `EXPO_PUBLIC_*` é baked-in no bundle no build time. Pra trocar a URL depois exige rebuild via EAS profile.

> **Android emulator gotcha:** pra dev local em Android emulator (não Render), usar `EXPO_PUBLIC_API_URL=http://10.0.2.2:8787` em `.env.development` (10.0.2.2 = host loopback do emulator).

## Pós-deploy: smoke test ponta-a-ponta

```powershell
# 1. Cadastro novo
curl -X POST https://cantina-api.onrender.com/api/v1/auth/register `
  -H "Content-Type: application/json" `
  -d '{"name":"Teste","email":"smoke@cantina.com","password":"123456"}'
# Esperado: 201 com {user, token}

# 2. Login
curl -X POST https://cantina-api.onrender.com/api/v1/auth/login `
  -H "Content-Type: application/json" `
  -d '{"email":"smoke@cantina.com","password":"123456"}'
# Esperado: 200 com {user, token}

# 3. /me autenticado (substituir TOKEN)
curl https://cantina-api.onrender.com/api/v1/auth/me `
  -H "Authorization: Bearer TOKEN_DO_PASSO_2"
# Esperado: 200 com {user}

# 4. Listar items
curl https://cantina-api.onrender.com/api/v1/items `
  -H "Authorization: Bearer TOKEN"
# Esperado: 200 com {items: [12 items]}
```

## Troubleshooting

| Sintoma | Causa provável | Fix |
|---|---|---|
| Build falha no `db:migrate` | `DATABASE_URL` vazio | Setar no Environment do Render antes de Save & Deploy |
| `/health` retorna 502 | Cold start ou crash no boot | Esperar 30s, depois ver Logs do Render |
| `/auth/register` retorna 500 | `JWT_SECRET` ausente ou < 32 chars | Render gera automaticamente via `generateValue: true`, mas verificar |
| CORS error no mobile | `ALLOWED_ORIGINS` não inclui o origin do mobile | Atualizar env do Render e redeploy |
| Mobile vê `Network Error` | URL hardcoded local ou EAS bundle desatualizado | Verificar `apps/mobile/.env.production` + rebuild |
