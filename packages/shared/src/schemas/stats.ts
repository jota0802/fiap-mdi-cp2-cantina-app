import { z } from 'zod';

export const StatsPeriodSchema = z.enum(['daily', 'weekly', 'monthly']);
export type StatsPeriod = z.infer<typeof StatsPeriodSchema>;

export const StatsTopItemSchema = z.object({
  itemId: z.string(),
  nome: z.string(),
  qtd: z.number().int().nonnegative(),
  faturamento: z.string(),
});

export const StatsResponseSchema = z.object({
  period: StatsPeriodSchema,
  atendidos: z.number().int().nonnegative(),
  cancelados: z.number().int().nonnegative(),
  faturamento: z.string(),
  ticketMedio: z.string(),
  tempoMedioPreparoSec: z.number().nonnegative().nullable(),
  pedidosPorHora: z.array(z.number().int().nonnegative()).length(11),
  topItems: z.array(StatsTopItemSchema).max(5),
  comparacao: z.object({
    atendidosDeltaPct: z.number().nullable(),
    faturamentoDeltaPct: z.number().nullable(),
  }),
});

export type StatsResponse = z.infer<typeof StatsResponseSchema>;
export type StatsTopItem = z.infer<typeof StatsTopItemSchema>;
