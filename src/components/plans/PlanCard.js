// src/components/plans/PlanCard.js
"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function PlanCard({ plan, isCurrentPlan }) {
  const { data: session } = useSession();
  const router = useRouter();

  const handleAction = () => {
    if (!session) {
      router.push("/login");
      return;
    }

    if (isCurrentPlan) {
      // کاربر در این پلن است
      alert(`You are already on the ${plan.name} plan.`);
      return;
    }

    // درخواست ارتقا/تغییر پلن
    alert(`Upgrading to ${plan.name} plan...`);
    // در عمل، به API /api/user/upgrade ارسال می‌شود
  };

  return (
    <div className={`plan-card ${plan.popular ? "popular" : ""}`}>
      {plan.popular && <span className="popular-badge">Most Popular</span>}
      <div className="plan-name">{plan.name}</div>
      <div className="plan-price">
        {plan.price} <small>{plan.period}</small>
      </div>
      <p className="plan-desc">{plan.description}</p>
      <ul className="plan-features">
        {plan.features.map((feature, index) => (
          <li key={index}>
            <i className={`fas ${feature.included ? "fa-check" : "fa-times"}`}></i>
            <span className={feature.included ? "" : "feature-muted"}>{feature.text}</span>
          </li>
        ))}
      </ul>
      {isCurrentPlan ? (
        <button className="btn btn-outline" disabled>
          <i className="fas fa-check-circle me-2"></i> Current Plan
        </button>
      ) : (
        <button className={`btn ${plan.buttonVariant || "btn-primary"}`} onClick={handleAction}>
          {session ? "Upgrade" : "Sign In to Upgrade"}
        </button>
      )}
    </div>
  );
}