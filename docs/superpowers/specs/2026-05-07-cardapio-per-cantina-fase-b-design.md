# Sub-projeto 2 / Fase B — Cardápio per-cantina + Onboarding completo

**Data:** 2026-05-07
**Autor:** João Victor (jota0802) com Claude Opus 4.7 (1M context)
**Status:** Aprovado em brainstorming, pronto pra implementação
**Sub-projeto:** 2 (Cantina admin / multi-tenant)
**Fase:** B — Cardápio per-cantina + onboarding completo (2ª de 4)

## Contexto

Fase A entregou hierarquia de tenants, JWT staff com `cantinaId`, middleware `tenant-context` (criado mas não wired), endpoint público `/tenants/tree`, CLI `create-staff`, proteção em `db:reset`. Banco Neon populado com 2 unidades, 3 escolas, 4 cantinas (1 por escola Lins, 2 em Paulista).

A Fase B ativa o pilar de cantina per-customer. Três blocos interligados: (1) **junção cantina↔items** com preço/estoque/disponibilidade per-cantina, (2) **wiring do middleware tenant-context** nas rotas de items/orders/favorites, (3) **redesign do flow de signup + onboarding** pra coletar nome, RM e cantina default do customer (puxado parcialmente da Fase D porque não dá pra navegar sem cantina selecionada).

Após Fase B, customer abre o app e vê direto o cardápio da cantina default; pode trocar cantina via picker no topo da home (sessão local, não persiste no DB); edita unidade/cantina default no Perfil.

## Decisões já tomadas (do brainstorming)

| Decisão | Valor escolhido | Justificativa |
|---|---|---|
| Junção cantinas ↔ items | **Tabela `cantina_items`** com PK `(cantina_id, item_id)` | Permite preço/estoque/disponibilidade per-cantina; mesma "café" em cantinas diferentes pode ter preços diferentes |
| Preço per-cantina | **`cantina_items.preco` NOT NULL** | Cada cantina seta o próprio preço; força disciplina operacional, evita ambiguidade de "qual preço cobrar" |
| Estoque mínimo | **Hard zero (CHECK estoque >= 0)** | Sem overselling. Se UPDATE atômico tenta deixar negativo, falha → 409 Conflict |
| Item esgotado (estoque=0) | **API ainda retorna**, frontend renderiza "esgotado" | Comunica ao customer que o item existe mas tá fora; melhor UX que esconder |
| Disponibilidade / vitrine | **2 campos separados:** `disponivel` (operacional) + `visivel` (display) | Permite cantina pausar item temporariamente (vitrine, Fase C) sem descontinuar (disponivel=false) |
| Wiring do middleware | **Aplicar em items, orders, favorites** | Header `X-Cantina-Id` obrigatório nessas rotas a partir desta fase |
| Onboarding | **3 telas, sem persistência mid-flow** | Tela 1 welcome, tela 2 nome+RM, tela 3 unidade+cantina. Fechar no meio volta pra tela 1 |
| Signup | **Só email + senha + confirma senha** | Nome vem no onboarding tela 2. JWT do customer continua sem `cantinaId` |
| RM | **6 dígitos exatos, regex `^[0-9]{6}$`, NÃO editável após onboarding** | Identificador FIAP estável; user erra → recriar conta ou contatar admin (fora de escopo) |
| `users.name` | **Vira nullable + CHECK `(role != 'staff' OR name NOT NULL)`** | Customer fica null entre signup e onboarding; staff sempre tem (CLI passa) |
| Cantina default | **Persistida em `users.cantina_id`**, customer escolhe na tela 3 do onboarding | Reusa coluna criada na Fase A. Determina `X-Cantina-Id` na primeira request |
| Cantina session vs default | **Default em `users.cantina_id` (DB), atual em AsyncStorage local** | Picker no topo da home muda só sessão; mudar default exige Perfil |
| Picker no topo da home | **Lista só cantinas da unidade do user** + link "Mudar unidade" → Perfil | Hierarquia estrita; trocar unidade limpa cantina default |
| Trocar unidade no Perfil | **Limpa `cantina_id` automaticamente** | Cantina é filho de unidade; força repicker pra evitar inconsistência |
| Pedidos antigos sem cantina | **Wipe completo no Neon** | User autorizou — banco tem só dados de teste, ninguém usando o app |
| Items globais (catálogo base) | **Mantém `items` table como catálogo template** | Seed popula 12 items globais; `cantina_items` referencia + sobrescreve preço |
| Cleanup Fase A | **Drop `items.cantina_id` e `favorites.cantina_id`** | Renames legados que não fazem sentido com junction. Items é catálogo, favorito é (user, item) |
| Estoque inicial seed | **Random `[100, 350]` por linha de cantina_items** | Variedade pra teste; valores realistas pra cantina |
| Preços iniciais seed | **Estratégia per-unidade hardcoded:** Paulista usa `items.preco` (base); Lins usa `items.preco × 0.85` (15% mais barato). **Intra-unidade: mesmo preço** (todas cantinas de Paulista têm preço idêntico entre si; idem Lins). | Match com realidade (interior costuma ser mais barato que SP capital); demonstra a capacidade per-cantina sem complicar; reproduzível |
| `orders.cantina_id` | **Vira NOT NULL** | Toda order tem cantina; setado pelo middleware via header |

## Escopo

### Dentro

1. **Schema:** add `users.rm` + CHECK regex; `users.name` notNull → nullable + CHECK; `orders.cantina_id` nullable → NOT NULL; drop `items.cantina_id` + `favorites.cantina_id`; create `cantina_items` (PK composta, 2 booleans, preço, estoque com CHECK)
2. **Migration Drizzle** (`0003_cardapio_per_cantina.sql`)
3. **Endpoint novo `PATCH /api/v1/auth/me`** — atualiza `name?, rm?, cantinaId?` do user logado
4. **Refactor `POST /auth/register`** — schema valida só `{ email, password }`
5. **Wiring do `tenantContext` middleware** em items, orders, favorites — header `X-Cantina-Id` obrigatório
6. **Refactor `GET /items`** — JOIN com cantina_items, filtra `disponivel=true AND visivel=true`, retorna estoque no DTO
7. **Refactor `POST /orders`** — usa cantina_items pra preço, decrementa estoque atomicamente em transação, rejeita 409 em race
8. **Refactor `nextSenha`** — recebe cantinaId real (TODO Fase A resolvido)
9. **Mobile signup screen** — remove campo nome, mantém email + senha + confirma senha
10. **Mobile onboarding 3 telas** — welcome adaptado, nome+RM, unidade+cantina + PATCH /auth/me
11. **Mobile home redesign** — picker no topo (cantinas da unidade), link "mudar unidade" → Perfil, dashboard mostra items da cantina session
12. **Mobile Perfil edits** — name, unidade (com cleanup auto), cantina default; RM display read-only
13. **Mobile cantina session** em AsyncStorage — `currentCantinaId` separado do default
14. **Seed atualizado** — volta os 12 items + popula cantina_items (4 cantinas × 12 items = 48 rows com estoque random)
15. **Wipe + reseed do Neon** (sem migração de dados; user autorizou)
16. **Testes novos** — race condition em decremento, CHECK estoque negativo, PATCH /auth/me valida RM regex, signup sem name, items filtra por cantina+disponível+visível, fixtures atualizadas
17. **Atualização de docs** (HANDOFF, CLAUDE, memória)

### Fora (futuras fases)

- **Vitrine on/off** UI staff (Fase C — backend já suporta via `visivel`)
- **Tela admin/staff de edição de estoque** (Fase C — backend pronto, falta UI)
- **`markRetirado`** pelo staff (Fase C)
- **Fornecedores** (Fase D)
- **Reset de senha** (Fase D)
- **Editar RM no Perfil** (fora de escopo permanente — RM é estável)
- **Migrar pedidos antigos pra alguma cantina** (wipe é a estratégia)
- **JWT contendo `cantinaId` customer** (continua só pra staff; customer manda via header)

## Mudanças por área

### A. Schema de banco

**Tabela nova:**

```typescript
export const cantinaItems = pgTable('cantina_items', {
  cantinaId: text('cantina_id').notNull().references(() => cantinas.id, { onDelete: 'restrict' }),
  itemId: text('item_id').notNull().references(() => items.id, { onDelete: 'cascade' }),
  preco: numeric('preco', { precision: 10, scale: 2 }).notNull(),
  estoque: integer('estoque').notNull().default(0),
  disponivel: boolean('disponivel').notNull().default(true),
  visivel: boolean('visivel').notNull().default(true),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  pk: primaryKey({ columns: [t.cantinaId, t.itemId] }),
  cantinaIdx: index('cantina_items_cantina_idx').on(t.cantinaId),
  estoquePositivo: check('cantina_items_estoque_positivo', sql`estoque >= 0`),
}));
```

**Mudanças em users:**

```typescript
// users.name vira nullable + CHECK
name: text('name'),  // antes: .notNull()
rm: text('rm'),       // NOVO
// ... resto igual ...
}, (t) => ({
  // ... existentes ...
  staffMustHaveName: check('users_staff_must_have_name', sql`role != 'staff' OR name IS NOT NULL`),
  rmFormato: check('users_rm_formato', sql`rm IS NULL OR rm ~ '^[0-9]{6}$'`),
}));
```

**Mudanças em orders:**

```typescript
cantinaId: text('cantina_id').notNull().references(() => cantinas.id, { onDelete: 'restrict' }),
```

**Mudanças em items:**

```typescript
// Drop cantinaId — items voltam a ser catálogo global
// (a coluna existe hoje como rename do tenant_id legado, sem dado real)
```

**Mudanças em favorites:**

```typescript
// Drop cantinaId — favorito é (user, item) independente
```

### B. Migration Drizzle

`apps/api/drizzle/0003_cardapio_per_cantina.sql` gerado via `pnpm api:db:generate --name=cardapio_per_cantina`. Inspecionar manualmente. Como banco é wipado novamente (sem migração de dado), DROP+ADD aceitável onde Drizzle não detecta rename.

### C. API novos endpoints

**`PATCH /api/v1/auth/me` (NOVO):**

```typescript
const PatchMeSchema = z.object({
  name: z.string().trim().min(2).optional(),
  rm: z.string().regex(/^[0-9]{6}$/, 'RM precisa ter exatamente 6 dígitos').optional(),
  cantinaId: z.string().nullable().optional(),  // null permite limpar (uso: trocar unidade)
});
```

- Auth obrigatório (`requireAuth`)
- Se `cantinaId` enviado e não-null: valida que existe e está ativa
  - **Se `users.cantina_id` atual é não-null** (user já tem cantina default): a nova cantina deve pertencer à mesma unidade derivada via JOIN cantina→escola→unidade. Caso contrário 422 (consistência hierárquica).
  - **Se `users.cantina_id` atual é null** (onboarding tela 3 OU pós-clear de unidade no Perfil): aceita qualquer cantina ativa.
- `cantinaId: null` aceito explicitamente (uso: limpar pra forçar repick após trocar unidade)
- Atualiza só campos enviados (PATCH semântico)
- Retorna user atualizado (mesmo shape de `GET /auth/me`)
- **JWT não é re-emitido** (cantina_id no claim é só pra staff; customer usa header em runtime)

### D. API mudanças nas rotas existentes

**`POST /auth/register`:**

```typescript
const RegisterSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(6),
  // name removido
});
```

Cria user com `name: null, rm: null, cantina_id: null, role: 'customer'`. Auto-login via signJwt (sem cantinaId no claim). Frontend redireciona pra onboarding após receber token.

**`tenantContext` aplicado em:**
- `apps/api/src/routes/items.ts` (factory `createItemsRoutes`)
- `apps/api/src/routes/orders.ts` (factory `createOrdersRoutes`)
- `apps/api/src/routes/favorites.ts` (factory `createFavoritesRoutes`)

Cada uma adiciona `app.use('*', tenantContext(db))` após `requireAuth`. Header `X-Cantina-Id` agora obrigatório em todas as requests dessas rotas.

**`GET /items` (refactor):**

```typescript
const list = await db.select({
  id: items.id,
  slug: items.slug,
  name: items.name,
  // ... outros campos do items ...
  preco: cantinaItems.preco,        // sobrescreve items.preco
  estoque: cantinaItems.estoque,    // novo
  disponivel: cantinaItems.disponivel,
})
  .from(cantinaItems)
  .innerJoin(items, eq(cantinaItems.itemId, items.id))
  .where(and(
    eq(cantinaItems.cantinaId, c.var.cantina.id),
    eq(cantinaItems.disponivel, true),
    eq(cantinaItems.visivel, true),
  ));
```

DTO inclui `estoque` (integer ≥ 0). Frontend renderiza "esgotado" quando `estoque === 0`.

**`POST /orders` (refactor):**

```typescript
await db.transaction(async (tx) => {
  for (const reqItem of itens) {
    // 1. Buscar cantina_item (preço + estoque atual)
    const [ci] = await tx.select()
      .from(cantinaItems)
      .where(and(
        eq(cantinaItems.cantinaId, c.var.cantina.id),
        eq(cantinaItems.itemId, reqItem.itemId),
      )).limit(1);

    if (!ci) throw notFound(`Item indisponível nesta cantina`);
    if (!ci.disponivel || !ci.visivel) throw badRequest(`Item indisponível`);

    // 2. Decrementar estoque atomicamente (CHECK >= 0 protege)
    const result = await tx.update(cantinaItems)
      .set({ estoque: sql`${cantinaItems.estoque} - ${reqItem.quantidade}` })
      .where(and(
        eq(cantinaItems.cantinaId, c.var.cantina.id),
        eq(cantinaItems.itemId, reqItem.itemId),
        gte(cantinaItems.estoque, reqItem.quantidade),  // só decrementa se tem estoque
      ))
      .returning({ id: cantinaItems.itemId });

    if (result.length === 0) {
      throw conflict(`Estoque insuficiente pra ${reqItem.itemId} (race ou esgotou)`);
    }

    // 3. Acumular pra inserir order_items
    orderItemRows.push({
      // usa ci.preco (per-cantina), NÃO items.preco
      precoSnapshot: ci.preco,
      // ... resto ...
    });
  }

  // 4. Inserir order com cantina_id setado
  await tx.insert(orders).values({
    // ... existentes ...
    cantinaId: c.var.cantina.id,
    senha: await nextSenha(tx, c.var.cantina.id),  // agora passa o real
  });
  await tx.insert(orderItems).values(orderItemRows);
});
```

`nextSenha(db, cantinaId)` — query existente já aceita o param, só remover o `null` hardcoded.

### E. Mobile

**Signup ([app/(auth)/cadastro.tsx]):**

- Remove campo "nome"
- Mantém: email + senha + confirma senha (UX standard pra evitar typo de senha; backend só recebe `password` no payload)
- Submit: `POST /auth/register` → recebe token → AuthContext seta user → redireciona pra `(onboarding)/welcome`

**Onboarding (novo flow em `app/(onboarding)/`):**

- `_layout.tsx` — Stack navigator, sem tabs, sem header (fullscreen)
- `welcome.tsx` (tela 1) — copy nova: "Vamos personalizar seu cardápio. Conta um pouco sobre você?" + botão "Continuar"
- `dados.tsx` (tela 2) — TextInput nome + TextInput RM (mask 6 dígitos via `maxLength=6` + `keyboardType=number-pad` + sanitize on change). Botão "Continuar" desabilita até ambos válidos
- `cantina.tsx` (tela 3) — fetch `/tenants/tree`, dois selects:
  - Picker unidade (obrigatório)
  - Picker cantina (obrigatório, lista filtrada pela unidade selecionada)
  - Botão "Concluir" → `PATCH /auth/me { name, rm, cantinaId }` → AuthContext atualiza user → redireciona pra `(tabs)`

**Detecção "onboarding completo"** em `(tabs)/_layout.tsx`:

```typescript
const isOnboardingComplete = !!(user.name && user.rm && user.cantinaId);
if (!isOnboardingComplete) return <Redirect href="/(onboarding)/welcome" />;
```

**Persistência mid-flow:** nenhuma. Se user fecha entre tela 2 e 3, ao reabrir vai pra tela 1 (perde nome+RM digitados). Aceitável pra MVP.

**Home ([app/(tabs)/index.tsx]):**

- Header customizado (substitui o atual):
  - Linha 1: "Olá, {user.name}"
  - Linha 2: link **"Mudar unidade"** (esquerda, texto cinza secundário, leva pra `/perfil/unidade`) + **Picker dropdown** (direita, mostra cantina session atual, tap abre modal com lista das cantinas da unidade do user)
- Selecionar nova cantina no picker: atualiza `currentCantinaId` em AsyncStorage + força refetch da query de items
- `currentCantinaId` é separado de `user.cantinaId` (default). Boot do app: `currentCantinaId = currentCantinaId ?? user.cantinaId`

**Cantina context (novo):** criar `apps/mobile/context/CantinaContext.tsx`:

```typescript
interface CantinaContextType {
  currentCantinaId: string | null;  // session atual
  setCurrent: (id: string) => void;  // muda só local
  available: Cantina[];  // cantinas da unidade do user
}
```

`apiFetch` (lib) lê `currentCantinaId` do contexto e injeta header `X-Cantina-Id` em toda request pra rotas autenticadas (items, orders, favorites). Auth e tenants/tree não precisam (público).

**Perfil ([app/(tabs)/perfil.tsx] + sub-screens):**

- Display: nome, email, RM (read-only), unidade atual, cantina default
- Editar nome → `PATCH /auth/me { name }`
- Editar unidade (`/perfil/unidade`):
  - Lista unidades
  - Ao confirmar troca: `PATCH /auth/me { cantinaId: null }` (limpa cantina default)
  - Redireciona pra `/perfil/cantina-default` forçando re-pick
  - **Atualiza `currentCantinaId` em AsyncStorage pra `null`** — força user pickar nova
- Editar cantina default (`/perfil/cantina-default`):
  - Lista cantinas da unidade atual
  - `PATCH /auth/me { cantinaId }`
  - Atualiza `currentCantinaId` em AsyncStorage pra a nova default

### F. Seed atualizado

`apps/api/src/db/seed.ts` ganha:

1. **12 items globais** (volta o catálogo do CP2): café, misto-quente, pão de queijo, etc. Mesmas categorias e tags.
2. **48 rows de cantina_items** (12 items × 4 cantinas), cada uma com:
   - **`preco`** — derivado por estratégia per-unidade. Helper interno no seed:
     ```typescript
     const PRICE_MULTIPLIER_BY_UNIDADE: Record<string, number> = {
       u_paulista: 1.0,   // base (preço original do items)
       u_lins:     0.85,  // 15% mais barato (interior)
     };

     function precoPara(itemPreco: string, unidadeId: string): string {
       const mult = PRICE_MULTIPLIER_BY_UNIDADE[unidadeId] ?? 1.0;
       return (parseFloat(itemPreco) * mult).toFixed(2);
     }
     ```
     Pra cada (cantina, item), busca a unidade da cantina (cantina → escola → unidade) e aplica o multiplier. **Resultado:** `c_pa_5` e `c_pa_7` têm preços idênticos entre si (mesma unidade Paulista); `c_lins_sc_1` e `c_lins_fac_1` têm preços idênticos entre si (mesma unidade Lins, mas 15% abaixo de Paulista).
   - **`estoque`** — `Math.floor(Math.random() * 251) + 100` — random `[100, 350]` por linha
   - **`disponivel: true, visivel: true`** — defaults; admin pode mudar via UI futura (Fase C)

Idempotente via `onConflictDoNothing` por PK composta `(cantina_id, item_id)`.

**Run order:** o seed insere primeiro `unidades`, `escolas`, `cantinas` (existente da Fase A), depois `items` (novo bloco), depois `cantina_items` (precisa de items + cantinas já populados).

### G. Testes

**Backend (apps/api):**

- `cantina_items.test.ts` — CHECK constraint barra estoque negativo (INSERT direto + UPDATE direto)
- `routes/items.test.ts` (refactor) — exige X-Cantina-Id, retorna só items disponivel+visivel daquela cantina, item com estoque=0 ainda aparece, item de outra cantina não vaza
- `routes/orders.test.ts` (refactor) — usa cantina_items.preco (não items.preco); decrementa atomicamente; race condition (criar 2 orders concorrentes pro mesmo item com estoque=1 → 1 sucesso + 1 conflict 409); rejeita estoque insuficiente com 409
- `routes/auth.test.ts` (refactor) — signup sem name funciona; PATCH /auth/me atualiza campos parciais; PATCH com RM inválido rejeita 422; PATCH com cantina_id de outra unidade rejeita 422 (após user já ter unidade definida)
- `users.test.ts` (novo) — CHECK staff-must-have-name barra INSERT
- `test/fixtures.ts` — atualizar `createTestUser` pra aceitar opcional `{ name, rm, cantinaId }`; novo helper `createTestCantinaItems(db, cantinaId)` pra setup rápido

**Mobile (apps/mobile):**

- Atualizar testes que dependiam de signup com name
- `app/(onboarding)/_state.test.ts` (se houver lógica testável) — validação de RM mask, derivação de cantinas pela unidade
- `lib/cantina-context.test.ts` — fallback `current ?? user.cantinaId`

**Cobertura esperada:** ~75 tests no API (63 → +12 novos), ~22 mobile (sem mudança significativa).

## Sequência de execução (commits separados)

| # | Commit | Conteúdo |
|---|---|---|
| 1 | `feat(db): cantina_items + users.rm/name nullable + cleanup Fase A` | Schema novo + migration `0003` + seed reescrito (items voltam, cantina_items random) |
| 2 | `feat(api): PATCH /auth/me + signup sem nome` | Endpoint novo + refactor RegisterSchema + testes auth |
| 3 | `feat(api): wire tenant-context em items/orders/favorites + decremento atomico` | Middleware aplicado nas 3 rotas, refactor handlers, transaction em POST /orders, nextSenha real |
| 4 | `feat(mobile): signup simplificado + onboarding 3 telas + CantinaContext` | Cadastro sem nome + 3 telas onboarding + Context novo + apiFetch injeta header |
| 5 | `feat(mobile): home picker + perfil edits` | Header redesign na home + Perfil edits (nome/unidade/cantina default) |
| 6 | `chore(db): wipe + reseed do Neon` | Operação de banco; sem código (Task 6 da Fase A já dá o template de execução manual) |
| 7 | `test: cobertura Fase B (race, CHECK, fixtures)` | Testes novos descritos em §G |
| 8 | `docs: spec Fase B entregue + atualiza CLAUDE/HANDOFF + memoria` | Spec na pasta superpowers + HANDOFF + memory atualizada |

Cada commit valido com `pnpm -r typecheck && pnpm -r test` antes de seguir.

## Critérios de sucesso

A Fase B está completa quando:

- [ ] `pnpm -r typecheck` passa nos 3 workspaces
- [ ] `pnpm -r test` passa (~75 API + 22 mobile)
- [ ] Migration `0003_cardapio_per_cantina.sql` aplicada em pglite e Neon sem erro
- [ ] `pnpm api:db:reset` + `migrate` + `seed` deixa o banco com 12 items + 48 cantina_items + 4 cantinas
- [ ] `GET /api/v1/items` sem header retorna 400 (middleware)
- [ ] `GET /api/v1/items` com header de cantina X retorna 12 items dessa cantina; item com `disponivel=false` ou `visivel=false` não aparece; item com `estoque=0` aparece com `estoque: 0` no DTO
- [ ] `POST /api/v1/orders` com header decrementa cantina_items.estoque atomicamente
- [ ] `POST /api/v1/orders` 2x concorrente pro mesmo item (estoque=1, qty=1 cada) → 1 retorna 201, outro retorna 409 (race detected)
- [ ] CHECK barra `INSERT cantina_items (estoque=-1)`
- [ ] CHECK barra `INSERT users (role='staff', name=NULL)`
- [ ] CHECK barra `INSERT users (rm='abc')` ou `rm='12345'` (5 dígitos) ou `rm='1234567'` (7)
- [ ] `POST /auth/register` sem `name` no body funciona; com `name` → 422 (extra field se Zod strict, ou ignorado se loose)
- [ ] `PATCH /auth/me { rm: '999999' }` funciona; `PATCH /auth/me { rm: 'abc999' }` → 422
- [ ] Mobile: signup → onboarding tela 1 → tela 2 → tela 3 → home; home mostra cardápio da cantina escolhida
- [ ] Mobile: picker no topo da home troca cantina session sem persistir no DB; refetch ocorre
- [ ] Mobile: trocar unidade no Perfil limpa cantina default e força repicker
- [ ] `pnpm dev` sobe API + Metro sem erro
- [ ] Documentação atualizada: HANDOFF, CLAUDE, memória

## Riscos e mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|---|---|---|---|
| Race condition em decremento de estoque deixa estoque negativo | Baixa (com CHECK + WHERE gte) | Médio | CHECK `estoque >= 0` no schema; WHERE `estoque >= qtd` no UPDATE; se 0 rows retornadas → 409 Conflict |
| Mobile manda request sem header X-Cantina-Id | Média (durante refactor) | Médio | `apiFetch` lê CantinaContext e injeta automaticamente; se `currentCantinaId` é null e a rota requer header → erro local antes de fetch |
| User completa onboarding com cantina X mas depois admin desativa cantina X | Baixa | Baixo | API retorna 404 no middleware quando cantina inativa; frontend captura, força user re-pickar via Perfil |
| `cantina_items.preco` desatualizado vs preço real cobrado pela cantina | Média | Baixo | Por enquanto preço é hardcoded no seed; staff edita preço via tela admin (Fase C). Fora de escopo da Fase B |
| Drizzle gera DROP+ADD em vez de RENAME nas mudanças de items/favorites | Alta | Baixo | Banco wipado de novo; aceitável. Documentar no commit |
| User deleta cantina_id do user via `PATCH /auth/me { cantinaId: null }` e fica preso sem cantina | Baixa (UX flow não permite isso direto) | Médio | Mobile só envia null durante "trocar unidade"; depois força repicker imediato. API aceita null mas frontend gerencia o flow |
| Customer se loga, recebe JWT antigo sem cantina, abre app, mas cantina já existia (não tinha onboarding antes) | Baixa (flow novo) | Médio | Detecção `isOnboardingComplete` no `(tabs)/_layout` cobre — redireciona pra onboarding se faltar campo |
| Performance do JOIN items × cantina_items em escala | Baixa (12 items × 4 cantinas) | Baixo | Index em cantina_items.cantina_id; query é 1 round-trip; sem N+1 |

## Pendentes pós-Fase B (handoff pra Fase C)

Quando Fase B fechar, registrar no HANDOFF:

- Tabela `cantina_items` populada (4 × 12 = 48 rows)
- Endpoint `PATCH /auth/me` disponível pra Fase C usar (`/auth/reset-password` na Fase D vai seguir padrão similar)
- Middleware `tenantContext` aplicado em items/orders/favorites — Fase C herda
- Schema tem `disponivel` (operacional) e `visivel` (vitrine) — Fase C precisa só wire UI staff
- `nextSenha(db, cantinaId)` real — Fase C pode usar pra senhas per-cantina
- CantinaContext mobile pronto; Fase C adiciona tela admin reutilizando o pattern
- Items globais voltaram; staff (Fase C) pode adicionar/editar items na tela admin
- Validation custom de "cantina pertence à unidade do user" pode ser refatorada pra um helper compartilhado quando admin precisar
