import { execSync } from 'node:child_process';

const STALE_PATTERNS: { pattern: string; context: string }[] = [
  { pattern: 'data/cardapio', context: 'apps/mobile (deveria consumir API agora)' },
  { pattern: '/Users/johnny', context: 'CLAUDE.md/docs (deveria ser Windows path)' },
  { pattern: 'lib/hash', context: '(deletado em Foundation)' },
  { pattern: 'STORAGE_KEYS.USERS', context: '(removido em Phase 9 — replaced pela API)' },
  { pattern: 'STORAGE_KEYS.SESSION', context: '(removido em Phase 9 — replaced por JWT)' },
  { pattern: 'STORAGE_KEYS.ORDERS', context: '(removido em Phase 9 — replaced pela API)' },
  { pattern: 'STORAGE_KEYS.FAVORITES', context: '(removido em Phase 9 — replaced pela API)' },
  { pattern: 'SECURE_KEYS.PASSWORD_HASH', context: '(removido em Phase 9 — replaced pelo backend)' },
];

console.log('## 🔍 Stale strings\n');
let foundAny = false;
for (const { pattern, context } of STALE_PATTERNS) {
  try {
    const out = execSync(`git grep -l "${pattern}"`, { encoding: 'utf8' }).trim();
    if (out) {
      foundAny = true;
      console.log(`### \`${pattern}\` ${context}\n`);
      console.log('```');
      console.log(out);
      console.log('```\n');
    }
  } catch {
    // git grep exits non-zero quando não acha — silenciar
  }
}
if (!foundAny) console.log('✅ Nenhuma string stale encontrada.\n');
