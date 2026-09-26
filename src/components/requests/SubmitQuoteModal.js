// src/components/requests/SubmitQuoteModal.js
"use client";

import { useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { toast } from "react-toastify";
import LoginModal from "@/components/ui/LoginModal";

export default function SubmitQuoteModal({
  isOpen,
  onClose,
  requestId,
  buyerId,
  requestTitle,
  permission,
}) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [permissionModal, setPermissionModal] = useState(null); // ✅ مودال پیام مجوز
  const formRef = useRef(null);

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

    // ✅ بررسی مجوز قبل از ارسال
    if (!session) {
      setIsLoginModalOpen(true);
      return;
    }

    if (permission && !permission.allowed) {
      // نمایش مودال پیام مجوز
      if (permission.reason === "login_required") {
        setIsLoginModalOpen(true);
      } else {
        setPermissionModal({
          icon:
            permission.reason === "quota_exhausted"
              ? "fa-hourglass-end"
              : "fa-crown",
          title:
            permission.reason === "quota_exhausted"
              ? "Monthly quota exhausted"
              : "Upgrade your plan",
          subtitle:
            permission.reason === "quota_exhausted"
              ? `You've used ${permission.used || 0} of ${permission.limit || 0} monthly inquiries. Upgrade your plan or wait until next month.`
              : `Your current plan (${permission.currentPlan || "Basic"}) doesn't allow sending quotes. Please upgrade to continue.`,
          buttonText:
            permission.reason === "quota_exhausted"
              ? "Upgrade Plan"
              : "View Plans",
          buttonLink: "/plans",
          buttonClass:
            permission.reason === "quota_exhausted"
              ? "btn-blur-upgrade"
              : "btn-blur-upgrade",
        });
      }
      return;
    }

    setLoading(true);
    try {
      const payload = {
        requestId,
        buyerId,
        quantity: formData.quantity ? parseInt(formData.quantity) : null,
        offeredPrice: formData.offeredPrice
          ? parseFloat(formData.offeredPrice)
          : null,
        message:
          formData.message || "Interested in fulfilling this request.",
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

          <h3
            style={{
              fontSize: "20px",
              fontWeight: 700,
              marginBottom: "8px",
              color: "var(--black)",
            }}
          >
            Submit a Quote
          </h3>
          <p
            style={{
              fontSize: "14px",
              color: "var(--gray)",
              marginBottom: "20px",
            }}
          >
            Provide your details and offer for request:{" "}
            <strong>{requestTitle}</strong>
          </p>

          <form
            ref={formRef}
            onSubmit={handleSubmit}
            style={{ display: "flex", flexDirection: "column", gap: "16px" }}
          >
            {/* نام و نام خانوادگی */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "16px",
              }}
            >
              <div className="form-group">
                <label className="form-label fw-semibold">
                  Name <span className="text-danger">*</span>
                </label>
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
                <label className="form-label fw-semibold">
                  Last Name <span className="text-danger">*</span>
                </label>
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
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "16px",
              }}
            >
              <div className="form-group">
                <label className="form-label fw-semibold">
                  Email <span className="text-danger">*</span>
                </label>
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
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "16px",
              }}
            >
              <div className="form-group">
                <label className="form-label fw-semibold">
                  Offer Quantity
                </label>
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
                <label className="form-label fw-semibold">
                  Offered Price
                </label>
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
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? "Submitting..." : "Submit Quote"}
            </button>
          </form>
        </div>
      </div>

      {/* ✅ مودال لاگین */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        redirectUrl={pathname}
      />

      {/* ✅ مودال پیام مجوز (Upgrade / Quota) */}
      {permissionModal && (
        <div
          className="modal-overlay"
          onClick={() => setPermissionModal(null)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.6)",
            backdropFilter: "blur(6px)",
            zIndex: 10000, // ✅ بالاتر از SubmitQuoteModal
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "white",
              borderRadius: "20px",
              padding: "28px 24px",
              maxWidth: "420px",
              width: "100%",
              textAlign: "center",
              boxShadow: "0 30px 80px rgba(0, 0, 0, 0.25)",
              position: "relative",
            }}
          >
            <button
              onClick={() => setPermissionModal(null)}
              style={{
                position: "absolute",
                top: "12px",
                right: "16px",
                background: "none",
                border: "none",
                fontSize: "18px",
                color: "var(--gray)",
                cursor: "pointer",
              }}
            >
              <i className="fas fa-times"></i>
            </button>

            <div
              style={{
                width: "56px",
                height: "56px",
                margin: "0 auto 16px",
                borderRadius: "50%",
                display: "grid",
                placeItems: "center",
                fontSize: "24px",
                background: "linear-gradient(135deg, #fff4dd, #fde2b5)",
                color: "#d97706",
              }}
            >
              <i className={`fas ${permissionModal.icon}`}></i>
            </div>

            <h3
              style={{
                fontSize: "18px",
                fontWeight: 800,
                color: "#13251f",
                margin: "0 0 8px 0",
                fontFamily: "Manrope, sans-serif",
              }}
            >
              {permissionModal.title}
            </h3>
            <p
              style={{
                fontSize: "13px",
                color: "#71807b",
                lineHeight: 1.6,
                margin: "0 0 20px 0",
              }}
            >
              {permissionModal.subtitle}
            </p>

            <Link
              href={permissionModal.buttonLink}
              className={permissionModal.buttonClass}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "12px 24px",
                borderRadius: "50px",
                fontSize: "13px",
                fontWeight: 700,
                textDecoration: "none",
                background: "linear-gradient(135deg, #f59e0b, #d97706)",
                color: "white",
                boxShadow: "0 8px 20px rgba(245, 158, 11, 0.25)",
              }}
            >
              {permissionModal.buttonText}{" "}
              <i className="fas fa-arrow-right"></i>
            </Link>
          </div>
        </div>
      )}
    </>
  );
}