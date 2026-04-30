import { createClient } from "@/lib/supabase/client";
import type { CatalogCard, UserCard } from "@/types/card";

/** Shape passed to addCard — everything a UserCard needs except the store-assigned id. */
export type CatalogEntry = Omit<UserCard, "id">;

let _cache: CatalogCard[] | null = null;

export async function loadCatalog(): Promise<CatalogCard[]> {
  if (_cache) return _cache;
  const supabase = createClient();
  const { data, error } = await supabase
    .from("cards_catalog")
    .select("*")
    .order("issuer");
  if (error) throw error;
  _cache = (data ?? []) as CatalogCard[];
  return _cache;
}

/** Sync accessor — returns cache (empty array until loadCatalog() resolves). */
export function getCatalog(): CatalogCard[] {
  return _cache ?? [];
}

export function setCatalogCache(data: CatalogCard[]) {
  _cache = data;
}

export function findCardById(id: string): CatalogCard | null {
  return (_cache ?? []).find((c) => c.id === id) ?? null;
}

export function findCardByName(name: string): CatalogCard | null {
  return (_cache ?? []).find((c) => c.card_name === name) ?? null;
}

export function getIssuers(): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const card of (_cache ?? [])) {
    if (!seen.has(card.issuer)) {
      seen.add(card.issuer);
      result.push(card.issuer);
    }
  }
  return result.sort();
}

export function getCardsByIssuer(issuer: string): CatalogCard[] {
  return (_cache ?? []).filter((c) => c.issuer === issuer);
}
