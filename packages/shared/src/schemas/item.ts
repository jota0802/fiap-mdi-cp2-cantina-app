import { z } from 'zod';

export const CategoriaSchema = z.enum(['lanches', 'bebidas', 'sobremesas']);
export type Categoria = z.infer<typeof CategoriaSchema>;

export const ItemSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  nameKey: z.string().nullable(),
  descricao: z.string(),
  descricaoKey: z.string().nullable(),
  preco: z.string(),
  categoria: CategoriaSchema,
  tags: z.array(z.string()),
  imagem: z.string().nullable(),
  disponivel: z.boolean(),
  estoque: z.number().int().nonnegative().optional(),
});

export type Item = z.infer<typeof ItemSchema>;

export const ItemListResponseSchema = z.object({
  items: z.array(ItemSchema),
});
