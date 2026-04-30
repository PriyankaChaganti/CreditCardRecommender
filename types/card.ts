export type RewardType = "cashback" | "points" | "miles";

export interface RewardRule {
  category: string;
  multiplier: number;
}

export interface UserCard {
  id: string;
  card_name: string;
  issuer: string;
  network: string;
  reward_type: RewardType;
  annual_fee: number;
  point_value: number;
  reward_rules: RewardRule[];
}

/** A card as it appears in the predefined catalog (includes routing id and image path). */
export interface CatalogCard {
  id: string;
  issuer: string;
  card_name: string;
  network: string;
  annual_fee: number;
  reward_type: RewardType;
  point_value: number;
  image: string;
  reward_rules: RewardRule[];
}
