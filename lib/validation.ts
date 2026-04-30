import type { RewardType, UserCard } from "@/types/card";

export interface ValidationError {
  field: string;
  message: string;
}

export function validateCardPayload(
  payload: Omit<UserCard, "id">,
  options: { cards: UserCard[]; excludeId?: string }
): ValidationError | null {
  const name = payload.card_name?.trim() ?? "";
  if (!name) {
    return { field: "card_name", message: "Card name is required." };
  }

  const normalized = name.toLowerCase();
  const dup = options.cards.some(
    (c) =>
      c.id !== options.excludeId &&
      c.card_name.trim().toLowerCase() === normalized
  );
  if (dup) {
    return { field: "card_name", message: "This card is already in your wallet." };
  }

  const rt = payload.reward_type as RewardType;
  if (rt !== "cashback" && rt !== "points" && rt !== "miles") {
    return { field: "reward_type", message: "Invalid reward type." };
  }

  if (!Number.isFinite(payload.annual_fee) || payload.annual_fee < 0) {
    return { field: "annual_fee", message: "Annual fee must be zero or positive." };
  }

  return null;
}
