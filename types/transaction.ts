export interface Transaction {
  id: string;
  user_id: string;
  merchant: string;
  amount: number;           // positive = purchase, negative = refund
  date: string;             // "YYYY-MM-DD"
  category: string;
  card_id: string | null;   // null = cash / no card
  card_name: string | null; // denormalized snapshot at insert time
  mcc_code: string | null;
  notes: string | null;
  created_at: string;
}

export interface RewardDetail {
  dollarValue: number;
  rawReward: number;
  unit: "cashback" | "points" | "miles";
  multiplier: number;
  cardName: string;
}

export interface TransactionWithRewards extends Transaction {
  actualReward: RewardDetail | null;  // null when no card or refund
  bestReward: RewardDetail | null;    // null when no wallet cards
  missedDollars: number;              // 0 if optimal or no card
  isOptimal: boolean;
}

export type TransactionFormValues = {
  merchant: string;
  amount: number;
  date: string;
  category: string;
  card_id: string | null;
  card_name: string | null;
  mcc_code: string | null;
  notes: string | null;
};
