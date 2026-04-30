"use client";

import { create } from "zustand";

import { createClient } from "@/lib/supabase/client";
import { loadPointValuation, savePointValuation } from "@/lib/storage";
import { validateCardPayload } from "@/lib/validation";
import { loadCatalog, setCatalogCache } from "@/lib/catalogLoader";
import { loadMerchantMap, setMerchantMapCache } from "@/lib/merchant";
import type { UserCard } from "@/types/card";

type RewardPref = "all" | "cashback" | "points";

interface CardsState {
  cards: UserCard[];
  hydrated: boolean;
  pointValuationPerPoint: number;
  rewardPref: RewardPref;
  hydrate: () => Promise<void>;
  setPointValuationPerPoint: (value: number) => void;
  setRewardPref: (pref: RewardPref) => Promise<void>;
  addCard: (payload: Omit<UserCard, "id">) => Promise<{ ok: true } | { ok: false; message: string }>;
  deleteCard: (id: string) => Promise<void>;
  replaceAllCards: (cards: UserCard[]) => Promise<void>;
  importFromJsonText: (text: string) => Promise<{ ok: true; count: number } | { ok: false; message: string }>;
}

function parseImportedCards(text: string): UserCard[] | null {
  try {
    const data = JSON.parse(text) as unknown;
    const arr = Array.isArray(data) ? data : (data as { cards?: unknown })?.cards;
    if (!Array.isArray(arr)) return null;
    return arr
      .filter((x) => x && typeof x === "object")
      .map((raw, i) => {
        const o = raw as Record<string, unknown>;
        return {
          id: typeof o.id === "string" ? o.id : `imported-${i}-${crypto.randomUUID?.() ?? i}`,
          card_name: String(o.card_name ?? ""),
          issuer: String(o.issuer ?? ""),
          network: String(o.network ?? ""),
          reward_type:
            o.reward_type === "cashback" || o.reward_type === "points" || o.reward_type === "miles"
              ? o.reward_type
              : "points",
          annual_fee: Number.isFinite(Number(o.annual_fee)) ? Number(o.annual_fee) : 0,
          point_value:
            Number.isFinite(Number(o.point_value)) && Number(o.point_value) > 0
              ? Number(o.point_value)
              : 0.01,
          reward_rules: Array.isArray(o.reward_rules)
            ? o.reward_rules.map((r) => {
                const rr = r as Record<string, unknown>;
                return {
                  category: String(rr.category ?? ""),
                  multiplier: Number(rr.multiplier) || 0,
                };
              })
            : [],
        } satisfies UserCard;
      });
  } catch {
    return null;
  }
}

function dbRowToUserCard(row: Record<string, unknown>): UserCard {
  return {
    id: row.id as string,
    card_name: row.card_name as string,
    issuer: row.issuer as string,
    network: row.network as string,
    reward_type: row.reward_type as UserCard["reward_type"],
    annual_fee: Number(row.annual_fee),
    point_value: Number(row.point_value),
    reward_rules: row.reward_rules as UserCard["reward_rules"],
  };
}

export const useCardsStore = create<CardsState>((set, get) => ({
  cards: [],
  hydrated: false,
  pointValuationPerPoint: 0.01,
  rewardPref: "all",

  hydrate: async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Load catalog and merchant map (no-ops if already cached)
    const [catalogData] = await Promise.all([
      loadCatalog(),
      loadMerchantMap(),
    ]);
    setCatalogCache(catalogData);

    if (!user) {
      // Guest: fall back to localStorage for preferences
      const pointValuationPerPoint = loadPointValuation();
      const stored =
        typeof window !== "undefined"
          ? localStorage.getItem("scr_reward_pref")
          : null;
      const rewardPref: RewardPref =
        stored === "cashback" || stored === "points" ? stored : "all";
      set({ hydrated: true, cards: [], pointValuationPerPoint, rewardPref });
      return;
    }

    // Authenticated: load user_cards
    const { data: cardsData, error: cardsError } = await supabase
      .from("user_cards")
      .select("*")
      .order("created_at");
    if (cardsError) console.error("[useCardsStore] Failed to load user_cards:", cardsError.message);
    const cards = (cardsData ?? []).map((row) =>
      dbRowToUserCard(row as Record<string, unknown>)
    );

    // Load user_preferences — upsert defaults if none exist
    const { data: prefsData } = await supabase
      .from("user_preferences")
      .select("point_valuation, reward_pref")
      .eq("user_id", user.id)
      .maybeSingle();

    let pointValuationPerPoint: number;
    let rewardPref: RewardPref;

    if (prefsData) {
      pointValuationPerPoint = Number(prefsData.point_valuation) || 0.01;
      const rp = prefsData.reward_pref;
      rewardPref = rp === "cashback" || rp === "points" ? rp : "all";
    } else {
      // No row yet — upsert defaults
      pointValuationPerPoint = loadPointValuation();
      const stored =
        typeof window !== "undefined"
          ? localStorage.getItem("scr_reward_pref")
          : null;
      rewardPref = stored === "cashback" || stored === "points" ? stored : "all";

      await supabase.from("user_preferences").upsert({
        user_id: user.id,
        point_valuation: pointValuationPerPoint,
        reward_pref: rewardPref,
        updated_at: new Date().toISOString(),
      });
    }

    set({ cards, hydrated: true, pointValuationPerPoint, rewardPref });
  },

  setPointValuationPerPoint: (value) => {
    if (!Number.isFinite(value) || value <= 0) return;
    set({ pointValuationPerPoint: value });
    // Always persist to localStorage as fallback
    savePointValuation(value);
    // Also persist to Supabase if authenticated
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase
        .from("user_preferences")
        .upsert({
          user_id: user.id,
          point_valuation: value,
          updated_at: new Date().toISOString(),
        })
        .then(() => {
          // fire-and-forget — errors are non-critical
        });
    });
  },

  setRewardPref: async (pref) => {
    set({ rewardPref: pref });
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      // Guest: fall back to localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem("scr_reward_pref", pref);
      }
      return;
    }
    await supabase.from("user_preferences").upsert({
      user_id: user.id,
      reward_pref: pref,
      updated_at: new Date().toISOString(),
    });
  },

  addCard: async (payload) => {
    const err = validateCardPayload(payload, { cards: get().cards });
    if (err) return { ok: false, message: err.message };

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, message: "Not signed in." };

    const id =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `id-${Date.now()}`;

    const { error } = await supabase.from("user_cards").insert({
      id,
      user_id: user.id,
      card_name: payload.card_name,
      issuer: payload.issuer,
      network: payload.network,
      reward_type: payload.reward_type,
      annual_fee: payload.annual_fee,
      point_value: payload.point_value,
      reward_rules: payload.reward_rules,
    });

    if (error) {
      console.error("[useCardsStore] addCard failed:", error.message);
      return { ok: false, message: error.message };
    }

    const card: UserCard = { ...payload, id };
    set({ cards: [...get().cards, card] });
    return { ok: true };
  },

  deleteCard: async (id) => {
    const supabase = createClient();
    await supabase.from("user_cards").delete().eq("id", id);
    set({ cards: get().cards.filter((c) => c.id !== id) });
  },

  replaceAllCards: async (cards) => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("user_cards").delete().eq("user_id", user.id);

    if (cards.length > 0) {
      await supabase.from("user_cards").insert(
        cards.map((c) => ({ ...c, user_id: user.id }))
      );
    }

    set({ cards });
  },

  importFromJsonText: async (text) => {
    const parsed = parseImportedCards(text);
    if (!parsed?.length) {
      return { ok: false, message: "Could not read cards from this JSON file." };
    }
    const stamped: UserCard[] = parsed.map((c) => ({
      ...c,
      id:
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `import-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    }));
    const valid: UserCard[] = [];
    for (const c of stamped) {
      const err = validateCardPayload(
        {
          card_name: c.card_name,
          issuer: c.issuer,
          network: c.network,
          reward_type: c.reward_type,
          annual_fee: c.annual_fee,
          point_value: c.point_value,
          reward_rules: c.reward_rules,
        },
        { cards: [...get().cards, ...valid] }
      );
      if (!err) valid.push(c);
    }
    if (!valid.length) {
      return { ok: false, message: "No valid cards found in the file." };
    }
    const next = [...get().cards, ...valid];
    await get().replaceAllCards(next);
    return { ok: true, count: valid.length };
  },
}));
