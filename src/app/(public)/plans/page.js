// src/app/plans/page.js
import { auth } from "@/auth";
import Layout from "@/components/layout/Layout";
import PlanCard from "@/components/plans/PlanCard";
import Link from "next/link";

export default async function PlansPage() {
  const session = await auth();
  const currentPlan = session?.user?.plan || "FREE";

  const plans = [
    {
      id: "FREE",
      name: "Free",
      price: "$0",
      period: "forever",
      description: "Perfect for getting started",
      popular: false,
      buttonVariant: "btn-outline",
      features: [
        { text: "5 product listings", included: true },
        { text: "3 buying requests / month", included: true },
        { text: "Standard support", included: true },
        { text: "Verified badge", included: false },
        { text: "Analytics dashboard", included: false },
      ],
    },
    {
      id: "BRONZE",
      name: "Bronze",
      price: "$19",
      period: "/ month",
      description: "For growing businesses",
      popular: false,
      buttonVariant: "btn-primary",
      features: [
        { text: "25 product listings", included: true },
        { text: "10 buying requests / month", included: true },
        { text: "Priority support", included: true },
        { text: "Basic analytics dashboard", included: true },
        { text: "Verified badge", included: false },
      ],
    },
    {
      id: "SILVER",
      name: "Silver",
      price: "$39",
      period: "/ month",
      description: "Best value for serious businesses",
      popular: true,
      buttonVariant: "btn-secondary",
      features: [
        { text: "100 product listings", included: true },
        { text: "25 buying requests / month", included: true },
        { text: "24/7 priority support", included: true },
        { text: "Advanced analytics dashboard", included: true },
        { text: "Verified badge", included: true },
      ],
    },
    {
      id: "GOLD",
      name: "Gold",
      price: "$79",
      period: "/ month",
      description: "For enterprise-level businesses",
      popular: false,
      buttonVariant: "btn-success",
      features: [
        { text: "Unlimited product listings", included: true },
        { text: "Unlimited buying requests", included: true },
        { text: "Premium 24/7 support", included: true },
        { text: "Advanced analytics + API", included: true },
        { text: "Verified badge + Top supplier", included: true },
        { text: "Free trade assurance", included: true },
      ],
    },
  ];

  return (
    <Layout>
      <div className="container py-4">
        {/* Breadcrumb */}
        <nav aria-label="breadcrumb" className="mb-4">
          <ol className="breadcrumb">
            <li className="breadcrumb-item">
              <Link href="/" className="text-decoration-none" style={{ color: "var(--primary)" }}>
                Home
              </Link>
            </li>
            <li className="breadcrumb-item active text-muted">Membership Plans</li>
          </ol>
        </nav>

        {/* Page Header */}
        <div className="page-header">
          <h1>
            <i className="fas fa-crown" style={{ color: "var(--primary)" }}></i>
            Choose Your Plan
          </h1>
          <p>Select the membership that best fits your business needs. Upgrade or downgrade anytime.</p>
          {session && (
            <div className="mt-2">
              <span className="badge" style={{ background: "var(--accent)", color: "white", padding: "6px 16px", fontSize: "14px" }}>
                <i className="fas fa-user me-2"></i>
                Current Plan: <strong>{currentPlan}</strong>
              </span>
            </div>
          )}
        </div>

        {/* Plans Grid */}
        <div className="plans-grid">
          {plans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              isCurrentPlan={session?.user?.plan === plan.id}
            />
          ))}
        </div>

        {/* Additional Info */}
        <div className="text-center py-4" style={{ borderTop: "1px solid var(--gray-light)" }}>
          <p className="text-muted">
            All plans include free 14-day trial. Cancel anytime.
            <br />
            <Link href="/contact" className="text-decoration-none" style={{ color: "var(--primary)" }}>
              Contact sales
            </Link>
            {" "}for custom enterprise plans.
          </p>
        </div>
      </div>
    </Layout>
  );
}