// src/components/dashboard/PushNotificationPrompt.js
"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  isPushSupported,
  getNotificationPermission,
  subscribeToPush,
} from "@/lib/pushClient";

const DISMISSED_KEY = "push_prompt_dismissed";

export default function PushNotificationPrompt() {
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // اگر قبلاً بسته شده، نشان نده
    if (localStorage.getItem(DISMISSED_KEY) === "true") return;

    // اگر پشتیبانی نمی‌شود، نشان نده
    if (!isPushSupported()) return;

    // اگر permission قبلاً گرفته شده (granted/denied)، نشان نده
    const permission = getNotificationPermission();
    if (permission !== "default") return;

    // ۲ ثانیه تأخیر برای اینکه صفحه کامل لود شود
    const timer = setTimeout(() => setShow(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleEnable = async () => {
    setLoading(true);
    try {
      await subscribeToPush();
      toast.success("Notifications enabled! You'll now receive updates.");
      setShow(false);
    } catch (err) {
      toast.error(err.message || "Failed to enable notifications");
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem(DISMISSED_KEY, "true");
    setShow(false);
  };

  if (!show) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 20,
        right: 20,
        maxWidth: 380,
        width: "calc(100vw - 40px)",
        background: "white",
        borderRadius: 16,
        boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
        border: "1px solid var(--gray-light)",
        padding: 20,
        zIndex: 9999,
        display: "flex",
        gap: 14,
        alignItems: "flex-start",
        animation: "slideInUp 0.3s ease",
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          background: "var(--primary-light, #eaf7f1)",
          color: "var(--primary)",
          display: "grid",
          placeItems: "center",
          fontSize: 20,
          flexShrink: 0,
        }}
      >
        <i className="fas fa-bell"></i>
      </div>

      <div style={{ flex: 1 }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 800,
            color: "var(--black)",
            marginBottom: 4,
          }}
        >
          Stay Updated
        </div>
        <div
          style={{
            fontSize: 12,
            color: "var(--gray)",
            lineHeight: 1.5,
            marginBottom: 12,
          }}
        >
          Get instant notifications about tickets, inquiries, and important
          updates — even when you're away.
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            onClick={handleEnable}
            disabled={loading}
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              border: 0,
              background: "linear-gradient(135deg, #13795b, #1d9a71)",
              color: "white",
              fontSize: 12,
              fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm"></span>
                Enabling...
              </>
            ) : (
              <>
                <i className="fas fa-check"></i>
                Enable Notifications
              </>
            )}
          </button>

          <button
            onClick={handleDismiss}
            disabled={loading}
            style={{
              padding: "8px 14px",
              borderRadius: 8,
              border: "1px solid var(--gray-light)",
              background: "white",
              color: "var(--gray)",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Maybe Later
          </button>
        </div>
      </div>

      <button
        onClick={handleDismiss}
        style={{
          background: "transparent",
          border: 0,
          color: "var(--gray)",
          cursor: "pointer",
          fontSize: 14,
          padding: 0,
          lineHeight: 1,
        }}
      >
        <i className="fas fa-times"></i>
      </button>

      <style jsx>{`
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}