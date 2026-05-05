import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const roadmapPath = join(root, 'docs/ROADMAP.md');
const readmePath = join(root, 'README.md');

console.log('## 📚 ROADMAP ✅ vs README\n');

if (!existsSync(roadmapPath)) {
  console.log('⚠️  `docs/ROADMAP.md` não encontrado — skip.\n');
  process.exit(0);
}
if (!existsSync(readmePath)) {
  console.log('⚠️  `README.md` não encontrado — skip.\n');
  process.exit(0);
}

const roadmap = readFileSync(roadmapPath, 'utf8');
const readme = readFileSync(readmePath, 'utf8');

const checks = roadmap.match(/^\| \d+ \| \*\*([^*]+)\*\* \|/gm) ?? [];
const completed = checks.filter((line) => line.includes('✅'));
const completedNames = completed
  .map((l) => l.match(/\*\*([^*]+)\*\*/)?.[1] ?? '')
  .filter(Boolean);

if (completedNames.length === 0) {
  console.log('⚠️  Não encontrei entradas no formato `| N | **Feature** | … | ✅` no ROADMAP — skip.\n');
  process.exit(0);
}

const missingInReadme = completedNames.filter(
  (name) => !readme.toLowerCase().includes(name.toLowerCase()),
);

if (missingInReadme.length) {
  console.log('Concluído no ROADMAP mas não mencionado no README:');
  missingInReadme.forEach((n) => console.log(`- ${n}`));
  console.log();
} else {
  console.log('✅ README cobre todas as features ✅ do ROADMAP.\n');
}
