import { randomInt } from 'node:crypto';
import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

/**
 * Detecta se a operação atual vai tocar produção.
 * Heurística: NODE_ENV=production, ou URL contendo '.neon.tech' / '.aws.'.
 * Curto-circuito quando USE_PGLITE=true: nesse modo createDb() ignora
 * DATABASE_URL e escreve em pglite local — mesmo que a URL pareça prod, o
 * write fisicamente não chega lá.
 */
export function isProductionTarget(databaseUrl: string | undefined): boolean {
  if (process.env.USE_PGLITE === 'true') return false;
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
