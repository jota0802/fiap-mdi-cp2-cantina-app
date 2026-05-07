# Sub-projeto 2 / Fase C — Cantina admin (staff app)

**Data:** 2026-05-07
**Autor:** João Victor (jota0802) com Claude Opus 4.7 (1M context)
**Status:** Aprovado em brainstorming, pronto pra implementação
**Sub-projeto:** 2 (Cantina admin / multi-tenant)
**Fase:** C — Staff app + máquina de estados de pedido + admin de cardápio + estatísticas (3ª de 4)

## Contexto

A Fase B entregou os fundamentos do cardápio per-cantina: tabela `cantina_items` com `preco`/`estoque`/`disponivel`/`visivel`, decremento atômico no `POST /orders` com race detection (409), middleware `tenantContext` aplicado em items/orders/favorites, onboarding mobile 3 telas, `PATCH /auth/me`. O JWT já carrega `role: 'staff'` e `cantinaId` pra staff (criado via CLI `pnpm api:create-staff`), mas **nada do lado staff existe na UI** — staff hoje loga e cai nas mesmas telas de cliente, sem como avançar pedidos, gerenciar cardápio, ou ver estatísticas.

A Fase C ativa o lado operacional da cantina: um shell separado pra staff, dentro do mesmo APK, com layout adaptativo pra tablet (rail permanente em ≥900px, drawer colapsável em portrait/celular). Staff loga, cai direto em `(staff)/pedidos` (master-detail com fila ativa + histórico), pode marcar pedidos como pronto (single ou bulk), cancelar com devolução automática de estoque, editar visibilidade/operacionalidade/estoque/preço dos items da própria cantina, e ver dashboard de estatísticas com filtro Hoje/Semana/Mês. Cliente também ganha capacidade de cancelar pedido enquanto não foi marcado pronto.

Junto vem uma simplificação importante da máquina de estados: hoje os pedidos têm 5 statuses (`pendente`, `preparando`, `pronto`, `retirado`, `cancelado`) e a `OrdersContext` mobile auto-promove `pendente → pronto` em 3min como mock do CP2. A Fase C reduz pra 3 statuses globais (`pedido | pronto | cancelado`), com mensagens adaptativas no frontend pra cada user (cliente vê "Em preparo", staff vê "Em preparação"), remove o auto-pronto e responsabiliza o staff por cada transição. `pronto` é terminal — staff não marca `retirado` (resolve o problema de "esqueci de confirmar retirada"); a fila ativa filtra `pronto há > 30min` pro histórico.

Após Fase C, o app está completo do ponto de vista operacional pra uso real: cliente faz pedido, staff prepara, staff marca pronto, cliente vai retirar. Apenas push notification ao cliente quando pronto fica fora de escopo (Fase D — exige Expo Push Service + token registration).

## Decisões já tomadas (do brainstorming)

| Decisão | Valor escolhido | Justificativa |
|---|---|---|
| Distribuição staff | **Mesmo APK Expo, layout adaptativo** | Mantém invariante mobile-only (sem build web por XSS); rail permanente em tablet landscape, drawer em phone/portrait |
| Shell de navegação | **Side rail permanente em ≥900px, drawer colapsável <900px** | Padrão tablet (Mail iPad, Notion); rail ocupa só 88px deixando espaço pro conteúdo respirar |
| Threshold do breakpoint | **`useWindowDimensions().width >= 900`** | Cobre iPad mini landscape (1024) e tablets Android 10"; não ativa em phone landscape (~800-880px típico) |
| Tela primária do staff | **Pedidos (master-detail)** | Onde staff passa 80% do tempo. Master-detail vence Kanban porque coluna "Pronto" acumularia muito mais que "Em preparo" durante o dia (retenção 30min) |
| Tela Cardápio admin | **Master-detail (consistente com Pedidos)** | Mesma metáfora visual; lista esquerda + editor à direita. Consistência > densidade pro caso de uso real (não é planilha de bulk edit massivo) |
| Tela Estatísticas | **Dashboard com KPI cards + bar chart SVG** | "Wow" pra portfólio; chart desenhado com `react-native-svg` primitivo (já temos), zero nova dep |
| Máquina de estados | **3 statuses: `pedido \| pronto \| cancelado`** | Reduz de 5 pra 3. Texto adaptado por user no frontend (cliente vê "Em preparo", staff vê "Em preparação") |
| Pedido nasce em | **`pedido`** (= antigo `preparando`) | Sem etapa "aceitar" — cantina assume; simplifica fluxo |
| `pronto` é terminal | **Sim — staff NÃO marca `retirado`** | Resolve "esqueci de confirmar retirada"; fila ativa filtra `pronto há > 30min` pro histórico |
| Rollback de status | **Só `pronto → pedido`** com confirm | Erros de "marquei pronto cedo demais"; em menu "···" |
| Cancelamento — quem | **Staff E cliente** enquanto status = `pedido` | Race idempotente; campo `canceled_by` registra quem cancelou |
| Cancelamento devolve estoque | **Sim, transação atômica (inverso do POST /orders)** | `UPDATE estoque + qtd` na mesma row de cantina_items |
| Auto-pronto 3min | **Removido** | Mock de CP2; staff é a fonte da verdade agora |
| Bulk markPronto | **Modo "Selecionar" multi-select** + endpoint `PATCH /orders/bulk-status` tudo-ou-nada | Caso real: 4 pedidos prontos ao mesmo tempo. All-or-nothing evita inconsistência se um já foi cancelado |
| Real-time (staff) | **TanStack Query `refetchInterval: 5000`** | Latência ≤5s pra novos pedidos; sem WebSocket/SSE (overkill MVP) |
| Real-time (customer) | **Refetch 10s quando aba pedidos no foreground** | Cliente vê transição quando app aberto. Push notif vira Fase D |
| Search na fila | **Input de busca: senha exata OU substring de nome** | Atalho rápido; sem QR/camera scan (sem ROI claro) |
| Detail panel ações | **Marcar pronto · Cancelar com motivo opcional · Voltar status** | Mínimo necessário; impressão e notify cliente fora de escopo |
| Cardápio admin save model | **Autosave em blur (numbers) + onChange (toggles)** | Indicador "salvando…" → "✓ salvo" sutil; sem botão Save explícito |
| `disponivel` semântica | **Default `true`, staff manualmente toggle pra false em manutenção** | UI: toggle secundário (não destacado); reservado pra "máquina quebrou", "acabou ingrediente fora do estoque" |
| `visivel` semântica | **Toggle primário** — controla se item aparece na vitrine cliente | Edição mais frequente que `disponivel` |
| Login/redirect role-based | **Mesmo login screen; gate redireciona conforme `user.role`** | Zero UI nova de login; `staff` → `(staff)/pedidos`, `customer` + onboarding → `(onboarding)`, `customer` → `(tabs)` |
| Staff vê lado cliente | **Não** | Acesso a `(tabs)/*` redireciona pra `(staff)/pedidos`; staff em horário de trabalho |
| Staff onboarding | **Não tem** | CLI já cria com `name`, `email`, `cantina_id`; vai direto pra Pedidos |
| CantinaPicker pra staff | **Desabilitado** | Staff é fixo em `user.cantinaId`; `apiFetch` injeta esse valor sem AsyncStorage override |
| UI design language | **Premium minimalista, padrão do app cliente, sem emojis** | Reusa `useTheme()`, `createStyles(c: ThemeColors)`, tokens (`shadow.md`, `pressedSoft`, sentence case, eyebrows uppercase). Ícones via `@expo/vector-icons` (Ionicons coerentes com cliente) |
| Stats — período | **Segmented control: Hoje \| Semana \| Mês** | 3 opções fixas; sem custom range pra MVP |
| Stats — métricas | **Atendidos · Cancelados · Ticket médio · Tempo médio de preparo · Bar chart pedidos/hora · Top 5 items** | Cobertura: volume + qualidade + financeiro + ranking |
| Stats — cache | **Sem cache; computado on-demand** | Volume baixo (1 cantina × 1 dia ~ <1k orders); query agregada Postgres é instantânea |
| Histórico de pedidos | **Aba/filtro dentro da tela Pedidos** | Não merece tela separada; toggle no header da lista alterna fila ativa ↔ histórico com filtro de data |

## Escopo

### Dentro

1. **Schema diff:**
   - `orders`: adicionar colunas `pronto_em timestamp NULL`, `cancelado_em timestamp NULL`, `canceled_by text NULL` (CHECK valor em `('customer','staff')`), `cancel_reason text NULL`
   - `orders.status` enum: drop `pendente`, `preparando`, `retirado`. Manter `pedido` (renomear de `preparando` ou criar novo?), `pronto`, `cancelado`. Decisão de implementação no plano: ou rename via UPDATE + alter check, ou novo enum + drop antigo.
   - Migration Drizzle `0004_fase_c_orders.sql`
2. **Endpoints novos backend:**
   - `PATCH /api/v1/orders/:id/status` — staff-only via middleware `requireRole('staff')`. Body: `{ status: 'pronto' | 'cancelado' | 'pedido', reason?: string }`. Transação Drizzle: valida transição permitida (`pedido → pronto`, `pronto → pedido` rollback, `pedido → cancelado`). Cancelamento devolve estoque (`UPDATE cantina_items SET estoque = estoque + qtd` por linha de order_items). 409 se transição inválida (ex: `pronto → cancelado`, `cancelado → *`).
   - `PATCH /api/v1/orders/bulk-status` — staff-only. Body: `{ ids: string[], status: 'pronto' }`. Transação tudo-ou-nada: se algum dos `ids` não está em `pedido`, retorna 409 com `failedIds`. Sem rollback parcial (atomicidade do BD).
   - `POST /api/v1/orders/:id/cancel` — customer-only (no middleware staff). Cliente cancela próprio pedido enquanto status=`pedido`. Devolve estoque. Registra `canceled_by='customer'`. 409 se status ≠ `pedido` ou pedido pertence a outro user.
   - `PATCH /api/v1/cantina-items/:itemId` — staff-only. Body parcial: `{ visivel?, disponivel?, estoque?, preco? }`. Tenant isolation: cantina_id da row vem de `user.cantinaId` (staff é fixo). Sem PK composta no path — só `:itemId` porque a cantina é implícita no token.
   - `GET /api/v1/stats?period=daily|weekly|monthly` — staff-only. Retorna `{ atendidos, cancelados, ticketMedio, faturamento, tempoMedioPreparo, pedidosPorHora: number[], topItems: Array<{itemId, nome, qtd, faturamento}> }`. Computado via SQL agregado. Tenant isolation pela cantina_id.
3. **Middleware `requireRole('staff')`:** novo, em `apps/api/src/middleware/require-role.ts`. Lê `c.get('jwtPayload').role`, retorna 403 Forbidden se ≠ `staff`. Aplicado nas rotas listadas (exceto `/cancel` do customer).
4. **Tenant isolation reforçado:** `requireRole('staff')` + `tenantContext` garantem `staff.cantinaId === resource.cantinaId`. Endpoints novos validam explicitamente onde a cantina não vem do header.
5. **Customer-side cleanup:**
   - `OrdersContext.ts`: dropar auto-promoção `pendente → pronto` após 3min. Dropar scheduled notification 3min em `confirmacao.tsx`.
   - Adicionar `useStaffOrders`-equivalente pro lado cliente: `useMyOrders` com `refetchInterval: 10000` quando aba `(tabs)/pedidos` no foreground.
   - Adicionar botão "Cancelar pedido" na tela de detalhe/confirmação enquanto status=`pedido`. Confirm modal.
6. **Mobile shell `app/(staff)/`:**
   - `_layout.tsx` — Stack root com 4 telas (`pedidos`, `cardapio`, `stats`, `perfil`). Wrapper `StaffShell.tsx` decide entre side rail e drawer baseado em `useResponsiveShell()`.
   - `useResponsiveShell.ts` (hook novo em `apps/mobile/hooks/`) — retorna `{ mode: 'rail' | 'drawer' }` baseado em `useWindowDimensions().width >= 900`.
   - `SideRail.tsx` (componente novo) — rail vertical 88px com 4 ícones (Ionicons: `list-outline`, `restaurant-outline`, `bar-chart-outline`, `person-outline`) + labels abaixo. Active state usa `colors.primarySoft` background + `colors.primary` text. Sem emojis.
   - `MobileDrawer.tsx` (componente novo) — drawer de 280px slide-in da esquerda, com hambúrguer trigger no header. Fecha ao tocar fora ou selecionar item.
   - Gate de role no `app/_layout.tsx`: ler `user.role`; se `staff`, redirect pra `(staff)/pedidos` quando rota atual é `(tabs)/*` ou `(onboarding)/*`.
7. **Mobile tela Pedidos `app/(staff)/pedidos.tsx`:**
   - Layout master-detail responsivo via `useResponsiveShell`. Em rail mode: lista 38% + detail 62%. Em drawer mode: lista full-width, tap empurra `app/(staff)/pedido/[id].tsx` no stack.
   - Lista: cards compactos com border-left colorida (laranja=`pedido`, verde=`pronto`), senha bold, nome+RM, num itens, tempo relativo (`há 3min`).
   - Header da lista: contagens (`Em preparação 4 · Pronto 2 · Histórico`), botão "Selecionar" (entra modo multi-select), input de busca colapsável.
   - Detail panel: senha XL, customer info, lista de items com qtd+preço+subtotal, total destaque, timestamps (`Pedido às 14:32 · 3min atrás`), CTAs (`Marcar pronto` primária com ícone check, `Cancelar` secundária, menu "···" com Voltar status quando aplicável).
   - Modais: `ConfirmMarkPronto`, `ConfirmCancel` (com text input de motivo opcional), `ConfirmRollback`. Reusa estilo do `Alert` do app cliente mas como Modal RN com presentation slide.
   - Modo seleção: header da lista vira "(N) selecionados · Marcar selecionados como pronto · Cancelar seleção". Cards `pedido` ganham checkbox à esquerda; cards `pronto` ficam disabled.
   - Search: input no header filtra `senha === query OR nome.toLowerCase().includes(query)`. Limpa ao mudar de tela.
   - Histórico: botão no header alterna; lista mostra `pronto há > 30min` + `cancelado` com filtro de data (chips: `Hoje | Ontem | 7 dias | Custom date picker`).
   - TanStack Query: `useStaffOrders({ scope: 'active' | 'history', date?: string })` com `refetchInterval: 5000` em `active`.
8. **Mobile tela Cardápio admin `app/(staff)/cardapio.tsx`:**
   - Master-detail responsivo idêntico ao Pedidos.
   - Lista: 12 items com thumbnail (vem de `items.imagem_url` quando existir, fallback `Image` do design system), nome, badges (`Esgotado` se estoque=0, `Fora da vitrine` se !visivel, `Em manutenção` se !disponivel). Border-left status color.
   - Detail panel: thumbnail grande topo, nome, secciones com eyebrows uppercase:
     - **Visibilidade:** 2 toggles (`Vitrine` primário, `Operacional` secundário). Hint subtítulo: "Operacional: desligue só em manutenção temporária".
     - **Estoque:** input numérico + botões `–` / `+` (haptics em cada toque), validação `>= 0`.
     - **Preço:** input numérico R$ com mask (R$ X,XX), validação `> 0`.
   - Save model: autosave em `onBlur` (numbers) + `onValueChange` (switches). Visual feedback: timestamp "Salvo às HH:MM:SS" com fade-in `useFadeIn` ou indicator inline "salvando…" → "salvo".
   - Hook `useStaffCardapio()` — retorna lista; mutation `useUpdateCantinaItem({ itemId, patch })`.
9. **Mobile tela Estatísticas `app/(staff)/stats.tsx`:**
   - Header: `Estatísticas` title + segmented control (Hoje | Semana | Mês).
   - Row 1: 4 KPI cards em grid (`flex: 1` cada). Cada card: eyebrow uppercase, valor 28px bold, sub-texto comparação (`↑ 12% vs período anterior` em verde, `↓ X% vs anterior` em vermelho).
   - Row 2: split 60/40
     - Esquerda: bar chart `Pedidos por hora` (8h–18h, 10 barras). Componente `BarChart.tsx` novo em `apps/mobile/components/` — recebe `data: Array<{label: string, value: number}>`, renderiza com `react-native-svg` primitivo (Rect + Text). Hover/tap mostra valor.
     - Direita: lista Top 5 items. Cada linha: posição, nome, qtd vendida, faturamento.
   - Hook `useStaffStats({ period })`. Sem refetchInterval (estatísticas mudam devagar; refetch on focus).
10. **Mobile tela Perfil staff `app/(staff)/perfil.tsx`:**
    - Foto user (read-only, sem ImagePicker — pra MVP staff), nome, email
    - Cantina vinculada — texto formatado: `{cantina.nome} · {escola.nome} · {unidade.nome}` (resolvido via `tenantsTree` da Fase A)
    - Toggle de tema (light/dark) — reusa do customer
    - Botão Logout — reusa lógica do AuthContext
    - Sem edição de campos (staff é gerenciado via CLI)
11. **CantinaContext + apiFetch:** ajuste pra staff. Em `CantinaProvider`, se `user.role === 'staff'`, `currentCantinaId` é forçado pra `user.cantinaId` e o setter é no-op (warn em dev). `apiFetch` continua injetando `X-Cantina-Id` lendo do context. CantinaPickerHeader fica fora do shell `(staff)`.
12. **Componentes novos compartilháveis:**
    - `BarChart.tsx` (`react-native-svg`-based, data-driven)
    - `KpiCard.tsx` (eyebrow + valor grande + comparação)
    - `SegmentedControl.tsx` (genérico, com 2-N opções; reusável em filtros)
    - `MasterDetailLayout.tsx` (HOC ou componente que recebe `listSlot`, `detailSlot`, gerencia split responsive)
    - `ConfirmModal.tsx` (genérico, recebe título/body/CTA primária+secundária — reusado em todos os confirms)
13. **Theme tokens novos** se necessário em `constants/theme.ts`:
    - `colors.statusPedido` (laranja warm — reusa `colors.primary` ou cria), `colors.statusPronto` (verde — já existe `statusPalette`), `colors.statusCancelado` (cinza)
    - Confirmar: `statusPalette` em `constants/theme.ts` já tem `preparando`, `pronto`, `retirado`. Renomear/adaptar pra novo enum.
14. **Testes novos:**
    - **API (vitest):**
      - Transições de status válidas/inválidas em `PATCH /orders/:id/status`
      - Bulk markPronto tudo-ou-nada (1 falha → todos rejeitados)
      - Cancelar (staff e customer) devolve estoque atomicamente
      - Race: cancelar e marcar pronto simultaneamente → idempotente
      - Middleware `requireRole('staff')` bloqueia customer (403)
      - `PATCH /cantina-items/:itemId` valida tenant isolation (staff cantina A não edita item de cantina B)
      - `GET /stats` agregação correta por período (daily/weekly/monthly)
      - Customer cancel rejeita pedido de outro user (404 ou 403)
    - **Mobile (vitest Node):**
      - `useResponsiveShell` retorna `'rail'` em width >= 900, `'drawer'` em < 900
      - Role redirect logic: staff → `(staff)/pedidos`, customer + onboarding → `(onboarding)`, customer → `(tabs)`
      - Bulk select toggle: adiciona/remove ids do set
      - `BarChart` renderiza N barras com proporções corretas (testar via render output ou snapshot)
    - **Manual no APK:**
      - Tablet AVD (resolução tablet 1280×800) + smoke phone AVD: master-detail vs stack mode
      - Login staff → (staff)/pedidos direto
      - Login customer com onboarding incompleto → (onboarding)
      - Marcar pronto + bulk + cancelar (cliente e staff) + rollback
      - Editar visivel/disponivel/estoque/preço — autosave funciona
      - Stats — 3 períodos populados de mock seed
15. **Atualização de docs:**
    - `CLAUDE.md` — adicionar §14 sobre staff app + máquina de estados nova; remover menções a `retirado`
    - `docs/HANDOFF.md` — seção Fase C entregue; próxima ação Fase D
    - `docs/ROADMAP.md` — marcar Fase C done
    - Memória — `project_estado_atual.md` snapshot pós-Fase C; `project_proxima_acao.md` aponta pra Fase D ou portfolio

### Fora (futuras fases ou descartado)

- **Push notifications cliente quando pronto** (Fase D — exige Expo Push Service + token registration + backend integration)
- **Fornecedores** (Fase D)
- **Reset de senha** (Fase D)
- **Housekeeping/admin global** (Fase D)
- **Impressão de comanda** (sem hardware/fluxo definido; descartado pra MVP)
- **QR/camera scan da senha** (cliente já mostra QR; staff lê visualmente — sem ROI)
- **Custom date range em stats** (3 períodos fixos suficientes pra MVP)
- **WebSocket / SSE** real-time (polling 5s suficiente)
- **Edição de items globais (table `items`)** — staff edita só `cantina_items`; admin global é Fase D
- **Onboarding staff** — staff é gerenciado via CLI
- **Trocar cantina default do staff** — staff é fixo na cantina (CHECK no schema)
- **Cantina aberto/fechado toggle** (cantina sempre considerada aberta; sem horário de funcionamento)
- **Multi-staff por cantina simultâneo** com lock/coordenação — assume fluxo single-tablet
- **Rollback de `cancelado`** — terminal, não tem volta

## Mudanças por área

### A. Schema de banco

**Diff em `orders`:**

```sql
ALTER TABLE orders
  ADD COLUMN pronto_em timestamp NULL,
  ADD COLUMN cancelado_em timestamp NULL,
  ADD COLUMN canceled_by text NULL,
  ADD COLUMN cancel_reason text NULL,
  ADD CONSTRAINT orders_canceled_by_check
    CHECK (canceled_by IS NULL OR canceled_by IN ('customer','staff')),
  ADD CONSTRAINT orders_cancel_consistency
    CHECK (
      (status = 'cancelado' AND cancelado_em IS NOT NULL AND canceled_by IS NOT NULL)
      OR
      (status != 'cancelado' AND cancelado_em IS NULL AND canceled_by IS NULL)
    );
```

**Status enum simplificado:**

Decisão de implementação no plano (alternativas equivalentes):

- **(a)** UPDATE `status='preparando'` → `status='pedido'`; depois ALTER CHECK pra valores `('pedido','pronto','cancelado')`. Drop linhas com status `pendente` ou `retirado` se houver (não deve ter — tudo é seed).
- **(b)** Drop coluna + recreate com novo CHECK. Mais bruto mas mais limpo.

Plano escolherá. **Pre-condição:** wipe + reseed do Neon antes da migration (já é prática estabelecida; `pnpm api:db:reset && pnpm api:db:migrate && pnpm api:db:seed`).

**Migration nome:** `0004_fase_c_orders.sql`

### B. Backend — endpoints

**Middleware `requireRole(role: ValidRole)` em `apps/api/src/middleware/require-role.ts`:**

```ts
export function requireRole(role: ValidRole) {
  return async (c, next) => {
    const payload = c.get('jwtPayload');
    if (payload.role !== role) {
      return c.json({ error: 'Forbidden' }, 403);
    }
    await next();
  };
}
```

Aplicado em todas as rotas staff via `app.patch('/orders/:id/status', requireRole('staff'), ...)`.

**`PATCH /api/v1/orders/:id/status`** (staff):

- Validações: pedido existe, `cantina_id === user.cantinaId`, transição permitida.
- Transições válidas: `pedido → pronto`, `pedido → cancelado`, `pronto → pedido` (rollback).
- `pedido → cancelado`: transação que faz `UPDATE orders SET status='cancelado', cancelado_em=now(), canceled_by='staff', cancel_reason=$reason` + para cada `order_items` row, `UPDATE cantina_items SET estoque = estoque + oi.qtd WHERE cantina_id=$cid AND item_id=oi.item_id`.
- `pedido → pronto`: `UPDATE status='pronto', pronto_em=now()`.
- `pronto → pedido` (rollback): `UPDATE status='pedido', pronto_em=NULL`. Sem mexer estoque.
- 409 se transição inválida.

**`PATCH /api/v1/orders/bulk-status`** (staff):

- Body: `{ ids: string[], status: 'pronto' }`
- Transação Drizzle: SELECT FOR UPDATE em todos os ids; valida `status === 'pedido' AND cantina_id === user.cantinaId` em todos. Se algum falha, abort transaction → 409 com `{ failedIds, reason }`.
- Caso ok: `UPDATE` em batch + retorna lista de updated ids.
- Idempotência: se mesmo bulk for chamado 2x, segunda chamada falha com `failedIds` (status já é `pronto`).

**`POST /api/v1/orders/:id/cancel`** (customer):

- Sem `requireRole('staff')`. Valida `order.user_id === user.id` (404 se não).
- Valida `status === 'pedido'` (409 se não).
- Mesma lógica de cancelamento do staff, mas `canceled_by='customer'`. `cancel_reason` é null sempre (cliente não passa motivo).

**`PATCH /api/v1/cantina-items/:itemId`** (staff):

- Body Zod: `{ visivel?: boolean, disponivel?: boolean, estoque?: number, preco?: number }`. Pelo menos 1 campo.
- Cantina = `user.cantinaId` (do JWT). Sem header (tenant é implícito pra staff).
- Update parcial. `estoque` validado `>= 0` (CHECK do BD reforça). `preco` validado `> 0`.
- Retorna row atualizada.

**`GET /api/v1/stats?period=daily|weekly|monthly`** (staff):

- Cantina = `user.cantinaId`.
- SQL agregado:
  - `atendidos`: COUNT(orders WHERE status='pronto' AND created_at >= rangeStart)
  - `cancelados`: COUNT(orders WHERE status='cancelado' AND created_at >= rangeStart)
  - `faturamento`: SUM(orders.total WHERE status='pronto' AND created_at >= rangeStart)
  - `ticketMedio`: faturamento / atendidos
  - `tempoMedioPreparo`: AVG(EXTRACT(epoch FROM (pronto_em - created_at))) WHERE pronto_em IS NOT NULL
  - `pedidosPorHora`: array de 11 inteiros (8h–18h) — count por hora do dia (no daily) ou média por hora (semanal/mensal)
  - `topItems`: SELECT item_id, items.nome, SUM(qtd), SUM(qtd * preco_snapshot) FROM order_items JOIN items GROUP BY item_id ORDER BY SUM(qtd) DESC LIMIT 5
  - Comparação `↑ X%`: roda mesma query no período anterior, calcula delta
- Range:
  - `daily` → `created_at >= start_of_today`
  - `weekly` → `created_at >= today - 7 days`
  - `monthly` → `created_at >= today - 30 days`

### C. Mobile — estrutura de pastas

**Novo:**

```
apps/mobile/app/(staff)/
├── _layout.tsx              # StaffShell wrapper (rail + drawer responsive)
├── pedidos.tsx              # master-detail
├── pedido/[id].tsx          # phone fallback (push detail)
├── cardapio.tsx             # master-detail
├── cardapio/[id].tsx        # phone fallback
├── stats.tsx                # dashboard
└── perfil.tsx               # perfil enxuto

apps/mobile/components/
├── StaffShell.tsx           # decide rail vs drawer
├── SideRail.tsx             # tablet permanent rail
├── MobileDrawer.tsx         # phone slide-in drawer
├── MasterDetailLayout.tsx   # responsive split view
├── BarChart.tsx             # SVG primitive bar chart
├── KpiCard.tsx              # eyebrow + valor + delta
├── SegmentedControl.tsx     # generic period filter
└── ConfirmModal.tsx         # generic confirm dialog

apps/mobile/hooks/
├── useResponsiveShell.ts    # 'rail' | 'drawer'
├── useStaffOrders.ts        # TanStack Query, refetch 5s
├── useStaffCardapio.ts
└── useStaffStats.ts
```

**Atualizado:**

- `app/_layout.tsx` — adiciona role-based redirect logic
- `(tabs)/_layout.tsx` — adiciona guard: se `role === 'staff'`, redirect pra `(staff)/pedidos`
- `(onboarding)/_layout.tsx` — guard equivalente
- `context/CantinaContext.tsx` — staff usa `user.cantinaId` direto (no setter)
- `context/OrdersContext.tsx` — drop auto-pronto 3min; adiciona refetch quando aba foreground
- `app/confirmacao.tsx` — drop scheduled notification 3min; adiciona botão "Cancelar pedido" enquanto `status === 'pedido'`
- `(tabs)/pedidos.tsx` — adiciona ação cancelar; refetch 10s quando focused
- `constants/theme.ts` — `statusPalette` adaptado pro novo enum (`pedido`/`pronto`/`cancelado`)

### D. UI design language (consistência com cliente)

**Inegociáveis** (extraídos do CLAUDE.md §3, §4, §13 e do Design System pós-redesign 28/04/2026):

1. Zero cor hardcoded. Tudo via `useTheme()`. Status via `statusPalette` adaptado.
2. `createStyles(c: ThemeColors)` + `useMemo` em todas as telas.
3. Storage keys em `constants/storage-keys.ts`.
4. **Sem emojis em UI** (mockups do brainstorm usaram emoji só pra wireframe; produção usa `@expo/vector-icons` Ionicons).
5. Sem `Alert` em formulários — erros inline em vermelho abaixo do campo.
6. `useSafeAreaInsets()` em todos os headers.
7. `Pressable` em vez de `TouchableOpacity` em todos os controles novos. `pressedSoft: { opacity: 0.85, transform: [{ scale: 0.98 }] }` em CTAs.
8. Sentence case nos textos. Eyebrows uppercase com `letterSpacing.widest` (já existem tokens).
9. Cards com `...shadow.md`. CTAs primárias com `...shadow.primary`.
10. `c.surface` / `c.surfaceElevated` / `c.primarySoft` (não `c.card`).
11. Bento grids onde tem 3+ informações de paridade (KPIs row da Stats).
12. Animações sutis: `useFadeIn` em headers, `Animated.spring` em transições de seleção, haptics em ações chave (mark pronto, autosave done).

**Ícones (Ionicons):**

- Pedidos: `list-outline` / `list` (active)
- Cardápio: `restaurant-outline` / `restaurant`
- Estatísticas: `bar-chart-outline` / `bar-chart`
- Perfil: `person-outline` / `person`
- Marcar pronto: `checkmark-circle-outline`
- Cancelar: `close-circle-outline`
- Voltar status: `arrow-undo-outline`
- Selecionar: `checkbox-outline`
- Search: `search-outline`
- Mais (kebab): `ellipsis-vertical`

### E. Customer side cleanup

- `OrdersContext.tsx`: remover lógica de auto-promote `pendente → pronto` em 3min e o sweep boot. Drop `Order.prontoEm` do tipo se virar redundante (manter — agora é set pelo backend).
- `confirmacao.tsx`: dropar `scheduleProntoNotification(3 * 60)`. Manter notificação imediata "Pedido recebido".
- Adicionar botão "Cancelar pedido" no detalhe do pedido enquanto status=`pedido`. Confirm modal. Chama `POST /orders/:id/cancel`. Se sucesso, invalidate query.
- `(tabs)/pedidos.tsx`: refetch 10s via `useMyOrders({ refetchInterval: 10000 })` — só quando focused (TanStack `enabled: isFocused`).

## Testes

### API (vitest, em apps/api/src/routes/orders.test.ts e novos)

- `PATCH /orders/:id/status` — staff transições válidas e inválidas (todas as combinações)
- `PATCH /orders/bulk-status` — sucesso 4-de-4 + rejeição parcial atômica
- Cancelamento — devolve estoque exato em todos os items
- Customer cancel — só próprio pedido, só status `pedido`
- `requireRole('staff')` — customer recebe 403
- `PATCH /cantina-items/:itemId` — staff cantina A não pode editar cantina B (404 ou 403)
- Validação Zod do body (estoque < 0, preco <= 0)
- `GET /stats` — agregação correta com fixtures conhecidas; 3 períodos
- `GET /stats` tenant isolation — staff cantina A não vê dados de cantina B

### Mobile (vitest Node, em apps/mobile/test/)

- `useResponsiveShell` — retorna mode correto por width
- Role redirect — testa pure function que decide próxima rota dado `{role, onboardingComplete, currentPath}`
- BarChart — render com props mock retorna número correto de Rect elements (snapshot)
- Bulk select reducer — add/remove/clear ids
- ConfirmModal — chama callback correto em "Confirmar" vs "Cancelar"

### Manual (no APK + emuladores)

Mínimo:

- AVD tablet (1280×800 landscape) — fluxo completo staff (login → pedidos → marcar pronto → bulk → cancelar → cardápio edit → stats)
- AVD phone (Pixel 5) — mesmo fluxo em drawer mode + master-detail collapsado
- Login customer + onboarding incompleto → redireciona corretamente
- Cliente cancela pedido → estoque retorna
- Push de pedido novo no staff aparece em < 5s após customer concluir order

## Sequência sugerida

1. Schema diff + migration `0004_fase_c_orders.sql` + seed reset
2. Middleware `requireRole('staff')` + tests
3. `PATCH /orders/:id/status` (single) + tests
4. `PATCH /orders/bulk-status` + tests
5. `POST /orders/:id/cancel` (customer) + tests
6. `PATCH /cantina-items/:itemId` + tests
7. `GET /stats` + tests
8. Customer-side cleanup (OrdersContext, confirmacao, cancel button) + manual smoke
9. Theme adjustments — `statusPalette` novo enum
10. Hooks mobile staff (`useResponsiveShell`, `useStaffOrders`, `useStaffCardapio`, `useStaffStats`)
11. Componentes shell (`StaffShell`, `SideRail`, `MobileDrawer`)
12. `app/(staff)/_layout.tsx` + role gate em `app/_layout.tsx`
13. `MasterDetailLayout` + `ConfirmModal` (utility)
14. Tela Pedidos (master-detail + bulk + search + ações + histórico)
15. Tela Cardápio admin (master-detail + autosave)
16. Componentes Stats (`KpiCard`, `BarChart`, `SegmentedControl`)
17. Tela Estatísticas
18. Tela Perfil staff
19. Tests mobile (vitest Node)
20. Atualização docs (CLAUDE, HANDOFF, ROADMAP, memória)
21. Validação manual em AVDs + APK build

## Riscos & contingências

| Risco | Probabilidade | Mitigação |
|---|---|---|
| Layout master-detail responsive complicado em RN sem CSS Grid | Média | `useResponsiveShell` + flexbox + `flex: <ratio>`. Já é padrão em apps tablet RN (Expo Router suporta) |
| Polling 5s gera carga no Render free tier | Baixa | 1 cantina ativa, ~10 staff devices simultâneos = 12 req/min. Render free aguenta |
| Migration `0004` quebra orders existentes | Alta se houver dados reais | Dados são só seed; wipe + reseed antes da migration (prática estabelecida) |
| Bar chart SVG fica feio sem lib polida | Baixa-Média | Aceito pra MVP; staff vai apreciar funcionalidade > polish absoluto. Se ficar ruim, troca por Victory na Fase D |
| Race condition em bulk status com cancelamento simultâneo | Média | Transação BD com SELECT FOR UPDATE; testes cobrem |
| Customer cancela pedido depois do staff já ter marcado pronto | Baixa | Validação `status='pedido'` retorna 409; cliente vê erro "Pedido já está pronto" |
| Tablets Android com aspect ratio incomum quebram layout | Média | Testar em pelo menos 2 AVDs (10" 1280×800 + 7" 1024×600); fallback drawer cobre <900px |
| Stats query lenta em volumes grandes | Baixa pra MVP | Cantina ~< 500 orders/dia; query agregada com índices em `cantina_id, status, created_at` é < 100ms |
| Customer não percebe estado mudou (sem push notif) | Alta — UX trade-off aceito | Customer fica perto do balcão; vê status quando abre app. Push é Fase D |

## Critério de aceite

- [ ] Migration aplicada no Neon + dev pglite, baseline `pnpm -r typecheck && pnpm -r test` verde
- [ ] Staff loga via app → cai em (staff)/pedidos com fila populada (mock seed de 4-5 pedidos)
- [ ] Marcar pronto single + bulk funciona, com confirm modal
- [ ] Cancelar (staff e customer) devolve estoque atomicamente — verificar `cantina_items.estoque` no BD
- [ ] Editar visivel/disponivel/estoque/preço de item — autosave indicador visível, persistido
- [ ] Stats Hoje/Semana/Mês mostra números coerentes com fixtures de seed
- [ ] Tablet AVD (1280×800) renderiza side rail; phone AVD renderiza drawer + master-detail collapsado
- [ ] Customer cancela pedido próprio enquanto `pedido` — botão aparece, funciona, estoque volta
- [ ] Customer não vê auto-pronto 3min mais; status só muda quando staff marca
- [ ] APK preview build passa em emulador + (opcional) device físico
- [ ] CLAUDE.md, HANDOFF.md, memória atualizados
- [ ] 100+ tests passando (atualmente 85 API + 22 mobile = 107; espera +15-20 novos)
