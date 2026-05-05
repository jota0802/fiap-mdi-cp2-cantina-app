# Auditoria full — Foundation (2026-05-05)

> Gerada automaticamente via `pnpm audit:run` ao concluir Foundation.
> Phases 1-10 completas, 37+ commits em `feat/foundation`.

---

## Distribuição de commits (shortlog)

```
68	jota0802
31	DevRuanVieira
28	roji-menez
27	lucksza
 1	Laboratório FIAP
```

**Nota:** commits Foundation (37+) todos em `jota0802` — autor solo pós-CP2 conforme decisão documentada.

---

## Últimos 15 commits

```
1139758 ci: render.yaml + GitHub Actions (typecheck + test em PR/main)
aae7723 feat(audit): pipeline de auditoria com 4 scripts + checklist em docs/AUDITORIA.md
8523761 refactor: cleanup hash.ts + migra validation pra packages/shared + prune storage keys obsoletas
485a41c feat(mobile): dark mode direção B (neutro near-black) + elevation system dual
e6cedbb docs(handoff): salva estado pos-Phases 6+7 + issues deferidas mobile
628cd5a fix(mobile): hardenings Phase 6+7 pos code-review
0d387a3 feat(mobile): FavoritesContext vira facade sobre React Query com optimistic toggle
a00549b feat(mobile): migracao orders para API + delete data/cardapio.ts (auto-promote server-side)
7f33312 feat(mobile): migracao items + cart pra API (React Query) — strategy B full migration
0fe0ae8 feat(mobile): AuthContext consome API (/auth/*) com JWT em SecureStore
bdfa4f8 feat(mobile): React Query + AsyncStorage persister + lib/api/client
14a2233 docs(handoff): salva estado pos-Phase 5 + issues deferidas
c411637 fix(api): hardenings Phase 5 pos code-review
5c58184 feat(api): rotas /favorites (list/add/remove) idempotentes com allowlist reusado
524e111 feat(api): job auto-promote pedidos pendente->pronto via prontoEmEstimado
```

---

## Stale strings

### `data/cardapio` — aparece em docs/plans/specs (aceitável)

```
apps/api/src/db/seed.ts          ← OK: seed usa o pattern como nome de campo
apps/mobile/lib/item-emoji.ts    ← OK: comentário explicativo (arquivo mantido, não é stale de uso)
docs/AUDITORIA.md                ← docs histórico — OK
docs/HANDOFF.md                  ← docs histórico — OK
docs/superpowers/SESSION-HANDOFF.md    ← docs histórico — OK
docs/superpowers/plans/2026-05-05-foundation-plan.md  ← spec congelada — OK
docs/superpowers/specs/2026-05-05-foundation-design.md ← spec congelada — OK
scripts/audit-grep-stale.ts      ← é o próprio pattern de busca — OK
```

Nenhum arquivo de código-fonte `apps/` usa `data/cardapio` como import real. Cardápio migrado para API.

### `/Users/johnny` — só em docs históricos (aceitável)

```
docs/HANDOFF.md                          ← docs histórico — OK
docs/superpowers/plans/2026-05-05-foundation-plan.md ← spec congelada — OK
scripts/audit-grep-stale.ts              ← pattern de busca — OK
```

### `lib/hash`, `STORAGE_KEYS.*`, `SECURE_KEYS.PASSWORD_HASH` — só em docs/scripts (aceitável)

Todas as ocorrências restantes estão em:
- `docs/` — documentação histórica congelada
- `scripts/audit-grep-stale.ts` — os próprios padrões de busca (falso-positivo intencional)

Nenhuma ocorrência em `apps/` ou `packages/` source code.

**Veredicto: LIMPO. Nenhuma string stale em código-fonte.**

---

## ROADMAP x README cross-ref

O script `audit-readme-features.ts` reportou `skip` porque o ROADMAP Foundation usa formato de tabela diferente do CP2 (`| N | **Feature** |` com status inline). As features CP2 (Top 8 + tier 2) continuam documentadas no README seção histórica — cobertura manual verificada OK.

---

## Conclusão

| Check | Status |
| --- | --- |
| TypeScript strict (`pnpm -r typecheck`) | ok (verificado pre-commit) |
| Testes (`pnpm -r test`) | ok (verificado pre-commit) |
| Commits author pós-Foundation | jota0802 solo |
| Stale strings em source code | nenhuma |
| Docs atualizados (CLAUDE.md, ROADMAP, README) | ok |
| Deploy guide criado | docs/DEPLOY.md |
| Per-app READMEs criados | apps/api/README.md, apps/mobile/README.md |
| Audit report salvo | este arquivo |

Foundation: **COMPLETO**.
Próximo passo: deploy manual via `docs/DEPLOY.md`, depois merge `feat/foundation` → `main`.
