import { z } from 'zod';

export const OrderStatusSchema = z.enum(['pendente', 'pronto', 'retirado', 'cancelado']);
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

export const UpdateOrderStatusSchema = z.object({
  status: z.literal('cancelado'),
});

export type Order = z.infer<typeof OrderSchema>;
export type OrderItemDto = z.infer<typeof OrderItemSchema>;
export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;
