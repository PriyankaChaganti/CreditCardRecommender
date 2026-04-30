import type { CatalogCard } from "@/types/card";

/**
 * Search catalog cards by issuer or card name.
 *
 * Ranking:
 *   1. Exact match on issuer or card_name (case-insensitive)
 *   2. Partial match on issuer or card_name
 *
 * Returns the full catalog when query is empty.
 */
export function searchCards(query: string, cards: CatalogCard[]): CatalogCard[] {
  const q = query.trim().toLowerCase();
  if (!q) return cards;

  const exact: CatalogCard[] = [];
  const partial: CatalogCard[] = [];

  for (const card of cards) {
    const name = card.card_name.toLowerCase();
    const issuer = card.issuer.toLowerCase();

    if (name === q || issuer === q) {
      exact.push(card);
    } else if (name.includes(q) || issuer.includes(q)) {
      partial.push(card);
    }
  }

  return [...exact, ...partial];
}
