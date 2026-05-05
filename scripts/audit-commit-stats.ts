import { execSync } from 'node:child_process';

const out = execSync('git shortlog -sn --no-merges HEAD', { encoding: 'utf8' });
console.log('## 📊 Distribuição de commits (shortlog)\n');
console.log('```');
console.log(out.trim());
console.log('```\n');
