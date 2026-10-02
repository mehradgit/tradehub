// src/components/checkout/CheckoutClient.js
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "react-toastify";
import CouponInput from "@/components/dashboard/CouponInput";

export default function CheckoutClient({ plan, user, missingFields }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [couponCode, setCouponCode] = useState(null);
  const [discount, setDiscount] = useState(0);
  const [finalAmount, setFinalAmount] = useState(null);

  const originalAmount = plan.price;
  const displayAmount = finalAmount !== null ? finalAmount : originalAmount;
  const hasMissingFields = missingFields.length > 0;

  const handlePay = async () => {
    if (hasMissingFields) {
      toast.warning("Please complete your profile first.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/user/subscription/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: plan.id,
          duration: plan.duration,
          couponCode: couponCode || undefined,
        }),
      });

      const data = await res.json();

      // پروفایل ناقص
      if (res.status === 400 && data.reason === "incomplete_profile") {
        toast.error("Please complete your profile first.");
        router.push("/dashboard/edit-profile");
        return;
      }

      if (!res.ok) throw new Error(data.message || "Payment failed");

      // پلن رایگان
      if (data.free) {
        toast.success("Subscription activated!");
        router.push(`/dashboard/billing/invoice/${data.payment.id}`);
        return;
      }

      // پرداخت با YekPay
      if (data.paymentUrl) {
        toast.info("Redirecting to payment gateway...");
        setTimeout(() => {
          window.location.href = data.paymentUrl;
        }, 600);
        return;
      }

      // Fallback شبیه‌سازی
      if (data.payment?.id) {
        toast.success("Subscription activated!");
        router.push(`/dashboard/billing/invoice/${data.payment.id}`);
        return;
      }

      throw new Error("Unexpected response");
    } catch (error) {
      toast.error(error.message);
      setLoading(false);
    }
  };

  // فرمت مبلغ
  const formatPrice = (price) =>
    new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);

  // مدت به فارسی/انگلیسی
  const durationLabel =
    plan.duration === 180
      ? "6 Months"
      : plan.duration === 360
        ? "12 Months"
        : `${plan.duration} Days`;

  return (
    <div className="container py-5" style={{ maxWidth: 1000 }}>
      {/* هدر */}
      <div className="text-center mb-5">
        <div
          className="mx-auto mb-3 d-flex align-items-center justify-content-center"
          style={{
            width: 64,
            height: 64,
            background: "linear-gradient(135deg, #13795b, #1d9a71)",
            borderRadius: 16,
            boxShadow: "0 8px 20px rgba(19,121,91,0.25)",
          }}
        >
          <i className="fas fa-lock text-white fs-3"></i>
        </div>
        <h1
          style={{
            fontFamily: "Manrope, sans-serif",
            fontSize: 28,
            fontWeight: 800,
            color: "#13251f",
            marginBottom: 8,
          }}
        >
          Secure Checkout
        </h1>
        <p style={{ fontSize: 14, color: "#71807b" }}>
          Review your order and complete payment
        </p>
      </div>

      <div className="row g-4">
        {/* ====== ستون چپ: خلاصه سفارش ====== */}
        <div className="col-lg-7">
          <div
            style={{
              background: "white",
              borderRadius: 20,
              border: "1px solid #e2e9e5",
              padding: 28,
              boxShadow: "0 8px 24px rgba(15,23,42,0.04)",
            }}
          >
            <h3
              style={{
                fontFamily: "Manrope, sans-serif",
                fontSize: 16,
                fontWeight: 800,
                color: "#13251f",
                marginBottom: 20,
                paddingBottom: 12,
                borderBottom: "1px solid #f1f5f7",
              }}
            >
              <i className="fas fa-box" style={{ color: "#13795b", marginRight: 8 }}></i>
              Order Summary
            </h3>

            {/* پلن */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "16px 0",
                borderBottom: "1px dashed #f1f5f7",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: "#13251f",
                    marginBottom: 4,
                  }}
                >
                  {plan.name} Plan
                </div>
                <div style={{ fontSize: 13, color: "#71807b" }}>
                  {plan.description || "Full access to premium features"}
                </div>
              </div>
              <span
                style={{
                  padding: "4px 12px",
                  borderRadius: 50,
                  background: "#eaf7f1",
                  color: "#0b5b43",
                  fontSize: 11,
                  fontWeight: 800,
                  textTransform: "uppercase",
                }}
              >
                {durationLabel}
              </span>
            </div>

            {/* قیمت اصلی */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "14px 0",
                fontSize: 14,
                color: "#334155",
              }}
            >
              <span>Subtotal</span>
              <span style={{ fontWeight: 700 }}>
                ${formatPrice(originalAmount)}
              </span>
            </div>

            {/* تخفیف */}
            {discount > 0 && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "14px 0",
                  fontSize: 14,
                  color: "#13795b",
                }}
              >
                <span>
                  <i className="fas fa-tag" style={{ marginRight: 6 }}></i>
                  Discount
                </span>
                <span style={{ fontWeight: 700 }}>
                  −${formatPrice(discount)}
                </span>
              </div>
            )}

            {/* جمع کل */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "16px 0",
                borderTop: "2px solid #13251f",
                marginTop: 8,
                fontSize: 18,
                fontWeight: 800,
                color: "#13251f",
                fontFamily: "Manrope, sans-serif",
              }}
            >
              <span>Total</span>
              <span>${formatPrice(displayAmount)}</span>
            </div>

            {/* کد تخفیف */}
            {originalAmount > 0 && (
              <div style={{ marginTop: 20 }}>
                <label
                  style={{
                    display: "block",
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#13251f",
                    marginBottom: 8,
                  }}
                >
                  Have a coupon?
                </label>
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
          </div>
        </div>

        {/* ====== ستون راست: اطلاعات کاربر + دکمه ====== */}
        <div className="col-lg-5">
          <div
            style={{
              background: "white",
              borderRadius: 20,
              border: "1px solid #e2e9e5",
              padding: 28,
              boxShadow: "0 8px 24px rgba(15,23,42,0.04)",
              position: "sticky",
              top: 20,
            }}
          >
            <h3
              style={{
                fontFamily: "Manrope, sans-serif",
                fontSize: 16,
                fontWeight: 800,
                color: "#13251f",
                marginBottom: 20,
                paddingBottom: 12,
                borderBottom: "1px solid #f1f5f7",
              }}
            >
              <i className="fas fa-user" style={{ color: "#13795b", marginRight: 8 }}></i>
              Billing Information
            </h3>

            {/* هشدار پروفایل ناقص */}
            {hasMissingFields && (
              <div
                style={{
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 20,
                }}
              >
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 800,
                    color: "#991b1b",
                    marginBottom: 8,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                  }}
                >
                  <i className="fas fa-exclamation-triangle me-1"></i>
                  Profile Incomplete
                </div>
                <p
                  style={{
                    fontSize: 12,
                    color: "#7f1d1d",
                    margin: "0 0 10px 0",
                    lineHeight: 1.6,
                  }}
                >
                  These fields are required before payment:
                </p>
                <ul
                  style={{
                    margin: 0,
                    paddingLeft: 20,
                    fontSize: 12,
                    color: "#7f1d1d",
                    lineHeight: 1.8,
                  }}
                >
                  {missingFields.map((f) => (
                    <li key={f.key}>{f.label}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* اطلاعات */}
            {!hasMissingFields && (
              <div
                style={{
                  background: "#f9fbfa",
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 20,
                  fontSize: 13,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "6px 0",
                    color: "#64748b",
                  }}
                >
                  <span>Name</span>
                  <span style={{ fontWeight: 700, color: "#13251f" }}>
                    {user.name || user.companyName || "—"}
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "6px 0",
                    color: "#64748b",
                  }}
                >
                  <span>Email</span>
                  <span style={{ fontWeight: 700, color: "#13251f" }}>
                    {user.email}
                  </span>
                </div>
              </div>
            )}

            {/* دکمه‌ها */}
            {hasMissingFields ? (
              <Link
                href="/dashboard/edit-profile"
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: 8,
                  width: "100%",
                  padding: "14px 20px",
                  background: "linear-gradient(135deg, #f59e0b, #d97706)",
                  color: "white",
                  border: "none",
                  borderRadius: 12,
                  fontSize: 14,
                  fontWeight: 800,
                  textDecoration: "none",
                  boxShadow: "0 8px 20px rgba(245,158,11,0.25)",
                }}
              >
                <i className="fas fa-user-edit"></i>
                Complete Your Profile
              </Link>
            ) : (
              <button
                onClick={handlePay}
                disabled={loading}
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: 8,
                  width: "100%",
                  padding: "14px 20px",
                  background:
                    "linear-gradient(135deg, #13795b, #1d9a71)",
                  color: "white",
                  border: "none",
                  borderRadius: 12,
                  fontSize: 14,
                  fontWeight: 800,
                  cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.7 : 1,
                  boxShadow: "0 8px 20px rgba(19,121,91,0.25)",
                  fontFamily: "inherit",
                }}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm"></span>
                    Processing...
                  </>
                ) : (
                  <>
                    <i className="fas fa-lock"></i>
                    Pay ${formatPrice(displayAmount)}
                  </>
                )}
              </button>
            )}

            {/* لینک بازگشت */}
            <Link
              href="/plans"
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: 6,
                width: "100%",
                padding: "10px 20px",
                marginTop: 12,
                background: "transparent",
                color: "#71807b",
                border: "1px solid #e2e9e5",
                borderRadius: 12,
                fontSize: 12,
                fontWeight: 700,
                textDecoration: "none",
              }}
            >
              <i className="fas fa-arrow-left"></i>
              Back to Plans
            </Link>

            {/* امنیت */}
            <div
              style={{
                marginTop: 16,
                paddingTop: 16,
                borderTop: "1px solid #f1f5f7",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                fontSize: 11,
                color: "#94a3b8",
              }}
            >
              <i className="fas fa-shield-alt"></i>
              Secure payment powered by FoodTradeLink
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}