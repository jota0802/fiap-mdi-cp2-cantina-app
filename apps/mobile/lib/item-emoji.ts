/**
 * Mapa de emoji por slug de item.
 *
 * A API nao serializa emoji (e UI concern), entao mantemos aqui ate
 * decidir entre persistir no DB ou migrar tudo pra imagens.
 * Mapeado de apps/mobile/data/cardapio.ts (12 itens do seed inicial).
 */
export const EMOJI_BY_SLUG: Record<string, string> = {
  'cafe-espresso': '☕',
  'cappuccino': '☕',
  'suco-natural': '🧃',
  'pao-de-queijo': '🧀',
  'coxinha': '🍗',
  'x-burger': '🍔',
  'misto-quente': '🥪',
  'acai-bowl': '🍇',
  'brigadeiro-gourmet': '🍫',
  'salada-caesar': '🥗',
  'refrigerante-lata': '🥤',
  'croissant': '🥐',
};

/** Retorna o emoji associado ao slug, ou '🍴' como fallback generico. */
export function emojiForSlug(slug: string): string {
  return EMOJI_BY_SLUG[slug] ?? '🍴';
}
