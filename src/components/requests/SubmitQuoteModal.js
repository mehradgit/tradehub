// src/components/requests/SubmitQuoteModal.js
"use client";

import { useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { toast } from "react-toastify";
import LoginModal from "@/components/ui/LoginModal";

export default function SubmitQuoteModal({ isOpen, onClose, requestId, buyerId, requestTitle }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const formRef = useRef(null);

  // فرم دیتا با مقدار پیش‌فرض از سشن
  const [formData, setFormData] = useState({
    name: session?.user?.name?.split(" ")[0] || "",
    lastName: session?.user?.name?.split(" ").slice(1).join(" ") || "",
    email: session?.user?.email || "",
    phone: session?.user?.phone || "",
    quantity: "",
    offeredPrice: "",
    message: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!session) {
      setIsLoginModalOpen(true);
      return;
    }

    setLoading(true);
    try {
      const payload = {
        requestId,
        buyerId,
        quantity: formData.quantity ? parseInt(formData.quantity) : null,
        offeredPrice: formData.offeredPrice ? parseFloat(formData.offeredPrice) : null,
        message: formData.message || `Interested in fulfilling this request.`,
      };

      const res = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to submit quote");

      toast.success("Quote submitted successfully!");
      onClose();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="modal-overlay"
        onClick={onClose}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0, 0, 0, 0.6)",
          backdropFilter: "blur(6px)",
          zIndex: 9999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px",
        }}
      >
        <div
          className="modal-content"
          onClick={(e) => e.stopPropagation()}
          style={{
            background: "white",
            borderRadius: "24px",
            padding: "32px",
            maxWidth: "600px",
            width: "100%",
            maxHeight: "90vh",
            overflowY: "auto",
            position: "relative",
            boxShadow: "0 30px 80px rgba(0, 0, 0, 0.25)",
          }}
        >
          <button
            onClick={onClose}
            style={{
              position: "absolute",
              top: "16px",
              right: "20px",
              fontSize: "20px",
              background: "none",
              border: "none",
              color: "var(--gray)",
              cursor: "pointer",
            }}
          >
            <i className="fas fa-times"></i>
          </button>

          <h3 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "8px", color: "var(--black)" }}>
            Submit a Quote
          </h3>
          <p style={{ fontSize: "14px", color: "var(--gray)", marginBottom: "20px" }}>
            Provide your details and offer for request: <strong>{requestTitle}</strong>
          </p>

          <form ref={formRef} onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* نام و نام خانوادگی */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div className="form-group">
                <label className="form-label fw-semibold">Name <span className="text-danger">*</span></label>
                <input
                  type="text"
                  className="form-control"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label fw-semibold">Last Name <span className="text-danger">*</span></label>
                <input
                  type="text"
                  className="form-control"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* ایمیل و تلفن */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div className="form-group">
                <label className="form-label fw-semibold">Email <span className="text-danger">*</span></label>
                <input
                  type="email"
                  className="form-control"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label fw-semibold">Phone</label>
                <input
                  type="tel"
                  className="form-control"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* مقدار و قیمت */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div className="form-group">
                <label className="form-label fw-semibold">Offer Quantity</label>
                <input
                  type="number"
                  className="form-control"
                  name="quantity"
                  placeholder="e.g. 1000"
                  value={formData.quantity}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label className="form-label fw-semibold">Offered Price</label>
                <input
                  type="text"
                  className="form-control"
                  name="offeredPrice"
                  placeholder="USD"
                  value={formData.offeredPrice}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* توضیحات */}
            <div className="form-group">
              <label className="form-label fw-semibold">Message</label>
              <textarea
                className="form-control"
                rows="3"
                name="message"
                placeholder="Describe your offer..."
                value={formData.message}
                onChange={handleChange}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                padding: "12px",
                background: "var(--primary)",
                color: "white",
                border: "none",
                borderRadius: "12px",
                fontWeight: 600,
                fontSize: "16px",
                cursor: "pointer",
                marginTop: "8px",
              }}
            >
              {loading ? "Submitting..." : "Submit Quote"}
            </button>
          </form>
        </div>
      </div>

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        redirectUrl={pathname}
      />
    </>
  );
}