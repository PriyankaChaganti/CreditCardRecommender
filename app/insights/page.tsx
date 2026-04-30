import { ComingSoon } from "@/components/ComingSoon";

export default function InsightsPage() {
  return (
    <ComingSoon
      icon="📊"
      name="Insights"
      tagline="Understand your spending and see exactly where you're leaving rewards behind."
      description="We're building a beautiful analytics dashboard to help you spend smarter every month."
      bullets={[
        "Monthly spending breakdown by category",
        "Missed rewards — see what you could have earned",
        "Card performance scores for your wallet",
        "Smart suggestions to maximize your existing cards",
      ]}
    />
  );
}
