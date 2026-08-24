// src/components/ui/ConnectModal.js
"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";

export default function ConnectModal({
  isOpen,
  onClose,
  supplierId,     // برای حالت محصول
  supplierName,
  productId,      // برای حالت محصول
  targetUserId,   // برای حالت پروفایل
  targetName,     // برای حالت پروفایل
  mode = "product", // "product" یا "profile"
}) {
  const { data: session } = useSession();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!message.trim()) {
      toast.warning("Please enter a message");
      return;
    }

    setLoading(true);
    try {
      let url, payload;

      if (mode === "product") {
        // ارسال درخواست محصول
        url = "/api/product-inquiries";
        payload = {
          productId,
          supplierId,
          message: message.trim(),
        };
      } else {
        // ارسال پیام مستقیم به کاربر
        url = "/api/messages";
        payload = {
          receiverId: targetUserId,
          content: message.trim(),
        };
      }

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to send message");
      }

      toast.success("Message sent successfully!");
      setMessage("");
      onClose();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.6)",
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
          backgroundColor: "white",
          borderRadius: "24px",
          padding: "32px",
          maxWidth: "500px",
          width: "100%",
          position: "relative",
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

        <h3 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "8px" }}>
          {mode === "product"
            ? `Send Request to ${supplierName || "Supplier"}`
            : `Send Message to ${targetName || "User"}`}
        </h3>
        <p style={{ fontSize: "14px", color: "var(--gray)", marginBottom: "20px" }}>
          {mode === "product"
            ? "Ask about product details, pricing, or availability."
            : "Write a direct message to this company."}
        </p>

        <form onSubmit={handleSend}>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Your message..."
            rows="4"
            style={{
              width: "100%",
              padding: "12px 16px",
              border: "1px solid var(--gray-light)",
              borderRadius: "12px",
              fontSize: "14px",
              fontFamily: "inherit",
              resize: "vertical",
            }}
          />
          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "12px",
              marginTop: "16px",
              background: "var(--primary)",
              color: "white",
              border: "none",
              borderRadius: "12px",
              fontWeight: 600,
              fontSize: "16px",
              cursor: "pointer",
            }}
          >
            {loading ? "Sending..." : "Send Message"}
          </button>
        </form>
      </div>
    </div>
  );
}