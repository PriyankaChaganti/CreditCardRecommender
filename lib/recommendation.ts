import type { RewardRule, RewardType, UserCard } from "@/types/card";

export interface RecommendationCandidate {
  card: UserCard;
  rule: RewardRule;
  reward_value: number;          // dollar-equivalent used for ranking
  raw_reward: number;            // cashback $ OR points/miles count
  raw_unit: "cashback" | "points" | "miles";
  matchedCategory: string;
  matchKind: "primary" | "fallback_other" | "fallback_best_any";
  usedFallback: boolean;
}

export interface RecommendationResult {
  best_cards: UserCard[];
  reward_value: number;
  explanation: string;
  candidates: RecommendationCandidate[];
  resolvedCategory: string | null;
  merchantMatchKey: string | null;
  usedFallbackPointValue: boolean;
  top_raw_reward: number;
  top_raw_unit: "cashback" | "points" | "miles" | null;
}

function dollarEquivalent(
  spend: number,
  rule: RewardRule,
  rewardType: RewardType,
  cardPointValue: number,
  fallbackDollarsPerPoint: number
): number {
  if (rewardType === "cashback") {
    return spend * (rule.multiplier / 100);
  }
  const pointsEarned = spend * rule.multiplier;
  const rate = cardPointValue > 0 ? cardPointValue : fallbackDollarsPerPoint;
  return pointsEarned * rate;
}


function pickRuleForCategory(
  card: UserCard,
  category: string
): { rule: RewardRule; kind: RecommendationCandidate["matchKind"] } | null {
  const cat = category.trim().toLowerCase();
  const rules = card.reward_rules ?? [];
  const direct = rules.filter((r) => r.category.trim().toLowerCase() === cat);
  if (direct.length) {
    const best = direct.reduce((a, b) => (a.multiplier >= b.multiplier ? a : b));
    return { rule: best, kind: "primary" };
  }
  const other = rules.filter((r) => {
    const c = r.category.trim().toLowerCase();
    return c === "other" || c === "general" || c === "everything";
  });
  if (other.length) {
    const best = other.reduce((a, b) => (a.multiplier >= b.multiplier ? a : b));
    return { rule: best, kind: "fallback_other" };
  }
  const any = rules.reduce<RewardRule | null>((best, r) => {
    if (!best || r.multiplier > best.multiplier) return r;
    return best;
  }, null);
  if (any) return { rule: any, kind: "fallback_best_any" };
  return null;
}

const EMPTY: Pick<RecommendationResult, "top_raw_reward" | "top_raw_unit"> = {
  top_raw_reward: 0,
  top_raw_unit: null,
};

export function recommendBestCards(
  cards: UserCard[],
  category: string | null,
  spend: number,
  dollarsPerPoint: number,
  merchantMatchKey: string | null
): RecommendationResult {
  if (!cards.length) {
    return {
      best_cards: [],
      reward_value: 0,
      explanation: "Add at least one card to get a recommendation.",
      candidates: [],
      resolvedCategory: category,
      merchantMatchKey,
      usedFallbackPointValue: false,
      ...EMPTY,
    };
  }

  if (!category || !category.trim()) {
    return {
      best_cards: [],
      reward_value: 0,
      explanation: "Enter a merchant or choose a category to compare cards.",
      candidates: [],
      resolvedCategory: null,
      merchantMatchKey,
      usedFallbackPointValue: false,
      ...EMPTY,
    };
  }

  const cat = category.trim();
  const candidates: RecommendationCandidate[] = [];

  for (const card of cards) {
    const picked = pickRuleForCategory(card, cat);
    if (!picked) continue;
    const usedFallback = card.reward_type !== "cashback" && !(card.point_value > 0);
    const reward_value = dollarEquivalent(
      spend,
      picked.rule,
      card.reward_type,
      card.point_value,
      dollarsPerPoint
    );
    // raw_unit mirrors reward_type — the types are identical
    const raw_unit: RecommendationCandidate["raw_unit"] = card.reward_type;
    // raw_reward: cashback cards → dollars earned; points/miles cards → unit count earned
    const raw_reward =
      card.reward_type === "cashback"
        ? spend * (picked.rule.multiplier / 100)
        : spend * picked.rule.multiplier;
    candidates.push({
      card,
      rule: picked.rule,
      reward_value,
      raw_reward,
      raw_unit,
      matchedCategory: picked.rule.category,
      matchKind: picked.kind,
      usedFallback,
    });
  }

  if (!candidates.length) {
    return {
      best_cards: [],
      reward_value: 0,
      explanation: `No cards have reward rules for "${cat}".`,
      candidates: [],
      resolvedCategory: cat,
      merchantMatchKey,
      usedFallbackPointValue: false,
      ...EMPTY,
    };
  }

  const maxVal = Math.max(...candidates.map((c) => c.reward_value));
  const winners = candidates.filter((c) => c.reward_value === maxVal);
  const best_cards = winners.map((w) => w.card);

  // Derive top-level raw reward — consistent only when all winners share the same unit
  const winnerUnits = [...new Set(winners.map((w) => w.raw_unit))];
  const top_raw_unit = winnerUnits.length === 1 ? winnerUnits[0] : null;
  const top_raw_reward = top_raw_unit ? winners[0].raw_reward : 0;

  const kindLabel = (k: RecommendationCandidate["matchKind"]) => {
    if (k === "primary") return "matched category";
    if (k === "fallback_other") return 'fallback "other/general" rule';
    return "fallback best available rule on the card";
  };

  const top = winners[0];
  const rewardSummary =
    top_raw_unit === "cashback"
      ? formatMoney(top_raw_reward)
      : top_raw_unit
        ? `${formatCount(top_raw_reward)} ${top_raw_unit} (~${formatMoney(maxVal)} est.)`
        : formatMoney(maxVal);

  const explanationParts = [
    `Category "${cat}"${merchantMatchKey ? ` (merchant keyword "${merchantMatchKey}")` : ""}.`,
    best_cards.length > 1
      ? `Tie: ${best_cards.length} cards earn ${rewardSummary} on $${spend.toFixed(2)} spend.`
      : `Best pick: ${top.card.card_name} using ${kindLabel(top.matchKind)} "${top.rule.category}".`,
    `Reward: ${rewardSummary} (before annual fee).`,
  ];

  return {
    best_cards,
    reward_value: maxVal,
    explanation: explanationParts.join(" "),
    candidates: candidates.sort((a, b) => b.reward_value - a.reward_value),
    resolvedCategory: cat,
    merchantMatchKey,
    usedFallbackPointValue: candidates.some((c) => c.usedFallback),
    top_raw_reward,
    top_raw_unit,
  };
}

function formatMoney(n: number): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(n);
}

function formatCount(n: number): string {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(n);
}
