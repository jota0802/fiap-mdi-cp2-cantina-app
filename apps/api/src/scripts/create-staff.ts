import { createId } from '@paralleldrive/cuid2';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { createDb } from '../db/client.js';
import { users, cantinas, escolas, unidades } from '../db/schema.js';
import { hashPassword } from '../lib/password.js';
import { logger } from '../lib/logger.js';
import { isProductionTarget, confirmInProd, gerarSenhaForte } from './_safety.js';

const ArgsSchema = z.object({
  cantina: z.string().min(1, '--cantina obrigatório'),
  email: z.string().trim().toLowerCase().email('--email inválido'),
  name: z.string().trim().min(2, '--name precisa ≥2 chars'),
});

type Args = z.infer<typeof ArgsSchema>;

function parseArgs(): Args {
  const args: Record<string, string> = {};
  for (const arg of process.argv.slice(2)) {
    const m = arg.match(/^--([^=]+)=(.+)$/);
    if (m) args[m[1]!] = m[2]!;
  }
  const result = ArgsSchema.safeParse(args);
  if (!result.success) {
    console.error('❌ Argumentos inválidos:');
    for (const issue of result.error.issues) {
      console.error(`   ${issue.path.join('.')}: ${issue.message}`);
    }
    console.error('\nUso: pnpm api:create-staff --cantina=<id> --email=<email> --name="<nome>"');
    process.exit(1);
  }
  return result.data;
}

async function main() {
  const args = parseArgs();
  const db = await createDb();

  // 1. Validar cantina existe e está ativa, e fetch hierarquia pro display
  const [row] = await db
    .select({
      cantinaId: cantinas.id,
      cantinaNome: cantinas.nome,
      cantinaAtivo: cantinas.ativo,
      escolaNome: escolas.nome,
      unidadeNome: unidades.nome,
    })
    .from(cantinas)
    .innerJoin(escolas, eq(cantinas.escolaId, escolas.id))
    .innerJoin(unidades, eq(escolas.unidadeId, unidades.id))
    .where(eq(cantinas.id, args.cantina))
    .limit(1);

  if (!row) {
    console.error(`❌ Cantina '${args.cantina}' não existe.`);
    process.exit(1);
  }
  if (!row.cantinaAtivo) {
    console.error(`❌ Cantina '${args.cantina}' está inativa.`);
    process.exit(1);
  }

  // 2. Validar email único
  const [existing] = await db.select().from(users).where(eq(users.email, args.email)).limit(1);
  if (existing) {
    console.error(`❌ Email '${args.email}' já cadastrado (id: ${existing.id}, role: ${existing.role}).`);
    process.exit(1);
  }

  // 3. Confirmação interativa em prod (pula se USE_PGLITE — banco local, não pode ser prod)
  const usingPglite = process.env.USE_PGLITE === 'true';
  if (!usingPglite && isProductionTarget(process.env.DATABASE_URL)) {
    const message = `\n⚠️  ATENÇÃO: você vai criar staff em PRODUÇÃO.\n` +
      `   Banco:    ${process.env.DATABASE_URL?.replace(/:[^@]+@/, ':****@')}\n` +
      `   Cantina:  ${row.cantinaNome} (${row.escolaNome}, ${row.unidadeNome})\n` +
      `   Email:    ${args.email}\n` +
      `   Nome:     ${args.name}`;
    const ok = await confirmInProd('criar staff em prod', message);
    if (!ok) {
      console.error('❌ Confirmação não recebida — abortando.');
      process.exit(1);
    }
  }

  // 4. Gerar senha + hash
  const senha = gerarSenhaForte();
  const passwordHash = await hashPassword(senha);

  // 5. Inserir
  const id = createId();
  const [staff] = await db.insert(users).values({
    id,
    name: args.name,
    email: args.email,
    passwordHash,
    role: 'staff',
    locale: 'pt',
    cantinaId: args.cantina,
  }).returning();

  if (!staff) {
    console.error('❌ Falha ao criar staff.');
    process.exit(1);
  }

  console.log('\n✅ Staff criado com sucesso!');
  console.log(`   ID:       ${staff.id}`);
  console.log(`   Email:    ${staff.email}`);
  console.log(`   Nome:     ${staff.name}`);
  console.log(`   Cantina:  ${row.cantinaNome} (${row.escolaNome}, ${row.unidadeNome})`);
  console.log(`   Role:     ${staff.role}`);
  console.log('\n🔑 Senha temporária (anote agora — não aparece de novo):');
  console.log(`   ${senha}\n`);
  console.log('⚠️  Recomendação: peça pro usuário trocar no primeiro login.');
  console.log('   (Endpoint POST /auth/reset-password vai existir na Fase D)\n');

  process.exit(0);
}

main().catch((err) => {
  logger.error({ err }, 'create-staff failed');
  process.exit(1);
});
