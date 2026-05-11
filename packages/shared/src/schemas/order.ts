import { z } from 'zod';

export const OrderStatusSchema = z.enum(['pedido', 'pronto', 'cancelado']);
export type OrderStatus = z.infer<typeof OrderStatusSchema>;

export const OrderItemSchema = z.object({
  id: z.string(),
  itemId: z.string(),
  nameSnapshot: z.string(),
  precoSnapshot: z.string(),
  quantidade: z.number().int().positive(),
  observacoes: z.string().nullable(),
});

export const OrderSchema = z.object({
  id: z.string(),
  userId: z.string(),
  status: OrderStatusSchema,
  total: z.string(),
  senha: z.number().int(),
  prontoEmEstimado: z.string().nullable(),
  prontoEm: z.string().nullable(),
  retiradoEm: z.string().nullable(),
  canceladoEm: z.string().nullable(),
  canceledBy: z.enum(['customer', 'staff']).nullable(),
  cancelReason: z.string().nullable(),
  criadoEm: z.string(),
  itens: z.array(OrderItemSchema),
});

export const CreateOrderSchema = z.object({
  itens: z.array(z.object({
    itemId: z.string().min(1),
    quantidade: z.number().int().positive().max(99),
    observacoes: z.string().max(200).optional(),
  })).min(1, 'order.create.empty_cart'),
});

// Legacy: customer cancel via PATCH (kept for backwards compat during migration).
// New flow uses POST /orders/:id/cancel.
export const UpdateOrderStatusSchema = z.object({
  status: z.literal('cancelado'),
});

// Staff: marca pronto, cancela com motivo, ou faz rollback pronto→pedido
export const UpdateOrderStatusByStaffSchema = z.object({
  status: OrderStatusSchema,
  reason: z.string().max(200).optional(),
});

// Staff: bulk markPronto — só marca como pronto em massa
export const BulkUpdateStatusSchema = z.object({
  ids: z.array(z.string().min(1)).min(1).max(50),
  status: z.literal('pronto'),
});

// Customer: cancel (body vazio; transição implícita pedido→cancelado)
export const CancelOrderSchema = z.object({}).strict();

export type Order = z.infer<typeof OrderSchema>;
export type OrderItemDto = z.infer<typeof OrderItemSchema>;
export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;
export type UpdateOrderStatusByStaffInput = z.infer<typeof UpdateOrderStatusByStaffSchema>;
export type BulkUpdateStatusInput = z.infer<typeof BulkUpdateStatusSchema>;
