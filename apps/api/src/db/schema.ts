import { pgTable, text, integer, numeric, boolean, timestamp, primaryKey, uniqueIndex, index } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  passwordHash: text('password_hash').notNull(),
  avatarUrl: text('avatar_url'),
  locale: text('locale').notNull().default('pt'),
  role: text('role').notNull().default('customer'),
  tenantId: text('tenant_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  emailUnique: uniqueIndex('users_email_unique').on(t.email),
  tenantIdx: index('users_tenant_idx').on(t.tenantId),
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
  tenantId: text('tenant_id'),
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
  tenantId: text('tenant_id'),
  criadoEm: timestamp('criado_em', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  userIdx: index('orders_user_idx').on(t.userId),
  statusIdx: index('orders_status_idx').on(t.status),
  tenantDayIdx: index('orders_tenant_day_idx').on(t.tenantId, t.criadoEm),
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
  tenantId: text('tenant_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  pk: primaryKey({ columns: [t.userId, t.itemId] }),
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
