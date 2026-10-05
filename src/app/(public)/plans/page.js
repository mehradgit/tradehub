// src/app/(public)/plans/page.js
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import PlanPurchase from "@/components/plans/PlanPurchase";

export const metadata = { title: "Membership Plans | B2B Food Hub" };

// ✅ Display order, from left to right
const PLAN_ORDER = ["Basic", "Bronze", "Silver", "Gold"];

export default async function PlansPage() {
  // Get the active durations from settings (with safe parsing)
  const setting = await prisma.setting.findUnique({
    where: { key: "subscriptionDurations" },
  });

  let durations = [180, 360];
  if (setting?.value) {
    if (Array.isArray(setting.value)) {
      durations = setting.value;
    } else if (typeof setting.value === "string") {
      try {
        durations = JSON.parse(setting.value);
      } catch {
        durations = [180, 360];
      }
    }
  }

  // ✅ No orderBy from the database; we sort them ourselves afterwards
  const plans = await prisma.plan.findMany({
    where: { isActive: true },
    include: { prices: true },
  });

  // Serialize + sort according to the desired order
  const serializedPlans = plans
    .map((plan) => ({
      ...plan,
      prices: plan.prices
        .filter((price) => durations.includes(price.duration))
        .map((price) => ({
          ...price,
          price: Number(price.price),
        })),
    }))
    .sort((a, b) => {
      const ia = PLAN_ORDER.indexOf(a.name);
      const ib = PLAN_ORDER.indexOf(b.name);
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    });

  // The user's current plan
  const session = await auth();
  let currentPlanName = null;
  if (session?.user) {
    const activeSub = await prisma.userSubscription.findFirst({
      where: {
        userId: session.user.id,
        status: "active",
        endDate: { gt: new Date() },
      },
      include: { plan: true },
      orderBy: { startDate: "desc" },
    });
    currentPlanName = activeSub?.plan?.name || null;
  }

  return (
    <div className="container py-5">
      <h1 className="text-center mb-4">Choose Your Plan</h1>
      <p className="text-center text-muted mb-5">
        Select the membership that best fits your business needs. Upgrade or
        downgrade anytime.
      </p>

      <div className="plans-grid">
        {serializedPlans.map((plan) => {
          const isCurrentPlan = plan.name === currentPlanName;
          const isPopular = plan.name === "Silver";
          return (
            <div
              key={plan.id}
              className={`plan-card ${isPopular ? "popular" : ""}`}
            >
              {isPopular && <div className="popular-badge">Most Popular</div>}
              {isCurrentPlan && (
                <div className="current-plan-badge">Current Plan</div>
              )}

              <h3 className="plan-name">{plan.name}</h3>
              <p className="plan-desc">
                {plan.description || "Perfect for your business"}
              </p>

              <div className="plan-features">
                <ul>
                  <li>
                    <i className="fas fa-box"></i>
                    {plan.maxProducts === -1 ? "Unlimited" : plan.maxProducts}{" "}
                    products
                  </li>
                  <li>
                    <i className="fas fa-images"></i>
                    {plan.maxImagesPerProduct === -1
                      ? "Unlimited"
                      : plan.maxImagesPerProduct}{" "}
                    images per product
                  </li>
                  <li>
                    <i className="fas fa-shopping-cart"></i>
                    {plan.maxRequestsPerMonth === -1
                      ? "Unlimited"
                      : plan.maxRequestsPerMonth}{" "}
                    requests/month
                  </li>
                  <li>
                    <i className="fas fa-envelope"></i>
                    {plan.maxInquiriesPerMonth === -1
                      ? "Unlimited"
                      : plan.maxInquiriesPerMonth}{" "}
                    inquiries/month
                  </li>
                  <li>
                    <i className="fas fa-file-signature"></i>
                    {plan.maxQuotesPerMonth === -1
                      ? "Unlimited"
                      : plan.maxQuotesPerMonth}{" "}
                    quotes/month
                  </li>
                </ul>
              </div>

              <PlanPurchase plan={plan} durations={durations} />
            </div>
          );
        })}
      </div>
    </div>
  );
}