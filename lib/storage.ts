import type { UserCard } from "@/types/card";

export const USER_CARDS_KEY = "user_cards";
export const POINT_VALUATION_KEY = "scr_point_valuation";

const DEFAULT_POINT_VALUATION = 0.01;

export function loadUserCards(): UserCard[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(USER_CARDS_KEY);
    if (!raw || raw.trim() === "") return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      localStorage.removeItem(USER_CARDS_KEY);
      return [];
    }
    const cards = parsed.filter(isCatalogCard) as UserCard[];
    // If entries existed but none passed the catalog-format check,
    // the stored data is the old manual-entry format — clear it silently.
    if (parsed.length > 0 && cards.length === 0) {
      localStorage.removeItem(USER_CARDS_KEY);
    }
    return cards;
  } catch {
    try {
      localStorage.removeItem(USER_CARDS_KEY);
    } catch {
      /* ignore */
    }
    return [];
  }
}

export function saveUserCards(cards: UserCard[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(USER_CARDS_KEY, JSON.stringify(cards));
}

export const MIN_POINT_VALUATION = 0.0001;
export const MAX_POINT_VALUATION = 0.05;

export function loadPointValuation(): number {
  if (typeof window === "undefined") return DEFAULT_POINT_VALUATION;
  try {
    const raw = localStorage.getItem(POINT_VALUATION_KEY);
    if (raw == null || raw === "") return DEFAULT_POINT_VALUATION;
    const n = Number.parseFloat(raw);
    // Reset corrupted or out-of-range values to the default
    if (!Number.isFinite(n) || n <= 0 || n > MAX_POINT_VALUATION) {
      localStorage.removeItem(POINT_VALUATION_KEY);
      return DEFAULT_POINT_VALUATION;
    }
    return n;
  } catch {
    return DEFAULT_POINT_VALUATION;
  }
}

export function savePointValuation(value: number): void {
  if (typeof window === "undefined") return;
  if (!Number.isFinite(value) || value <= 0 || value > MAX_POINT_VALUATION) {
    localStorage.removeItem(POINT_VALUATION_KEY);
    return;
  }
  localStorage.setItem(POINT_VALUATION_KEY, String(value));
}

/** Accepts only catalog-format cards (must have point_value from the new schema). */
function isCatalogCard(x: unknown): boolean {
  if (typeof x !== "object" || x === null) return false;
  const o = x as Record<string, unknown>;
  return (
    typeof o.card_name === "string" &&
    typeof o.issuer === "string" &&
    typeof o.point_value === "number" &&
    Array.isArray(o.reward_rules) &&
    typeof o.reward_type === "string"
  );
}
