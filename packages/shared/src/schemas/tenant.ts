import { z } from 'zod';

export const CantinaPublicSchema = z.object({
  id: z.string(),
  nome: z.string(),
  andar: z.string().nullable(),
});

export const EscolaPublicSchema = z.object({
  id: z.string(),
  nome: z.string(),
  tipo: z.string().nullable(),
  cantinas: z.array(CantinaPublicSchema),
});

export const UnidadePublicSchema = z.object({
  id: z.string(),
  nome: z.string(),
  escolas: z.array(EscolaPublicSchema),
});

export const TenantTreeSchema = z.object({
  unidades: z.array(UnidadePublicSchema),
});

export type CantinaPublic = z.infer<typeof CantinaPublicSchema>;
export type EscolaPublic = z.infer<typeof EscolaPublicSchema>;
export type UnidadePublic = z.infer<typeof UnidadePublicSchema>;
export type TenantTree = z.infer<typeof TenantTreeSchema>;
