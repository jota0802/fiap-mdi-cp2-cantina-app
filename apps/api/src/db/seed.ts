import { createDb } from './client.js';
import { unidades, escolas, cantinas } from './schema.js';
import { logger } from '../lib/logger.js';

const SEED_UNIDADES = [
  { id: 'u_paulista', nome: 'Paulista' },
  { id: 'u_lins',     nome: 'Lins' },
] as const;

const SEED_ESCOLAS = [
  { id: 'e_paulista_main',  unidadeId: 'u_paulista', nome: 'FIAP Paulista',  tipo: 'main' },
  { id: 'e_lins_school',    unidadeId: 'u_lins',     nome: 'FIAP School',    tipo: 'school' },
  { id: 'e_lins_faculdade', unidadeId: 'u_lins',     nome: 'FIAP Faculdade', tipo: 'faculdade' },
] as const;

const SEED_CANTINAS = [
  { id: 'c_pa_5',       escolaId: 'e_paulista_main',  nome: '5º andar', andar: '5' },
  { id: 'c_pa_7',       escolaId: 'e_paulista_main',  nome: '7º andar', andar: '7' },
  { id: 'c_lins_sc_1',  escolaId: 'e_lins_school',    nome: 'Térreo',   andar: 'T' },
  { id: 'c_lins_sc_2',  escolaId: 'e_lins_school',    nome: '2º andar', andar: '2' },
  { id: 'c_lins_fac_1', escolaId: 'e_lins_faculdade', nome: 'Térreo',   andar: 'T' },
  { id: 'c_lins_fac_2', escolaId: 'e_lins_faculdade', nome: '3º andar', andar: '3' },
] as const;

async function main() {
  const db = await createDb();
  logger.info('Seeding hierarquia institucional...');

  await db.insert(unidades).values([...SEED_UNIDADES]).onConflictDoNothing({ target: unidades.id });
  logger.info(`  ↳ ${SEED_UNIDADES.length} unidades`);

  await db.insert(escolas).values([...SEED_ESCOLAS]).onConflictDoNothing({ target: escolas.id });
  logger.info(`  ↳ ${SEED_ESCOLAS.length} escolas`);

  await db.insert(cantinas).values([...SEED_CANTINAS]).onConflictDoNothing({ target: cantinas.id });
  logger.info(`  ↳ ${SEED_CANTINAS.length} cantinas`);

  logger.info('Seed completo ✅');
  process.exit(0);
}

main().catch((err) => {
  logger.error({ err }, 'Seed failed');
  process.exit(1);
});
