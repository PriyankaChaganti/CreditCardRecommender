import { ComingSoon } from "@/components/ComingSoon";

export default function AlertsPage() {
  return (
    <ComingSoon
      icon="🔔"
      name="Alerts"
      tagline="Get notified the moment a better card exists for your next purchase — before you swipe."
      description="Smart, timely nudges so you never miss a reward opportunity or a payment deadline."
      bullets={[
        "Real-time merchant match alerts",
        "Payment due date reminders",
        "Bonus category activation notices",
        "New card recommendations based on your spending patterns",
      ]}
    />
  );
}
