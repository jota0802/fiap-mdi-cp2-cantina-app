# Sub-projeto 2 / Fase A — Hierarquia de Tenants + Tenant Context + CLI seed

**Data:** 2026-05-06
**Autor:** João Victor (jota0802) com Claude Opus 4.7 (1M context)
**Status:** Implementado 2026-05-07
**Sub-projeto:** 2 (Cantina admin / multi-tenant)
**Fase:** A — Hierarquia + Tenant Context + CLI seed (1ª de 4)

> **Correção pós-implementação (2026-05-07):** seed reduzido de **6 → 4 cantinas** após user verificar com a realidade que cada escola da unidade Lins tem só uma cantina (Térreo). Removidos `c_lins_sc_2` (2º andar) e `c_lins_fac_2` (3º andar). Estado atual: 2 unidades + 3 escolas + 4 cantinas. Ver [`apps/api/src/db/seed.ts`](../../../apps/api/src/db/seed.ts) e [`docs/HANDOFF.md`](../../HANDOFF.md). Decisões de design abaixo permanecem válidas — só a contagem do seed mudou.

## Contexto

Foundation deixou multi-tenant **preparado mas não ativado** (`tenant_id` existe nullable em todas as tabelas, sem FK, sem populamento). O sub-projeto 2 ativa esse pilar: hierarquia institucional, estoque por cantina, vitrine on/off, fornecedores. Por escolha do user, o sub-projeto 2 foi decomposto em **4 fases independentes**, cada uma com seu próprio brainstorm/spec/implementação:

- **Fase A (esta):** Hierarquia (Unidade → Escola → Cantina) + tenant resolution via header + CLI seed
- **Fase B (futuro):** Estoque + cardápio por cantina + "ver geral" (junction `cantina_items`)
- **Fase C (futuro):** Vitrine on/off (aberta/fechada) + role staff por cantina + `markRetirado`
- **Fase D (futuro):** Fornecedores + housekeeping (`PATCH /auth/me`, reset password, contador `senha`)

A Fase A é fundação das outras 3. Ela prepara o terreno **sem mudar nenhuma rota visível ao mobile** — só adiciona schema, middleware (não aplicado ainda), endpoint público de árvore, e CLIs.

## Decisões já tomadas (do brainstorming)

| Decisão | Valor escolhido | Justificativa |
|---|---|---|
| Modelagem da hierarquia | **3 tabelas separadas** (`unidades`, `escolas`, `cantinas`) | Profundidade fixa de 3 níveis, schema explícito, FKs claras, sem overhead de recursive CTE |
| Vínculo cliente ↔ cantina | **Sem vínculo fixo** — cliente escolhe cada vez, sistema lembra última (decisão de UI da Fase B) | Máxima flexibilidade pra alunos que usam múltiplas unidades; sem `users.unidade_id` obrigatório |
| Tenant resolution na request | **Header `X-Cantina-Id`** com middleware validador | Sem renomear rotas existentes; mesma natureza idiomática do `Authorization` |
| Roles | **Mínimo (`customer` + `staff`)** | YAGNI — admin global gerenciado via CLI/Neon Studio; manager por unidade fica pra futuro se necessário |
| CLI seed | **Só estrutura** (zero usuários) | Evita credenciais hardcoded no código (categoria inteira de risco eliminada) |
| Criação de staff | **CLI dedicado** (`create-staff`) com senha gerada aleatória | Hash argon2 correto, senha forte por padrão, mostrada uma vez |
| Detecção de prod | **URL contém `.neon.tech` ou `NODE_ENV=production`** | Heurística simples e suficiente |
| Confirmação em prod | **Frase exata interativa** ("criar staff em prod") | Imune a `y/yes` automático, exige intenção consciente |
| Reset do banco Neon atual | **Sim, pode resetar** (banco tem só 12 items + pedidos teste) | Banco limpo é mais simples que script de migração de dados |

## Escopo

### Dentro

1. **Schema de DB:** tabelas `unidades`, `escolas`, `cantinas`; ajustes em `users` (drop `tenant_id`, add `cantina_id` + CHECK); rename `tenant_id` → `cantina_id` em `items`/`orders`/`favorites`; FK em `orders`
2. **Migration Drizzle** (`0002_tenants_hierarchy.sql`)
3. **JWT claim** atualizado (campo opcional `cantinaId` pra staff)
4. **Middleware** `tenant-context.ts` (criado mas não aplicado nas rotas — fica pra Fase B)
5. **Endpoint público** `GET /api/v1/tenants/tree` retornando árvore institucional
6. **CLI seed** refatorado (só hierarquia, sem items)
7. **CLI create-staff** novo com proteções
8. **Proteção interativa** em `db:reset`
9. **Helpers compartilhados** (`_safety.ts`)
10. **Testes** novos (middleware, endpoint, CLI, detecção de prod, JWT claim)
11. **Atualização de docs** (HANDOFF, CLAUDE, memória)
12. **Reset + reaplicação** do banco Neon

### Fora (futuras fases)

- Junction `cantina_items` + cardápio por cantina (Fase B)
- Vitrine aberta/fechada + role staff aplicado nas rotas (Fase C)
- Fornecedores + housekeeping (`PATCH /auth/me`, reset password, contador `senha`) (Fase D)
- Migração de dados existentes (não há — vamos resetar)
- UI mobile pra seletor de cantina (depende da Fase B; mobile só ganha endpoint pra consumir)
- Manager por unidade ou admin role no DB (decidido fora)

## Mudanças por área

### A. Schema de banco

**Tabelas novas em `apps/api/src/db/schema.ts`:**

```typescript
export const unidades = pgTable('unidades', {
  id: text('id').primaryKey(),
  nome: text('nome').notNull(),
  endereco: text('endereco'),
  ativo: boolean('ativo').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const escolas = pgTable('escolas', {
  id: text('id').primaryKey(),
  unidadeId: text('unidade_id').notNull().references(() => unidades.id, { onDelete: 'restrict' }),
  nome: text('nome').notNull(),
  tipo: text('tipo'), // 'main' | 'school' | 'faculdade' (futuro)
  ativo: boolean('ativo').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  unidadeNomeUnique: uniqueIndex('escolas_unidade_nome_unique').on(t.unidadeId, t.nome),
  unidadeIdx: index('escolas_unidade_idx').on(t.unidadeId),
}));

export const cantinas = pgTable('cantinas', {
  id: text('id').primaryKey(),
  escolaId: text('escola_id').notNull().references(() => escolas.id, { onDelete: 'restrict' }),
  nome: text('nome').notNull(),
  andar: text('andar'),
  ativo: boolean('ativo').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  escolaNomeUnique: uniqueIndex('cantinas_escola_nome_unique').on(t.escolaId, t.nome),
  escolaIdx: index('cantinas_escola_idx').on(t.escolaId),
}));
```

**Mudanças em tabelas existentes:**

```typescript
// users — drop tenant_id, add cantina_id
export const users = pgTable('users', {
  // ... campos existentes ...
  cantinaId: text('cantina_id').references(() => cantinas.id, { onDelete: 'restrict' }),
  // tenantId removido
}, (t) => ({
  emailUnique: uniqueIndex('users_email_unique').on(t.email),
  cantinaIdx: index('users_cantina_idx').on(t.cantinaId),
  // tenantIdx removido
  staffMustHaveCantina: check(
    'users_staff_must_have_cantina',
    sql`role != 'staff' OR cantina_id IS NOT NULL`,
  ),
}));

// items, orders, favorites — rename tenant_id → cantina_id
// orders ganha FK; items e favorites ganham FK só na Fase B
```

### B. Migration Drizzle

`apps/api/drizzle/0002_tenants_hierarchy.sql` gerado com `pnpm api:db:generate`. **Inspecionar** antes de aplicar — Drizzle pode gerar `DROP + ADD COLUMN` em vez de `RENAME`. Como vamos resetar o banco, perda de dados não importa, mas a migration deve ser **legível** pra futura referência. Se Drizzle gerar SQL feia, ajustar manualmente pra usar `RENAME COLUMN`.

### C. JWT + middleware

**`packages/shared/src/auth.ts`:**
```typescript
export const JwtClaimSchema = z.object({
  sub: z.string(),
  email: z.string().email(),
  role: z.enum(['customer', 'staff']),
  locale: z.string(),
  cantinaId: z.string().optional(), // NOVO: presente só pra staff
});
```

**`apps/api/src/lib/jwt.ts`:** `signJwt` aceita `cantinaId` no payload quando role=staff.

**`apps/api/src/routes/auth.ts`:** ao gerar token em `/login` e `/register`, incluir `cantinaId` no claim quando `user.role === 'staff'`. Customer continua sem o campo.

**`apps/api/src/middleware/tenant-context.ts` (NOVO):**
```typescript
export async function tenantContext(c: Context, next: Next) {
  const cantinaId = c.req.header('X-Cantina-Id');
  if (!cantinaId) throw badRequest('Header X-Cantina-Id obrigatório nesta rota');

  const [cantina] = await c.var.db.select().from(cantinas)
    .where(and(eq(cantinas.id, cantinaId), eq(cantinas.ativo, true))).limit(1);
  if (!cantina) throw notFound('Cantina não existe ou inativa');

  const claim = c.get('user');
  if (claim?.role === 'staff' && claim.cantinaId !== cantinaId) {
    throw forbidden('Staff só pode acessar a própria cantina');
  }

  c.set('cantina', cantina);
  await next();
}
```

**Não aplicar nas rotas existentes nesta fase.** Middleware existe mas só será wired em Fase B (quando items/orders viram per-cantina). Justificativa: aplicar agora quebra o app mobile que ainda não envia o header.

### D. Endpoint `GET /api/v1/tenants/tree`

**Arquivo novo:** `apps/api/src/routes/tenants.ts`. Mount em `apps/api/src/app.ts`:
```typescript
app.route('/api/v1/tenants', createTenantsRoutes(db));
```

**Sem auth** (público — cliente precisa antes de logar pra escolher cantina). Cacheable agressivamente:
```typescript
app.get('/tree', async (c) => {
  const us = await db.select().from(unidades).where(eq(unidades.ativo, true)).orderBy(unidades.nome);
  const es = await db.select().from(escolas).where(eq(escolas.ativo, true)).orderBy(escolas.nome);
  const cs = await db.select().from(cantinas).where(eq(cantinas.ativo, true)).orderBy(cantinas.andar);

  const tree = us.map((u) => ({
    id: u.id,
    nome: u.nome,
    escolas: es.filter((e) => e.unidadeId === u.id).map((e) => ({
      id: e.id,
      nome: e.nome,
      tipo: e.tipo,
      cantinas: cs.filter((cn) => cn.escolaId === e.id).map((cn) => ({
        id: cn.id, nome: cn.nome, andar: cn.andar,
      })),
    })),
  }));

  c.header('Cache-Control', 'public, max-age=3600');
  return c.json({ unidades: tree }, 200);
});
```

DTO em `packages/shared/src/schemas/tenant.ts` exposto pra mobile usar futuramente.

### E. CLI seed atualizado

`apps/api/src/db/seed.ts` reescrito:

```typescript
const SEED_UNIDADES = [
  { id: 'u_paulista', nome: 'Paulista' },
  { id: 'u_lins', nome: 'Lins' },
];

const SEED_ESCOLAS = [
  { id: 'e_paulista_main',  unidadeId: 'u_paulista', nome: 'FIAP Paulista',  tipo: 'main' },
  { id: 'e_lins_school',    unidadeId: 'u_lins',     nome: 'FIAP School',    tipo: 'school' },
  { id: 'e_lins_faculdade', unidadeId: 'u_lins',     nome: 'FIAP Faculdade', tipo: 'faculdade' },
];

const SEED_CANTINAS = [
  { id: 'c_pa_5',       escolaId: 'e_paulista_main',  nome: '5º andar', andar: '5' },
  { id: 'c_pa_7',       escolaId: 'e_paulista_main',  nome: '7º andar', andar: '7' },
  { id: 'c_lins_sc_1',  escolaId: 'e_lins_school',    nome: 'Térreo',   andar: 'T' },
  { id: 'c_lins_sc_2',  escolaId: 'e_lins_school',    nome: '2º andar', andar: '2' },
  { id: 'c_lins_fac_1', escolaId: 'e_lins_faculdade', nome: 'Térreo',   andar: 'T' },
  { id: 'c_lins_fac_2', escolaId: 'e_lins_faculdade', nome: '3º andar', andar: '3' },
];

// Tudo via .onConflictDoNothing() — idempotente
```

**Total seed:** 2 unidades + 3 escolas + 6 cantinas. Items vão pra Fase B.

> **Importante:** o seed atual da Foundation popula 12 items "globais" (sem `cantina_id`). Esses 12 items serão **removidos do seed da Fase A** — quando Fase B existir junction `cantina_items`, os items voltam ao seed em sua versão correta (associados a cantinas). Como o banco é resetado, não há perda de dado real.

### F. CLI create-staff (NOVO)

`apps/api/src/scripts/create-staff.ts`. Comando:
```bash
pnpm api:create-staff --cantina=<id> --email=<email> --name=<nome>
```

**Validações** (com Zod):
- `--cantina`: string não-vazia, deve existir e estar `ativo=true`
- `--email`: email válido, único no banco
- `--name`: string ≥2 chars

**Geração de senha** (em `_safety.ts`):
```typescript
export function gerarSenhaForte(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%&*';
  // exclui 0/O/o/1/l/I (confusos no terminal)
  return Array.from({ length: 16 }, () => chars[crypto.randomInt(chars.length)]).join('');
}
```

**Detecção de prod + confirmação** (em `_safety.ts`):
```typescript
export function isProductionTarget(databaseUrl: string | undefined): boolean {
  if (!databaseUrl) return false;
  return databaseUrl.includes('.neon.tech')
      || databaseUrl.includes('.aws.')
      || process.env.NODE_ENV === 'production';
}

export async function confirmInProd(phrase: string, message: string): Promise<boolean> {
  console.log(message);
  console.log(`Pra continuar, digite a frase exata: ${phrase}`);
  const stdin = process.stdin;
  // readline...
  return input === phrase;
}
```

**Output em sucesso:**
```
✅ Staff criado: maria@cantina.fiap.br
   Cantina:  5º andar (FIAP Paulista, Paulista)
   Role:     staff

🔑 Senha temporária (anote agora — não aparece de novo):
   X8k3$mP9aF2LqWpZ
```

### G. Proteção em `db:reset`

`apps/api/src/db/reset.ts` ganha o mesmo `confirmInProd("apagar tudo em prod", ...)` antes de executar.

### H. Helpers compartilhados

`apps/api/src/scripts/_safety.ts`:
- `isProductionTarget(databaseUrl): boolean`
- `confirmInProd(phrase, message): Promise<boolean>`
- `gerarSenhaForte(): string`
- Reusável por scripts futuros (Fase D pode ter `create-admin`, `rotate-secrets`, etc)

### I. Testes

Adicionar em `apps/api/src/`:
- `middleware/tenant-context.test.ts` — cantina inexistente → 404; cantina inativa → 404; staff de outra cantina → 403; customer com cantina ok → setado em context; sem header → 400
- `routes/tenants.test.ts` — `/tree` retorna árvore com 6 cantinas; cache header presente; só ativos
- `scripts/_safety.test.ts` — `isProductionTarget()` true pra `.neon.tech`/`.aws.`/`NODE_ENV=production`; false pra localhost/pglite
- `lib/jwt.test.ts` (existente) — adicionar caso: `signJwt({...role:'staff', cantinaId:'c_pa_5'})` produz claim com `cantinaId`; `signJwt({...role:'customer'})` não inclui `cantinaId`
- `routes/auth.test.ts` (existente) — adicionar caso: login de staff (criado via fixture) retorna token com `cantinaId`

`create-staff.ts` é difícil de testar end-to-end (interativo + DB). Cobrir só funções puras (`gerarSenhaForte`, validações Zod) — o fluxo completo é validado manualmente.

## Sequência de execução (commits separados)

| # | Commit | Conteúdo |
|---|---|---|
| 1 | `feat(db): hierarquia de tenants (unidades/escolas/cantinas)` | Schema (3 tabelas + ajustes em users/items/orders/favorites) + migration `0002` (gerada via `db:generate` e **inspecionada manualmente** pra garantir RENAME em vez de DROP+ADD) + seed atualizado |
| 2 | `feat(api): JWT claim cantinaId + tenant-context middleware` | Shared `JwtClaimSchema` + `lib/jwt.ts` + `auth.ts` (login/register incluem cantinaId pra staff) + `middleware/tenant-context.ts` (não aplicado) |
| 3 | `feat(api): GET /tenants/tree (arvore publica)` | `routes/tenants.ts` + mount em `app.ts` + DTO em shared |
| 4 | `feat(scripts): CLI create-staff + safety helpers` | `_safety.ts` + `create-staff.ts` + script no `apps/api/package.json` |
| 5 | `chore(scripts): protecao interativa em db:reset` | Confirmação obrigatória quando alvo é prod |
| 6 | `test: cobertura Fase A (middleware, endpoint, JWT, safety)` | Testes novos descritos em §I |
| 7 | `docs: spec Fase A + atualiza CLAUDE/HANDOFF + memoria` | Spec na pasta superpowers + HANDOFF + memory files novos/atualizados |

Cada commit valido com `pnpm -r typecheck && pnpm -r test` antes de seguir pro próximo.

## Critérios de sucesso

A Fase A está completa quando:

- [ ] `pnpm -r typecheck` passa nos 3 workspaces
- [ ] `pnpm -r test` passa (35 API + 22 mobile + ~10 novos da Fase A)
- [ ] Migration `0002_tenants_hierarchy.sql` aplicada em pglite e Neon sem erro
- [ ] `pnpm api:db:reset` (com confirmação interativa em Neon) + `migrate` + `seed` deixam o banco com **2 unidades + 3 escolas + 6 cantinas**
- [ ] `GET /api/v1/tenants/tree` retorna 200 com árvore completa em pglite e Neon
- [ ] `pnpm api:create-staff` em pglite cria staff e mostra senha gerada
- [ ] `pnpm api:create-staff` apontando pra Neon **exige confirmação** "criar staff em prod"
- [ ] `pnpm api:db:reset` apontando pra Neon **exige confirmação** "apagar tudo em prod"
- [ ] CHECK constraint impede `INSERT users (role='staff', cantina_id=NULL)`
- [ ] JWT claim de customer **não tem** `cantinaId`; JWT de staff **tem** `cantinaId` correto
- [ ] Middleware `tenantContext` existe e tem testes, mas **não está aplicado** em items/orders/favorites
- [ ] `pnpm dev` sobe API + Metro sem erro; healthcheck 200
- [ ] Documentação atualizada: HANDOFF, CLAUDE, memória

## Riscos e mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|---|---|---|---|
| Drizzle gera DROP+ADD em vez de RENAME (perda de dados) | Alta | Médio | Inspecionar SQL antes; reset prévio garante banco limpo, sem perda real |
| Migration falha no Neon por dado órfão | Baixa | Alto | Reset prévio elimina dado órfão |
| `cantinaId` vaza em JWT de customer | Baixa | Médio | Test cobrindo: customer não tem campo no claim |
| Renomeio quebra código não-coberto | Média | Médio | Grep `tenant_id`/`tenantId` em todo repo + typecheck nos 3 workspaces |
| User cria staff em prod por engano | Baixa (com proteção) | Alto | Detecção dupla (URL + NODE_ENV) + frase exata interativa |
| `_safety.ts` falha em detectar prod corretamente | Baixa | Alto | Test unitário cobrindo casos: `.neon.tech`, `.aws.`, `localhost`, vazio, `NODE_ENV=production` |
| Endpoint `/tenants/tree` muito pesado quando muitas cantinas | Baixa (6 hoje) | Baixo | Cache 1h via `Cache-Control`; futuro pode paginar se passar de ~100 |
| CHECK constraint bloqueia migration de users existentes | Média | Médio | Banco resetado antes da migration; senão UPDATE pré-migration setando role=customer pros sem cantina |

## Pendentes pós-Fase A (handoff pra Fase B)

Quando esta fase fechar, registrar no HANDOFF.md o que está disponível pra próxima fase usar:

- Tabelas `unidades`, `escolas`, `cantinas` populadas
- Endpoint `GET /tenants/tree` consumível pelo mobile
- Middleware `tenantContext` pronto pra ser aplicado nas rotas que viram per-cantina (items, orders, favorites)
- JWT de staff já carrega `cantinaId` — middleware vai poder validar
- CLI `create-staff` disponível pra criar operadores quando Fase C ativar a tela admin
