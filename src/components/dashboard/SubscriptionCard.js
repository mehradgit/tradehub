// src/components/dashboard/SubscriptionCard.js
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

const PLAN_META = {
  Basic:  { cls: "basic",  icon: "fa-leaf" },
  Bronze: { cls: "bronze", icon: "fa-medal" },
  Silver: { cls: "silver", icon: "fa-award" },
  Gold:   { cls: "gold",   icon: "fa-crown" },
  FREE:   { cls: "basic",  icon: "fa-leaf" },
};

export default function SubscriptionCard() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState(false);

  useEffect(() => {
    fetch("/api/user/subscription")
      .then((res) => res.json())
      .then(setData)
      .catch(() => toast.error("Failed to load subscription"))
      .finally(() => setLoading(false));
  }, []);

  const handleActivateReserved = async () => {
    setActivating(true);
    try {
      const res = await fetch("/api/user/subscription/activate-reserved", {
        method: "POST",
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || "Activation failed");
      toast.success(result.message);
      window.dispatchEvent(new Event("plan-updated"));
      router.refresh();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setActivating(false);
    }
  };

  if (loading) {
    return (
      <div className="d-subscription" style={{ textAlign: "center", padding: 40 }}>
        <div className="spinner-border text-primary"></div>
      </div>
    );
  }

  if (!data) return null;

  const planName = data.plan?.name || "Basic";
  const planMeta = PLAN_META[planName] || PLAN_META.Basic;

  const formatDate = (date) =>
    new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  const daysRemaining = data.activeSubscription?.endDate
    ? Math.max(
        0,
        Math.ceil(
          (new Date(data.activeSubscription.endDate) - Date.now()) /
            (1000 * 60 * 60 * 24)
        )
      )
    : 0;

  const usage = data.usage || {};
  const products = data.products || { count: 0, limit: 0 };
  const profileImages = data.profileImages || { count: 0, limit: 0 };

  // Helper: percentage + colour
  const getProgress = (used, limit) => {
    if (limit === -1) return { percent: 100, isUnlimited: true };
    if (!limit) return { percent: 0, isUnlimited: false };
    return {
      percent: Math.min((used / limit) * 100, 100),
      isUnlimited: false,
    };
  };

  const renderQuota = (label, icon, used, limit, gradient) => {
    const { percent, isUnlimited } = getProgress(used, limit);
    return (
      <div className="d-quota-item">
        <div className="d-quota-head">
          <span className="d-quota-label">
            <i className={`fas ${icon}`}></i> {label}
          </span>
          <span className="d-quota-count">
            <strong>{used}</strong> / {isUnlimited ? "∞" : limit}
          </span>
        </div>
        <div className="d-quota-bar">
          <div
            className="d-quota-fill"
            style={{ width: `${percent}%`, background: gradient }}
          ></div>
        </div>
      </div>
    );
  };

  const renderLimit = (label, icon, iconCls, used, limit) => {
    const { percent, isUnlimited } = getProgress(used, limit);
    return (
      <div className="d-limit-card">
        <div className={`d-limit-icon ${iconCls}`}>
          <i className={`fas ${icon}`}></i>
        </div>
        <div className="d-limit-info">
          <div className="d-limit-label">{label}</div>
          <div className="d-limit-value">
            {used} <span>/ {isUnlimited ? "∞" : limit}</span>
          </div>
          {!isUnlimited && (
            <div className="d-limit-mini-bar">
              <div
                className="d-limit-mini-fill"
                style={{
                  width: `${percent}%`,
                  background: "linear-gradient(90deg, #0f9e6e, #14b881)",
                }}
              ></div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="d-subscription">
      {/* Header */}
      <div className="d-sub-head">
        <div className="d-sub-head-left">
          <div className="d-sub-head-icon"><i className="fas fa-crown"></i></div>
          <div>
            <div className="d-sub-head-title">Your Subscription</div>
            <div className="d-sub-head-sub">
              Manage your plan and track monthly usage
            </div>
          </div>
        </div>
        <Link href="/plans" className="btn-upgrade">
          <i className="fas fa-arrow-up"></i> Upgrade Plan
        </Link>
      </div>

      {/* Plan + Expiry */}
      <div className="d-sub-plan-row">
        <div className="d-sub-plan-box">
          <span className={`d-sub-plan-badge ${planMeta.cls}`}>
            <i className={`fas ${planMeta.icon}`}></i> {planName}
          </span>
          <div className="d-sub-plan-name">{planName} Plan</div>
        </div>
        <div className="d-sub-expiry-box">
          <div className="d-sub-expiry-label">
            <i className="far fa-calendar"></i> Expires On
          </div>
          <div className="d-sub-expiry-date">
            {data.activeSubscription
              ? formatDate(data.activeSubscription.endDate)
              : "—"}
          </div>
          {data.activeSubscription && (
            <div className="d-sub-expiry-days">
              <i className="fas fa-clock"></i> {daysRemaining} days remaining
            </div>
          )}
        </div>
      </div>

      {/* Monthly Quotas */}
      {usage.requests || usage.inquiries || usage.quotes ? (
        <>
          <div className="d-sub-section-title">
            <i className="fas fa-chart-simple"></i> Monthly Quotas
          </div>
          <div className="d-quota-list">
            {usage.requests &&
              renderQuota(
                "Buying Requests",
                "fa-cart-shopping",
                usage.requests.used,
                usage.requests.limit,
                "linear-gradient(90deg, #6366f1, #8b5cf6)"
              )}
            {usage.inquiries &&
              renderQuota(
                "Product Inquiries",
                "fa-envelope",
                usage.inquiries.used,
                usage.inquiries.limit,
                "linear-gradient(90deg, #0f9e6e, #14b881)"
              )}
            {usage.quotes &&
              renderQuota(
                "Quotes",
                "fa-file-signature",
                usage.quotes.used,
                usage.quotes.limit,
                "linear-gradient(90deg, #f5b544, #e08900)"
              )}
          </div>
        </>
      ) : null}

      {/* Plan Limits */}
      <div className="d-sub-section-title">
        <i className="fas fa-sliders"></i> Plan Limits
      </div>
      <div className="d-limits-grid">
        {renderLimit(
          "Products",
          "fa-box",
          "green",
          products.count,
          products.limit
        )}
        {renderLimit(
          "Profile Images",
          "fa-user-circle",
          "rose",
          profileImages.count,
          profileImages.limit
        )}
      </div>

      {/* Reserved subscription */}
      {data.reservedSubscription && (
        <div
          style={{
            marginTop: 20,
            padding: 16,
            background: "var(--d-accent-light)",
            borderRadius: 12,
            border: "1px solid #c7d2fe",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div style={{ fontSize: 13, color: "#4338ca", fontWeight: 600 }}>
            <i className="fas fa-clock me-2"></i>
            Reserved Plan: <strong>{data.reservedSubscription.plan?.name}</strong>
          </div>
          <button
            onClick={handleActivateReserved}
            disabled={activating}
            className="btn-upgrade"
            style={{ background: "linear-gradient(135deg, #6366f1, #4f46e5)" }}
          >
            {activating ? "Activating..." : "Activate Now"}
          </button>
        </div>
      )}
    </div>
  );
}