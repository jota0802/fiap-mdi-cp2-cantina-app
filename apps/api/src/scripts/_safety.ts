import { randomInt } from 'node:crypto';
import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

/**
 * Detecta se DATABASE_URL aponta pra ambiente de produção.
 * Heurística: presença de '.neon.tech', '.aws.', ou NODE_ENV=production.
 */
export function isProductionTarget(databaseUrl: string | undefined): boolean {
  if (process.env.NODE_ENV === 'production') return true;
  if (!databaseUrl) return false;
  return databaseUrl.includes('.neon.tech') || databaseUrl.includes('.aws.');
}

/**
 * Bloqueia execução até user digitar a frase exata. Retorna true se confirmou.
 * Em ambientes não-interativos (stdin não-TTY), retorna false sem prompt.
 */
export async function confirmInProd(phrase: string, message: string): Promise<boolean> {
  if (!input.isTTY) {
    console.error('❌ Sem TTY — confirmação interativa requerida pra prod. Aborte.');
    return false;
  }
  console.log(message);
  console.log(`\nPra continuar, digite a frase exata: ${phrase}\n`);
  const rl = createInterface({ input, output });
  try {
    const answer = await rl.question('> ');
    return answer.trim() === phrase;
  } finally {
    rl.close();
  }
}

/**
 * Gera senha forte de 16 caracteres. Exclui caracteres confusos (0/O/o/1/l/I)
 * pra reduzir erro ao copiar do terminal.
 */
export function gerarSenhaForte(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%&*';
  return Array.from({ length: 16 }, () => chars.charAt(randomInt(chars.length))).join('');
}
