# Auditoria — Pipeline & Checklist

Pipeline de manutenção pra garantir que `CLAUDE.md`, `HANDOFF.md`, `ROADMAP.md`, memory e `README.md` continuem refletindo a realidade do código.

## Triggers

| Trigger | Tipo | Frequência esperada |
|---|---|---|
| Fim de fase do sub-projeto | Quick | ~1x/semana durante execução |
| Fim de sub-projeto | Full | 3x no projeto inteiro |
| Decisão técnica grande muda | Targeted | Ad-hoc |
| Antes de PR pra main | Smoke | A cada PR |

## Quick audit (fim de fase)

- [ ] CLAUDE.md "Comandos críticos" ainda funcionam? (rodar à mão)
- [ ] CLAUDE.md "Convenções inegociáveis" cobre regras dessa fase?
- [ ] CLAUDE.md "Pegadinhas" tem gotchas dessa fase?
- [ ] HANDOFF.md "Estrutura" mapeia repo atual? (`tree -L 2 -I node_modules`)
- [ ] HANDOFF.md "Comandos essenciais" atualizado?
- [ ] HANDOFF.md "Histórico de commits (últimos 15)" — `pnpm tsx scripts/audit-recent-commits.ts`
- [ ] HANDOFF.md "Distribuição atual" — `pnpm tsx scripts/audit-commit-stats.ts`
- [ ] Sem strings stale — `pnpm tsx scripts/audit-grep-stale.ts`

## Full audit (fim de sub-projeto)

Quick + adiciona:

- [ ] ROADMAP itens da fase marcados ✅
- [ ] ROADMAP novo backlog do que ficou pra trás
- [ ] memory/ sem entradas obsoletas (referências a código deletado)
- [ ] memory/ tem entradas novas pra padrões load-bearing dessa fase
- [ ] README.md atualizado se features visíveis pro usuário mudaram
- [ ] AUDIT report salvo em `docs/superpowers/audits/YYYY-MM-DD-<phase>.md`
- [ ] Spec do próximo sub-projeto identificado (ou trigger pra brainstorm)

## Como rodar

```powershell
pnpm audit:run            # roda os 4 scripts e produz relatório consolidado
```

Output esperado:
- Top commiters (autor único pós-CP2 — esperado: só `jota0802` em commits novos)
- Últimos 15 commits formatados (cole em HANDOFF.md)
- Strings stale encontradas (ex: `data/cardapio` em código pós-migração)
- Cruzamento ROADMAP ✅ vs README

## Quem invoca

- Você (usuário): "claude, audita fim de fase" / "audita full"
- Claude proativo: ao detectar mudança que dispara auditoria (ex: deleção de arquivos load-bearing, mudança no autor git, mudança em CLAUDE.md), abrir prompt sugerindo auditoria.
