// src/components/dashboard/PushNotificationToggle.js
"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  isPushSupported,
  getNotificationPermission,
  getExistingSubscription,
  subscribeToPush,
  unsubscribeFromPush,
} from "@/lib/pushClient";

export default function PushNotificationToggle() {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [supported, setSupported] = useState(true);
  const [permission, setPermission] = useState("default");

  useEffect(() => {
    const check = async () => {
      if (!isPushSupported()) {
        setSupported(false);
        setLoading(false);
        return;
      }

      const perm = getNotificationPermission();
      setPermission(perm);

      const sub = await getExistingSubscription();
      setEnabled(!!sub && perm === "granted");
      setLoading(false);
    };
    check();
  }, []);

  const handleToggle = async () => {
    setLoading(true);
    try {
      if (enabled) {
        await unsubscribeFromPush();
        setEnabled(false);
        toast.success("Notifications disabled");
      } else {
        await subscribeToPush();
        setEnabled(true);
        setPermission("granted");
        toast.success("Notifications enabled!");
      }
    } catch (err) {
      toast.error(err.message || "Failed to toggle notifications");
    } finally {
      setLoading(false);
    }
  };

  if (!supported) {
    return (
      <div
        style={{
          padding: 16,
          background: "#f9fbfa",
          borderRadius: 12,
          border: "1px solid #eef2f0",
          fontSize: 13,
          color: "var(--gray)",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <i className="fas fa-info-circle"></i>
        Push notifications are not supported on this browser.
      </div>
    );
  }

  return (
    <div
      style={{
        padding: 20,
        background: "#f9fbfa",
        borderRadius: 12,
        border: "1px solid #eef2f0",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 16,
        flexWrap: "wrap",
      }}
    >
      <div style={{ flex: 1, minWidth: 200 }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: "var(--black)",
            marginBottom: 4,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <i className="fas fa-bell" style={{ color: "var(--primary)" }}></i>
          Push Notifications
        </div>
        <div
          style={{
            fontSize: 12,
            color: "var(--gray)",
            lineHeight: 1.5,
          }}
        >
          Receive browser notifications about tickets, inquiries, and
          important updates — even when the site is closed.
        </div>

        {permission === "denied" && (
          <div
            style={{
              marginTop: 8,
              padding: "8px 12px",
              background: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: 8,
              fontSize: 11,
              color: "#991b1b",
            }}
          >
            <i className="fas fa-exclamation-triangle me-1"></i>
            You previously denied notifications. To enable, please reset
            permission from your browser settings (lock icon in address bar).
          </div>
        )}
      </div>

      <button
        onClick={handleToggle}
        disabled={loading || permission === "denied"}
        style={{
          width: 56,
          height: 30,
          borderRadius: 50,
          background: enabled ? "var(--primary)" : "#cbd5d1",
          border: 0,
          position: "relative",
          cursor:
            loading || permission === "denied" ? "not-allowed" : "pointer",
          transition: "background 0.2s ease",
          opacity: permission === "denied" ? 0.5 : 1,
          flexShrink: 0,
        }}
      >
        {loading ? (
          <span
            className="spinner-border spinner-border-sm"
            style={{
              color: "white",
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: 14,
              height: 14,
            }}
          ></span>
        ) : (
          <span
            style={{
              position: "absolute",
              top: 3,
              left: enabled ? 29 : 3,
              width: 24,
              height: 24,
              borderRadius: "50%",
              background: "white",
              transition: "left 0.2s ease",
              boxShadow: "0 2px 4px rgba(0,0,0,0.15)",
            }}
          />
        )}
      </button>
    </div>
  );
}