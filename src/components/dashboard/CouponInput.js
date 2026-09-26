// src/components/dashboard/CouponInput.js
"use client";

import { useState } from "react";

export default function CouponInput({ planId, amount, onApply }) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [applied, setApplied] = useState(null);

  const handleApply = async () => {
    if (!code.trim()) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/user/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: code.trim(),
          planId,
          amount,
        }),
      });

      const data = await res.json();

      if (!data.valid) {
        setError(data.message || "Invalid coupon");
        setApplied(null);
        onApply(null, 0, amount);
        return;
      }

      setApplied(data);
      onApply(code.trim(), data.discount, data.finalAmount);
    } catch (err) {
      setError("Failed to validate coupon");
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = () => {
    setCode("");
    setApplied(null);
    setError("");
    onApply(null, 0, amount);
  };

  return (
    <div>
      {!applied ? (
        <div>
          <div
            style={{
              display: "flex",
              gap: 8,
              alignItems: "stretch",
            }}
          >
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Coupon code"
              style={{
                flex: 1,
                padding: "10px 14px",
                border: "1.5px solid var(--d-border, #e8edf0)",
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 700,
                color: "var(--d-dark, #0b1f18)",
                background: "white",
                outline: "none",
                letterSpacing: 1,
                fontFamily: "inherit",
              }}
            />
            <button
              type="button"
              onClick={handleApply}
              disabled={loading || !code.trim()}
              style={{
                padding: "10px 18px",
                background: loading || !code.trim() ? "#cbd5d1" : "#0b1f18",
                color: "white",
                border: "none",
                borderRadius: 10,
                fontSize: 12.5,
                fontWeight: 700,
                cursor: loading || !code.trim() ? "not-allowed" : "pointer",
                whiteSpace: "nowrap",
              }}
            >
              {loading ? (
                <span className="spinner-border spinner-border-sm"></span>
              ) : (
                "Apply"
              )}
            </button>
          </div>
          {error && (
            <div
              style={{
                marginTop: 8,
                fontSize: 12,
                color: "#dc2626",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <i className="fas fa-exclamation-circle"></i>
              {error}
            </div>
          )}
        </div>
      ) : (
        <div
          style={{
            padding: "12px 16px",
            background: "var(--d-primary-light, #e6faf1)",
            border: "1px dashed var(--d-primary, #0f9e6e)",
            borderRadius: 10,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 10,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <i
              className="fas fa-check-circle"
              style={{ color: "var(--d-primary, #0f9e6e)", fontSize: 16 }}
            ></i>
            <div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 800,
                  color: "var(--d-primary-dark, #0a7d55)",
                }}
              >
                {applied.coupon.code}
              </div>
              <div
                style={{
                  fontSize: 11.5,
                  color: "var(--d-muted-2, #64748b)",
                }}
              >
                You save ${applied.discount.toFixed(2)}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={handleRemove}
            style={{
              background: "transparent",
              border: "none",
              color: "#dc2626",
              fontSize: 11.5,
              fontWeight: 700,
              cursor: "pointer",
              textDecoration: "underline",
            }}
          >
            Remove
          </button>
        </div>
      )}
    </div>
  );
}