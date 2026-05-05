import { execSync } from 'node:child_process';

const out = execSync('git log -15 --pretty=format:"%h %s" --no-color', { encoding: 'utf8' });
console.log('## 📜 Últimos 15 commits\n');
console.log('```');
console.log(out);
console.log('```\n');
