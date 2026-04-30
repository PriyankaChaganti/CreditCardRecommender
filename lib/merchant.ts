import { createClient } from "@/lib/supabase/client";

/**
 * Normalize a merchant string for comparison:
 * - lowercase
 * - strip apostrophes/backticks (mcdonald's → mcdonalds)
 * - convert any remaining non-alphanumeric run to a single space
 *   (chick-fil-a → chick fil a, at&t → at t)
 * - trim
 */
function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/['''`&]/g, "")        // strip apostrophes + ampersands (h&m → hm)
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export const KNOWN_CATEGORIES = [
  "dining",
  "travel",
  "groceries",
  "online",
  "gas",
  "entertainment",
  "shopping",
  "rent",
  "other",
] as const;

type MerchantRow = { merchant_key: string; category: string };
let _map: Record<string, string> | null = null;
let _normalizedEntries: { normalizedKey: string; originalKey: string; category: string }[] = [];

export async function loadMerchantMap(): Promise<void> {
  if (_map) return;
  const supabase = createClient();
  const { data, error } = await supabase
    .from("merchant_categories")
    .select("merchant_key, category");
  if (error) throw error;
  _map = {};
  (data ?? []).forEach((row: MerchantRow) => {
    _map![row.merchant_key] = row.category;
  });
  _normalizedEntries = Object.entries(_map)
    .map(([key, category]) => ({
      normalizedKey: normalize(key),
      originalKey: key,
      category,
    }))
    // Longer keys win ties (e.g. "costco gas" beats "costco")
    .sort((a, b) => b.normalizedKey.length - a.normalizedKey.length);
}

export function setMerchantMapCache(map: Record<string, string>) {
  _map = map;
  _normalizedEntries = Object.entries(map)
    .map(([key, category]) => ({
      normalizedKey: normalize(key),
      originalKey: key,
      category,
    }))
    .sort((a, b) => b.normalizedKey.length - a.normalizedKey.length);
}

export function resolveMerchantToCategory(merchant: string): {
  category: string | null;
  matchedKey: string | null;
} {
  const q = normalize(merchant);
  if (!q) return { category: null, matchedKey: null };

  for (const { normalizedKey, originalKey, category } of _normalizedEntries) {
    // q must CONTAIN the key (not the other way around) so that "costco"
    // doesn't accidentally match the longer key "costco gas → gas".
    // Longer keys are sorted first, so "costco gas" wins over "costco"
    // when the user actually types "costco gas".
    if (q.includes(normalizedKey)) {
      return { category, matchedKey: originalKey };
    }
  }

  return { category: null, matchedKey: null };
}

export function suggestMerchants(partial: string, limit = 8): string[] {
  const q = normalize(partial);
  if (q.length < 2) return [];

  type Entry = { key: string; nk: string; cat: string };
  const starts: Entry[] = [];
  const contains: Entry[] = [];

  for (const { normalizedKey, originalKey, category } of _normalizedEntries) {
    if (normalizedKey.startsWith(q)) {
      starts.push({ key: originalKey, nk: normalizedKey, cat: category });
    } else if (normalizedKey.includes(q)) {
      contains.push({ key: originalKey, nk: normalizedKey, cat: category });
    }
  }

  starts.sort((a, b) => a.key.localeCompare(b.key));
  contains.sort((a, b) => a.key.localeCompare(b.key));

  const all = [...starts, ...contains];

  // If key A's normalized form is a strict prefix of key B's normalized form and both
  // map to the same category, drop A — B is the more descriptive label.
  const deduped = all.filter(
    ({ nk, cat }) =>
      !all.some(
        (other) => other.nk !== nk && other.nk.startsWith(nk) && other.cat === cat
      )
  );

  return deduped.slice(0, limit).map(({ key }) => key);
}
