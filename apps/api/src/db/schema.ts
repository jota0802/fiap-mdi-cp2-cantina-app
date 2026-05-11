import { pgTable, text, integer, numeric, boolean, timestamp, primaryKey, uniqueIndex, index, check } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const unidades = pgTable('unidades', {
  id: text('id').primaryKey(),
  nome: text('nome').notNull(),
  endereco: text('endereco'),
  ativo: boolean('ativo').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const escolas = pgTable('escolas', {
  id: text('id').primaryKey(),
  unidadeId: text('unidade_id').notNull().references(() => unidades.id, { onDelete: 'restrict' }),
  nome: text('nome').notNull(),
  tipo: text('tipo'),
  ativo: boolean('ativo').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  unidadeNomeUnique: uniqueIndex('escolas_unidade_nome_unique').on(t.unidadeId, t.nome),
  unidadeIdx: index('escolas_unidade_idx').on(t.unidadeId),
}));

export const cantinas = pgTable('cantinas', {
  id: text('id').primaryKey(),
  escolaId: text('escola_id').notNull().references(() => escolas.id, { onDelete: 'restrict' }),
  nome: text('nome').notNull(),
  andar: text('andar'),
  ativo: boolean('ativo').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  escolaNomeUnique: uniqueIndex('cantinas_escola_nome_unique').on(t.escolaId, t.nome),
  escolaIdx: index('cantinas_escola_idx').on(t.escolaId),
}));

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  name: text('name'),
  rm: text('rm'),
  email: text('email').notNull(),
  passwordHash: text('password_hash').notNull(),
  avatarUrl: text('avatar_url'),
  locale: text('locale').notNull().default('pt'),
  role: text('role').notNull().default('customer'),
  cantinaId: text('cantina_id').references(() => cantinas.id, { onDelete: 'restrict' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  emailUnique: uniqueIndex('users_email_unique').on(t.email),
  cantinaIdx: index('users_cantina_idx').on(t.cantinaId),
  staffMustHaveCantina: check(
    'users_staff_must_have_cantina',
    sql`role != 'staff' OR cantina_id IS NOT NULL`,
  ),
  staffMustHaveName: check(
    'users_staff_must_have_name',
    sql`role != 'staff' OR name IS NOT NULL`,
  ),
  rmFormato: check(
    'users_rm_formato',
    sql`rm IS NULL OR rm ~ '^[0-9]{6}$'`,
  ),
}));

export const items = pgTable('items', {
  id: text('id').primaryKey(),
  slug: text('slug').notNull(),
  name: text('name').notNull(),
  nameKey: text('name_key'),
  descricao: text('descricao').notNull(),
  descricaoKey: text('descricao_key'),
  preco: numeric('preco', { precision: 10, scale: 2 }).notNull(),
  categoria: text('categoria').notNull(),
  tags: text('tags').array().notNull().default(sql`ARRAY[]::text[]`),
  imagem: text('imagem'),
  disponivel: boolean('disponivel').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  slugUnique: uniqueIndex('items_slug_unique').on(t.slug),
  catIdx: index('items_categoria_idx').on(t.categoria),
}));

export const orders = pgTable('orders', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  status: text('status').notNull(),
  total: numeric('total', { precision: 10, scale: 2 }).notNull(),
  senha: integer('senha').notNull(),
  prontoEmEstimado: timestamp('pronto_em_estimado', { withTimezone: true }),
  prontoEm: timestamp('pronto_em', { withTimezone: true }),
  retiradoEm: timestamp('retirado_em', { withTimezone: true }),
  canceladoEm: timestamp('cancelado_em', { withTimezone: true }),
  canceledBy: text('canceled_by'),
  cancelReason: text('cancel_reason'),
  cantinaId: text('cantina_id').notNull().references(() => cantinas.id, { onDelete: 'restrict' }),
  criadoEm: timestamp('criado_em', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  userIdx: index('orders_user_idx').on(t.userId),
  statusIdx: index('orders_status_idx').on(t.status),
  cantinaDayIdx: index('orders_cantina_day_idx').on(t.cantinaId, t.criadoEm),
  canceledByCheck: check(
    'orders_canceled_by_check',
    sql`canceled_by IS NULL OR canceled_by IN ('customer','staff')`,
  ),
  cancelConsistency: check(
    'orders_cancel_consistency',
    sql`(status = 'cancelado' AND cancelado_em IS NOT NULL AND canceled_by IS NOT NULL)
       OR (status != 'cancelado' AND canceled_by IS NULL)`,
  ),
  statusValidos: check(
    'orders_status_validos',
    sql`status IN ('pedido','pronto','cancelado')`,
  ),
}));

export const orderItems = pgTable('order_items', {
  id: text('id').primaryKey(),
  orderId: text('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  itemId: text('item_id').notNull().references(() => items.id),
  nameSnapshot: text('name_snapshot').notNull(),
  precoSnapshot: numeric('preco_snapshot', { precision: 10, scale: 2 }).notNull(),
  quantidade: integer('quantidade').notNull(),
  observacoes: text('observacoes'),
}, (t) => ({
  orderIdx: index('order_items_order_idx').on(t.orderId),
}));

export const favorites = pgTable('favorites', {
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  itemId: text('item_id').notNull().references(() => items.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  pk: primaryKey({ columns: [t.userId, t.itemId] }),
}));

export const cantinaItems = pgTable('cantina_items', {
  cantinaId: text('cantina_id').notNull().references(() => cantinas.id, { onDelete: 'restrict' }),
  itemId: text('item_id').notNull().references(() => items.id, { onDelete: 'cascade' }),
  preco: numeric('preco', { precision: 10, scale: 2 }).notNull(),
  estoque: integer('estoque').notNull().default(0),
  disponivel: boolean('disponivel').notNull().default(true),
  visivel: boolean('visivel').notNull().default(true),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  pk: primaryKey({ columns: [t.cantinaId, t.itemId] }),
  cantinaIdx: index('cantina_items_cantina_idx').on(t.cantinaId),
  estoquePositivo: check('cantina_items_estoque_positivo', sql`estoque >= 0`),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Item = typeof items.$inferSelect;
export type NewItem = typeof items.$inferInsert;
export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
export type OrderItem = typeof orderItems.$inferSelect;
export type NewOrderItem = typeof orderItems.$inferInsert;
export type Favorite = typeof favorites.$inferSelect;
export type Unidade = typeof unidades.$inferSelect;
export type NewUnidade = typeof unidades.$inferInsert;
export type Escola = typeof escolas.$inferSelect;
export type NewEscola = typeof escolas.$inferInsert;
export type Cantina = typeof cantinas.$inferSelect;
export type NewCantina = typeof cantinas.$inferInsert;
export type CantinaItem = typeof cantinaItems.$inferSelect;
export type NewCantinaItem = typeof cantinaItems.$inferInsert;
