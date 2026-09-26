// src/components/plans/PlanPurchase.js
"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import CouponInput from "@/components/dashboard/CouponInput";

export default function PlanPurchase({ plan, durations }) {
  const { data: session } = useSession();
  const router = useRouter();

  const [selectedDuration, setSelectedDuration] = useState(
    durations[0] || plan.prices[0]?.duration || 180
  );
  const [loading, setLoading] = useState(false);
  const [couponCode, setCouponCode] = useState(null);
  const [discount, setDiscount] = useState(0);
  const [finalAmount, setFinalAmount] = useState(null);

  const selectedPrice = plan.prices.find(
    (p) => p.duration === selectedDuration
  );
  const originalAmount = selectedPrice ? Number(selectedPrice.price) : 0;
  const displayAmount =
    finalAmount !== null ? finalAmount : originalAmount;

  const handlePurchase = async () => {
    if (!session) {
      router.push("/login");
      return;
    }

    if (originalAmount === 0 && !couponCode) {
      // پلن رایگان
      // همچنان به API بفرست
    }

    setLoading(true);
    try {
      const res = await fetch("/api/user/subscription/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: plan.id,
          duration: selectedDuration,
          couponCode: couponCode || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Purchase failed");

      toast.success(data.message || "Subscription activated!");

      // به صفحه billing هدایت کن
      router.push(`/dashboard/billing/invoice/${data.payment.id}`);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

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
              onClick={() => {
                setSelectedDuration(duration);
                setFinalAmount(null);
                setDiscount(0);
                setCouponCode(null);
              }}
              style={{
                flex: 1,
                padding: "10px 12px",
                borderRadius: 10,
                border: isActive
                  ? "2px solid var(--d-primary, #0f9e6e)"
                  : "1.5px solid var(--d-border, #e8edf0)",
                background: isActive
                  ? "var(--d-primary-light, #e6faf1)"
                  : "white",
                color: isActive
                  ? "var(--d-primary-dark, #0a7d55)"
                  : "var(--d-text, #334155)",
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
        {discount > 0 ? (
          <>
            <div
              style={{
                fontSize: 13,
                color: "var(--d-muted-2, #64748b)",
                textDecoration: "line-through",
              }}
            >
              ${originalAmount.toFixed(2)}
            </div>
            <div
              style={{
                fontSize: 32,
                fontWeight: 900,
                color: "var(--d-primary, #0f9e6e)",
                fontFamily: "Manrope, sans-serif",
                letterSpacing: -0.5,
              }}
            >
              ${displayAmount.toFixed(2)}
            </div>
            <div
              style={{
                fontSize: 12,
                color: "var(--d-primary, #0f9e6e)",
                fontWeight: 700,
              }}
            >
              You save ${discount.toFixed(2)}
            </div>
          </>
        ) : (
          <div
            style={{
              fontSize: 32,
              fontWeight: 900,
              color: "var(--d-dark, #0b1f18)",
              fontFamily: "Manrope, sans-serif",
              letterSpacing: -0.5,
            }}
          >
            ${originalAmount.toFixed(2)}
            <span
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: "var(--d-muted, #94a3b8)",
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
        )}
      </div>

      {/* Coupon (only if not free) */}
      {originalAmount > 0 && (
        <div style={{ marginBottom: 16 }}>
          <CouponInput
            planId={plan.id}
            amount={originalAmount}
            onApply={(code, disc, finalAmt) => {
              setCouponCode(code);
              setDiscount(disc);
              setFinalAmount(finalAmt);
            }}
          />
        </div>
      )}

      {/* Purchase Button */}
      <button
        onClick={handlePurchase}
        disabled={loading}
        style={{
          width: "100%",
          padding: "13px 20px",
          background:
            originalAmount === 0 && !couponCode
              ? "linear-gradient(135deg, #0f9e6e, #0a7d55)"
              : "linear-gradient(135deg, #0f9e6e, #0a7d55)",
          color: "white",
          border: "none",
          borderRadius: 12,
          fontSize: 14,
          fontWeight: 800,
          cursor: loading ? "not-allowed" : "pointer",
          boxShadow: "0 8px 20px rgba(15,158,110,0.25)",
          opacity: loading ? 0.7 : 1,
          fontFamily: "inherit",
          transition: "all 0.2s ease",
        }}
      >
        {loading ? (
          <>
            <span className="spinner-border spinner-border-sm me-2"></span>
            Processing...
          </>
        ) : originalAmount === 0 && !couponCode ? (
          <>
            <i className="fas fa-check me-2"></i>
            Activate for Free
          </>
        ) : (
          <>
            <i className="fas fa-crown me-2"></i>
            Purchase for ${displayAmount.toFixed(2)}
          </>
        )}
      </button>

      {/* Security note */}
      <div
        style={{
          marginTop: 12,
          fontSize: 11,
          color: "var(--d-muted, #94a3b8)",
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