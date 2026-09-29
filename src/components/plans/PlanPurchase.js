// src/components/plans/PlanPurchase.js
"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function PlanPurchase({ plan, durations }) {
  const { data: session } = useSession();
  const router = useRouter();

  const [selectedDuration, setSelectedDuration] = useState(
    durations[0] || plan.prices[0]?.duration || 180
  );

  const selectedPrice = plan.prices.find(
    (p) => p.duration === selectedDuration
  );
  const originalAmount = selectedPrice ? Number(selectedPrice.price) : 0;

  const handleContinue = () => {
    if (!session) {
      router.push(`/login?callbackUrl=/plans`);
      return;
    }
    router.push(`/checkout?planId=${plan.id}&duration=${selectedDuration}`);
  };

  const formatPrice = (price) =>
    new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);

  return (
    <div>
      {/* Duration Selector */}
      <div
        style={{
          display: "flex",
          gap: 8,
          marginBottom: 16,
          flexWrap: "wrap",
        }}
      >
        {durations.map((duration) => {
          const price = plan.prices.find((p) => p.duration === duration);
          if (!price) return null;
          const isActive = selectedDuration === duration;

          return (
            <button
              key={duration}
              type="button"
              onClick={() => setSelectedDuration(duration)}
              style={{
                flex: 1,
                padding: "10px 12px",
                borderRadius: 10,
                border: isActive
                  ? "2px solid #13795b"
                  : "1.5px solid #e2e9e5",
                background: isActive ? "#eaf7f1" : "white",
                color: isActive ? "#0b5b43" : "#334155",
                fontSize: 12.5,
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.2s ease",
                fontFamily: "inherit",
              }}
            >
              {duration === 180
                ? "6 Months"
                : duration === 360
                  ? "12 Months"
                  : `${duration} Days`}
            </button>
          );
        })}
      </div>

      {/* Price */}
      <div
        style={{
          textAlign: "center",
          padding: "16px 0",
          marginBottom: 16,
        }}
      >
        <div
          style={{
            fontSize: 32,
            fontWeight: 900,
            color: "#0b1f18",
            fontFamily: "Manrope, sans-serif",
            letterSpacing: -0.5,
          }}
        >
          ${formatPrice(originalAmount)}
          <span
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: "#94a3b8",
            }}
          >
            {" "}
            /{" "}
            {selectedDuration === 180
              ? "6mo"
              : selectedDuration === 360
                ? "12mo"
                : `${selectedDuration}d`}
          </span>
        </div>
      </div>

      {/* Continue Button */}
      <button
        onClick={handleContinue}
        style={{
          width: "100%",
          padding: "13px 20px",
          background: "linear-gradient(135deg, #0f9e6e, #0a7d55)",
          color: "white",
          border: "none",
          borderRadius: 12,
          fontSize: 14,
          fontWeight: 800,
          cursor: "pointer",
          boxShadow: "0 8px 20px rgba(15,158,110,0.25)",
          fontFamily: "inherit",
          transition: "all 0.2s ease",
        }}
      >
        {originalAmount === 0 ? (
          <>
            <i className="fas fa-check me-2"></i>
            Activate for Free
          </>
        ) : (
          <>
            <i className="fas fa-arrow-right me-2"></i>
            Continue to Checkout
          </>
        )}
      </button>

      <div
        style={{
          marginTop: 12,
          fontSize: 11,
          color: "#94a3b8",
          textAlign: "center",
          lineHeight: 1.5,
        }}
      >
        <i className="fas fa-lock me-1"></i>
        Secure payment · Instant activation
      </div>
    </div>
  );
}