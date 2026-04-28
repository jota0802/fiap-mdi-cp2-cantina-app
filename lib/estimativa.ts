/**
 * Calcula o tempo estimado de preparo de um pedido em segundos, baseado
 * em quantos pedidos pendentes já existem na fila.
 *
 * - Tempo base: 90s (1m30) pra qualquer pedido sozinho
 * - Cada pedido pendente já na frente adiciona ~60s ao prazo
 * - Cap em 600s (10 min) pra não estourar UX em filas longas
 */
export function calcularPrazoSegundos(pedidosPendentes: number): number {
  const TEMPO_BASE = 90;
  const TEMPO_POR_PEDIDO = 60;
  const MAX = 600;
  const total = TEMPO_BASE + Math.max(0, pedidosPendentes) * TEMPO_POR_PEDIDO;
  return Math.min(MAX, total);
}

/**
 * Formata segundos como string compacta tipo "3 min" ou "45s".
 * Útil pra mostrar prazo restante em UI.
 */
export function formatarTempoRestante(segundos: number): string {
  if (segundos <= 0) return 'pronto agora';
  if (segundos < 60) return `${Math.ceil(segundos)}s`;
  const minutos = Math.ceil(segundos / 60);
  return `${minutos} min`;
}
