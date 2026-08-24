// src/components/ui/ConnectModal.js
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";

export default function ConnectModal({ isOpen, onClose, supplierId, supplierName, productId }) {
  const { data: session } = useSession();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [existingMessages, setExistingMessages] = useState([]);

  // دریافت پیام‌های قبلی (اختیاری)
  useEffect(() => {
    if (isOpen && session?.user && supplierId) {
      fetch(`/api/messages?userId=${supplierId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.messages) {
            setExistingMessages(data.messages);
          }
        })
        .catch(console.error);
    }
  }, [isOpen, session, supplierId]);

  if (!isOpen) return null;

  const handleSend = async (e) => {
    e.preventDefault();
    if (!message.trim()) {
      toast.warning("Please enter a message");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiverId: supplierId,
          content: message.trim(),
          productId: productId || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to send message");

      toast.success("Message sent successfully!");
      setMessage("");
      // اضافه کردن پیام به لیست موجود
      setExistingMessages((prev) => [
        ...prev,
        {
          ...data.data,
          sender: { name: session.user.name, image: session.user.image },
        },
      ]);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="connect-modal-overlay"
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
        className="connect-modal"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff",
          borderRadius: "24px",
          padding: "32px",
          maxWidth: "500px",
          width: "100%",
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: "0 30px 80px rgba(0,0,0,0.25)",
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
            color: "#7a6e64",
            cursor: "pointer",
            padding: "4px 8px",
            borderRadius: "8px",
          }}
        >
          <i className="fas fa-times"></i>
        </button>

        <h3 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "8px" }}>
          Connect with {supplierName || "Supplier"}
        </h3>
        <p style={{ color: "#7a6e64", fontSize: "14px", marginBottom: "20px" }}>
          Send a message to the supplier to discuss this product.
        </p>

        {/* نمایش پیام‌های قبلی */}
        {existingMessages.length > 0 && (
          <div
            style={{
              maxHeight: "200px",
              overflowY: "auto",
              marginBottom: "16px",
              border: "1px solid #e8e2da",
              borderRadius: "12px",
              padding: "12px",
              background: "#f9f7f4",
            }}
          >
            {existingMessages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  display: "flex",
                  justifyContent: msg.senderId === supplierId ? "flex-start" : "flex-end",
                  marginBottom: "8px",
                }}
              >
                <div
                  style={{
                    maxWidth: "80%",
                    padding: "8px 14px",
                    borderRadius: "12px",
                    background: msg.senderId === supplierId ? "#fff" : "#e85d3a",
                    color: msg.senderId === supplierId ? "#1e1916" : "#fff",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
                    fontSize: "14px",
                    wordWrap: "break-word",
                  }}
                >
                  {msg.content}
                </div>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleSend}>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Write your message here..."
            rows="4"
            style={{
              width: "100%",
              padding: "12px 16px",
              border: "1.5px solid #e8e2da",
              borderRadius: "12px",
              fontSize: "14px",
              fontFamily: "Inter, sans-serif",
              resize: "vertical",
              outline: "none",
              transition: "all 0.3s ease",
            }}
            onFocus={(e) => {
              e.target.style.borderColor = "#e85d3a";
              e.target.style.boxShadow = "0 0 0 3px rgba(232, 93, 58, 0.1)";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "#e8e2da";
              e.target.style.boxShadow = "none";
            }}
          />
          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "12px",
              background: "#e85d3a",
              color: "white",
              border: "none",
              borderRadius: "12px",
              fontSize: "16px",
              fontWeight: 600,
              cursor: "pointer",
              marginTop: "12px",
              transition: "all 0.3s ease",
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? "Sending..." : "Send Message"}
          </button>
        </form>
      </div>
    </div>
  );
}