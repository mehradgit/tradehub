// src/components/admin/CouponManager.js
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

export default function CouponManager({ initialCoupons, plans = [] }) {
  const router = useRouter();
  const [coupons, setCoupons] = useState(initialCoupons);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    code: "",
    type: "percentage",
    value: "",
    maxUses: "",
    minAmount: "",
    maxDiscount: "",
    appliesToPlans: [],
    validUntil: "",
    isActive: true,
  });

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handlePlanToggle = (planName) => {
    setFormData((prev) => ({
      ...prev,
      appliesToPlans: prev.appliesToPlans.includes(planName)
        ? prev.appliesToPlans.filter((p) => p !== planName)
        : [...prev.appliesToPlans, planName],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: formData.code,
          type: formData.type,
          value: formData.value,
          maxUses: formData.maxUses || null,
          minAmount: formData.minAmount || null,
          maxDiscount: formData.maxDiscount || null,
          appliesToPlans: formData.appliesToPlans,
          validUntil: formData.validUntil || null,
          isActive: formData.isActive,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      toast.success("Coupon created successfully");
      setCoupons([data.coupon, ...coupons]);
      setShowForm(false);
      resetForm();
      router.refresh();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      code: "",
      type: "percentage",
      value: "",
      maxUses: "",
      minAmount: "",
      maxDiscount: "",
      appliesToPlans: [],
      validUntil: "",
      isActive: true,
    });
  };

  const handleToggleActive = async (coupon) => {
    try {
      const res = await fetch(`/api/admin/coupons/${coupon.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !coupon.isActive }),
      });
      if (res.ok) {
        setCoupons((prev) =>
          prev.map((c) =>
            c.id === coupon.id ? { ...c, isActive: !c.isActive } : c
          )
        );
        toast.success("Coupon updated");
      }
    } catch (err) {
      toast.error("Failed to update");
    }
  };

  return (
    <div>
      {/* Add button */}
      <div style={{ marginBottom: 20 }}>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            padding: "11px 20px",
            background: showForm ? "white" : "var(--green2)",
            color: showForm ? "var(--text)" : "white",
            border: showForm ? "1px solid var(--line)" : "none",
            borderRadius: 10,
            fontSize: 12,
            fontWeight: 700,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            boxShadow: showForm ? "none" : "0 6px 16px rgba(19,121,91,0.25)",
          }}
        >
          {showForm ? (
            <>
              <i className="fa-solid fa-times"></i> Cancel
            </>
          ) : (
            <>
              <i className="fa-solid fa-plus"></i> Create Coupon
            </>
          )}
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div
          className="admin-card"
          style={{ padding: 24, marginBottom: 20 }}
        >
          <h3
            style={{
              font: "800 14px 'Manrope', sans-serif",
              marginBottom: 20,
              color: "#13251f",
            }}
          >
            New Coupon
          </h3>

          <form onSubmit={handleSubmit}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 16,
                marginBottom: 16,
              }}
            >
              <div>
                <Label>Coupon Code *</Label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) =>
                    handleChange("code", e.target.value.toUpperCase())
                  }
                  placeholder="e.g., WELCOME10"
                  required
                  style={{ ...inputStyle, fontWeight: 700, letterSpacing: 1 }}
                />
              </div>
              <div>
                <Label>Type *</Label>
                <select
                  value={formData.type}
                  onChange={(e) => handleChange("type", e.target.value)}
                  style={selectStyle}
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount ($)</option>
                </select>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: 16,
                marginBottom: 16,
              }}
            >
              <div>
                <Label>
                  {formData.type === "percentage" ? "Discount %" : "Amount $"} *
                </Label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.value}
                  onChange={(e) => handleChange("value", e.target.value)}
                  placeholder={formData.type === "percentage" ? "10" : "20"}
                  required
                  style={inputStyle}
                />
              </div>
              <div>
                <Label>Max Uses</Label>
                <input
                  type="number"
                  value={formData.maxUses}
                  onChange={(e) => handleChange("maxUses", e.target.value)}
                  placeholder="Unlimited"
                  style={inputStyle}
                />
              </div>
              <div>
                <Label>Min Amount $</Label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.minAmount}
                  onChange={(e) => handleChange("minAmount", e.target.value)}
                  placeholder="Optional"
                  style={inputStyle}
                />
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 16,
                marginBottom: 16,
              }}
            >
              <div>
                <Label>Max Discount $ (for %)</Label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.maxDiscount}
                  onChange={(e) =>
                    handleChange("maxDiscount", e.target.value)
                  }
                  placeholder="Optional cap"
                  style={inputStyle}
                />
              </div>
              <div>
                <Label>Valid Until</Label>
                <input
                  type="date"
                  value={formData.validUntil}
                  onChange={(e) =>
                    handleChange("validUntil", e.target.value)
                  }
                  style={inputStyle}
                />
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <Label>Applies to Plans</Label>
              <div
                style={{ display: "flex", gap: 8, flexWrap: "wrap" }}
              >
                {plans.map((plan) => {
                  const isSelected = formData.appliesToPlans.includes(
                    plan.name
                  );
                  return (
                    <button
                      key={plan.id}
                      type="button"
                      onClick={() => handlePlanToggle(plan.name)}
                      style={{
                        padding: "6px 14px",
                        borderRadius: 50,
                        border: `1px solid ${
                          isSelected ? "var(--green2)" : "var(--line)"
                        }`,
                        background: isSelected ? "#eaf7f1" : "white",
                        color: isSelected
                          ? "#0b5b43"
                          : "var(--text)",
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      {plan.name}
                    </button>
                  );
                })}
              </div>
              {formData.appliesToPlans.length === 0 && (
                <div
                  style={{
                    fontSize: 11,
                    color: "var(--muted)",
                    marginTop: 8,
                  }}
                >
                  <i className="fa-solid fa-info-circle me-1"></i>
                  No plan selected = applies to all plans.
                </div>
              )}
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 12,
                paddingTop: 16,
                borderTop: "1px solid var(--line)",
              }}
            >
              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: "12px 28px",
                  background:
                    "linear-gradient(135deg, var(--green2), var(--green))",
                  border: 0,
                  borderRadius: 10,
                  fontSize: 12,
                  fontWeight: 700,
                  color: "white",
                  cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.7 : 1,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                {loading ? "Creating..." : "Create Coupon"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Coupons list */}
      <div className="admin-card">
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Discount</th>
                <th>Uses</th>
                <th>Validity</th>
                <th>Plans</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {coupons.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    style={{
                      textAlign: "center",
                      padding: 40,
                      color: "var(--muted)",
                    }}
                  >
                    No coupons yet. Create your first one.
                  </td>
                </tr>
              ) : (
                coupons.map((coupon) => (
                  <tr key={coupon.id}>
                    <td>
                      <span
                        style={{
                          fontFamily: "monospace",
                          fontSize: 13,
                          fontWeight: 800,
                          color: "var(--green2)",
                          background: "#eaf7f1",
                          padding: "4px 10px",
                          borderRadius: 6,
                          letterSpacing: 0.5,
                        }}
                      >
                        {coupon.code}
                      </span>
                    </td>
                    <td>
                      <b>
                        {coupon.type === "percentage"
                          ? `${Number(coupon.value)}%`
                          : `$${Number(coupon.value)}`}
                      </b>
                    </td>
                    <td>
                      {coupon.usedCount}
                      {coupon.maxUses ? ` / ${coupon.maxUses}` : " / ∞"}
                    </td>
                    <td>
                      <span
                        style={{ fontSize: 11, color: "var(--muted)" }}
                      >
                        {coupon.validUntil
                          ? new Date(coupon.validUntil).toLocaleDateString()
                          : "No expiry"}
                      </span>
                    </td>
                    <td>
                      {coupon.appliesToPlans &&
                      Array.isArray(coupon.appliesToPlans) &&
                      coupon.appliesToPlans.length > 0 ? (
                        <span style={{ fontSize: 11 }}>
                          {coupon.appliesToPlans.join(", ")}
                        </span>
                      ) : (
                        <span
                          style={{ fontSize: 11, color: "var(--muted)" }}
                        >
                          All plans
                        </span>
                      )}
                    </td>
                    <td>
                      <span
                        className={`admin-pill ${
                          coupon.isActive ? "active" : "basic"
                        }`}
                      >
                        {coupon.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => handleToggleActive(coupon)}
                        style={{
                          padding: "5px 12px",
                          fontSize: 10,
                          fontWeight: 700,
                          border: "1px solid var(--line)",
                          borderRadius: 6,
                          background: "white",
                          cursor: "pointer",
                          color: coupon.isActive ? "#dc2626" : "var(--green2)",
                        }}
                      >
                        {coupon.isActive ? "Disable" : "Enable"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Label({ children }) {
  return (
    <label
      style={{
        display: "block",
        fontSize: 12,
        fontWeight: 700,
        color: "var(--dark)",
        marginBottom: 8,
      }}
    >
      {children}
    </label>
  );
}

const inputStyle = {
  width: "100%",
  padding: "11px 14px",
  border: "1px solid var(--line)",
  borderRadius: 10,
  fontSize: 12,
  fontFamily: "inherit",
  outline: "none",
  background: "white",
  color: "var(--text)",
  boxSizing: "border-box",
};

const selectStyle = { ...inputStyle, cursor: "pointer" };