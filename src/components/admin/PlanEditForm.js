// src/components/admin/PlanEditForm.js
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

export default function PlanEditForm({ plan }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: plan.name,
    description: plan.description || "",
    maxProducts: plan.maxProducts,
    maxImagesPerProduct: plan.maxImagesPerProduct,
    maxRequestsPerMonth: plan.maxRequestsPerMonth,
    maxImagesPerRequest: plan.maxImagesPerRequest,
    maxProfileImages: plan.maxProfileImages,
    maxInquiriesPerMonth: plan.maxInquiriesPerMonth,
    maxQuotesPerMonth: plan.maxQuotesPerMonth,
    isActive: plan.isActive,
  });

  const [prices, setPrices] = useState(
    plan.prices.map((p) => ({ duration: p.duration, price: p.price }))
  );

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handlePriceChange = (index, field, value) => {
    const newPrices = [...prices];
    newPrices[index][field] = field === "duration" ? parseInt(value) || 0 : parseFloat(value) || 0;
    setPrices(newPrices);
  };

  const addPriceTier = () => {
    setPrices([...prices, { duration: 180, price: 0 }]);
  };

  const removePriceTier = (index) => {
    setPrices(prices.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Update plan info
      const res = await fetch(`/api/admin/plans/${plan.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          maxProducts: parseInt(form.maxProducts),
          maxImagesPerProduct: parseInt(form.maxImagesPerProduct),
          maxRequestsPerMonth: parseInt(form.maxRequestsPerMonth),
          maxImagesPerRequest: parseInt(form.maxImagesPerRequest),
          maxProfileImages: parseInt(form.maxProfileImages),
          maxInquiriesPerMonth: parseInt(form.maxInquiriesPerMonth),
          maxQuotesPerMonth: parseInt(form.maxQuotesPerMonth),
        }),
      });
      if (!res.ok) throw new Error("Failed to update plan");

      // Update prices
      const priceRes = await fetch(`/api/admin/plans/${plan.id}/prices`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prices }),
      });
      if (!priceRes.ok) throw new Error("Failed to update prices");

      toast.success("Plan updated successfully");
      router.push("/admin/plans");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = {
    width: "100%",
    padding: "10px 14px",
    border: "1px solid var(--line)",
    borderRadius: 10,
    fontSize: 12,
    fontFamily: "inherit",
    outline: "none",
    background: "#fff",
    color: "var(--text)",
  };

  const labelStyle = {
    display: "block",
    fontSize: 11,
    fontWeight: 700,
    color: "var(--dark)",
    marginBottom: 6,
  };

  const sectionStyle = {
    marginBottom: 24,
    paddingBottom: 24,
    borderBottom: "1px solid var(--line)",
  };

  const sectionTitleStyle = {
    font: "800 13px 'Manrope', sans-serif",
    color: "var(--dark)",
    marginBottom: 14,
    display: "flex",
    alignItems: "center",
    gap: 8,
  };

  return (
    <div className="admin-card" style={{ padding: 28 }}>
      <form onSubmit={handleSubmit}>
        {/* Basic Information */}
        <div style={sectionStyle}>
          <h3 style={sectionTitleStyle}>
            <i className="fa-solid fa-info-circle" style={{ color: "var(--green2)" }}></i>
            Basic Information
          </h3>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <label style={labelStyle}>Plan Name</label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Description</label>
              <input
                type="text"
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Short description"
                style={inputStyle}
              />
            </div>
          </div>

          <div style={{ marginTop: 14 }}>
            <label style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              fontSize: 12,
              cursor: "pointer",
            }}>
              <input
                type="checkbox"
                name="isActive"
                checked={form.isActive}
                onChange={handleChange}
                style={{ width: 16, height: 16, accentColor: "var(--green2)" }}
              />
              <span style={{ fontWeight: 600, color: "var(--dark)" }}>
                Active (visible on plans page)
              </span>
            </label>
          </div>
        </div>

        {/* Pricing */}
        <div style={sectionStyle}>
          <h3 style={sectionTitleStyle}>
            <i className="fa-solid fa-dollar-sign" style={{ color: "var(--green2)" }}></i>
            Pricing
          </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {prices.map((price, index) => (
              <div
                key={index}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr auto",
                  gap: 12,
                  alignItems: "end",
                }}
              >
                <div>
                  <label style={labelStyle}>Duration (days)</label>
                  <input
                    type="number"
                    value={price.duration}
                    onChange={(e) => handlePriceChange(index, "duration", e.target.value)}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={price.price}
                    onChange={(e) => handlePriceChange(index, "price", e.target.value)}
                    style={inputStyle}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removePriceTier(index)}
                  style={{
                    padding: "10px 14px",
                    background: "#fde8e5",
                    color: "#e75e5e",
                    border: 0,
                    borderRadius: 10,
                    cursor: "pointer",
                    fontSize: 12,
                  }}
                >
                  <i className="fa-solid fa-trash"></i>
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={addPriceTier}
              style={{
                padding: "10px 16px",
                background: "var(--bg)",
                border: "1px dashed var(--line)",
                borderRadius: 10,
                cursor: "pointer",
                fontSize: 11,
                fontWeight: 700,
                color: "var(--green2)",
                alignSelf: "flex-start",
              }}
            >
              <i className="fa-solid fa-plus"></i> Add Price Tier
            </button>
          </div>
        </div>

        {/* Limits */}
        <div style={sectionStyle}>
          <h3 style={sectionTitleStyle}>
            <i className="fa-solid fa-sliders" style={{ color: "var(--green2)" }}></i>
            Plan Limits
            <span style={{ fontSize: 10, color: "var(--muted)", fontWeight: 500 }}>
              (use -1 for unlimited)
            </span>
          </h3>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
            <div>
              <label style={labelStyle}>
                <i className="fa-solid fa-box" style={{ color: "var(--green2)", marginRight: 4 }}></i>
                Max Products
              </label>
              <input
                type="number"
                name="maxProducts"
                value={form.maxProducts}
                onChange={handleChange}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>
                <i className="fa-solid fa-images" style={{ color: "var(--green2)", marginRight: 4 }}></i>
                Images/Product
              </label>
              <input
                type="number"
                name="maxImagesPerProduct"
                value={form.maxImagesPerProduct}
                onChange={handleChange}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>
                <i className="fa-solid fa-shopping-cart" style={{ color: "var(--green2)", marginRight: 4 }}></i>
                Requests/Month
              </label>
              <input
                type="number"
                name="maxRequestsPerMonth"
                value={form.maxRequestsPerMonth}
                onChange={handleChange}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>
                <i className="fa-solid fa-file-image" style={{ color: "var(--green2)", marginRight: 4 }}></i>
                Images/Request
              </label>
              <input
                type="number"
                name="maxImagesPerRequest"
                value={form.maxImagesPerRequest}
                onChange={handleChange}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>
                <i className="fa-solid fa-user-circle" style={{ color: "var(--green2)", marginRight: 4 }}></i>
                Profile Images
              </label>
              <input
                type="number"
                name="maxProfileImages"
                value={form.maxProfileImages}
                onChange={handleChange}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>
                <i className="fa-solid fa-envelope" style={{ color: "var(--green2)", marginRight: 4 }}></i>
                Inquiries/Month
              </label>
              <input
                type="number"
                name="maxInquiriesPerMonth"
                value={form.maxInquiriesPerMonth}
                onChange={handleChange}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>
                <i className="fa-solid fa-file-signature" style={{ color: "var(--green2)", marginRight: 4 }}></i>
                Quotes/Month
              </label>
              <input
                type="number"
                name="maxQuotesPerMonth"
                value={form.maxQuotesPerMonth}
                onChange={handleChange}
                style={inputStyle}
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
          <button
            type="button"
            onClick={() => router.push("/admin/plans")}
            style={{
              padding: "12px 24px",
              background: "transparent",
              border: "1px solid var(--line)",
              borderRadius: 10,
              fontSize: 12,
              fontWeight: 700,
              color: "var(--text)",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            style={{
              padding: "12px 28px",
              background: "linear-gradient(135deg, var(--green2), var(--green))",
              border: 0,
              borderRadius: 10,
              fontSize: 12,
              fontWeight: 700,
              color: "white",
              cursor: saving ? "not-allowed" : "pointer",
              opacity: saving ? 0.7 : 1,
              boxShadow: "0 6px 16px rgba(19,121,91,0.25)",
            }}
          >
            {saving ? (
              <>
                <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: 6 }}></i>
                Saving...
              </>
            ) : (
              <>
                <i className="fa-solid fa-check" style={{ marginRight: 6 }}></i>
                Save Changes
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}