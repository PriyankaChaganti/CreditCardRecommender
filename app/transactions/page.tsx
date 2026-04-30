import { ComingSoon } from "@/components/ComingSoon";

export default function TransactionsPage() {
  return (
    <ComingSoon
      icon="💸"
      name="Transactions"
      tagline="Track every purchase and see which card earned the most rewards for each one."
      description="Log your spending once and we'll automatically suggest the best card for each type of transaction."
      bullets={[
        "Import or manually log transactions",
        "Per-transaction reward calculation",
        "Historical view of your earning performance",
        "See which card you should have used — and by how much",
      ]}
    />
  );
}
