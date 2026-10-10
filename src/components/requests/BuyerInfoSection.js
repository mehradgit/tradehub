// src/components/requests/BuyerInfoSection.js
"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { toast } from "react-toastify";
import CountryFlag from "@/components/ui/CountryFlag";
import LoginModal from "@/components/ui/LoginModal";
import {
  AVATAR_PLACEHOLDER,
  handleImageError,
  isRealImageUrl,
} from "@/lib/imageHelpers";

export default function BuyerInfoSection({
  requestId,
  buyer,
  initialPermission,
  alreadyRevealed,
  shouldAutoReveal,
}) {
  const pathname = usePathname();
  const { data: session } = useSession();

  // ====== Initial state based on the server‌ data ======
  const [isRevealed, setIsRevealed] = useState(
    alreadyRevealed || shouldAutoReveal
  );
  const [loading, setLoading] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [permissionError, setPermissionError] = useState(null);

  const buyerName =
    buyer.companyName || buyer.name || "Anonymous Buyer";

  // ====== Reveal button click ======
  const handleRevealClick = () => {
    // 1. Guest → Login
    if (!session) {
      setIsLoginModalOpen(true);
      return;
    }

    // 2. Owner or admin → no confirmation
    if (
      initialPermission.reason === "owner" ||
      initialPermission.reason === "admin"
    ) {
      setIsRevealed(true);
      return;
    }

    // 3. If already revealed → no quota
    if (alreadyRevealed) {
      setIsRevealed(true);
      return;
    }

    // 4. If Basic or no quota → Upgrade
    if (!initialPermission.allowed) {
      setPermissionError(initialPermission);
      setIsUpgradeModalOpen(true);
      return;
    }

    // 5. Allowed → quota consumption confirmation modal
    setIsConfirmModalOpen(true);
  };

  // ====== Confirm quota consumption ======
  const handleConfirmReveal = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/requests/${requestId}/reveal-buyer`, {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok || !data.allowed) {
        if (data.reason === "login_required") {
          setIsLoginModalOpen(true);
        } else if (
          data.reason === "upgrade_required" ||
          data.reason === "quota_exhausted"
        ) {
          setPermissionError(data);
          setIsUpgradeModalOpen(true);
        } else {
          throw new Error("Failed to reveal buyer info");
        }
        return;
      }

      if (data.consumed) {
        toast.success("1 inquiry used from your monthly quota");
      }
      setIsRevealed(true);
      setIsConfirmModalOpen(false);
    } catch (err) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // ====== Upgrade / Quota modal content ======
  const upgradeContent = (() => {
    if (!permissionError) return null;
    const isQuota = permissionError.reason === "quota_exhausted";
    return {
      icon: isQuota ? "fa-hourglass-end" : "fa-crown",
      title: isQuota ? "Monthly quota exhausted" : "Upgrade your plan",
      subtitle: isQuota
        ? `You've used ${permissionError.used || 0} of ${permissionError.limit || 0} monthly inquiries. Upgrade your plan or wait until next month.`
        : `Your current plan (${permissionError.currentPlan || "Basic"}) doesn't allow viewing buyer information. Please upgrade to continue.`,
      buttonText: isQuota ? "Upgrade Plan" : "View Plans",
    };
  })();

  return (
    <>
      <div className="buyer-section">
        {/* The title is always displayed  */}
        <div className="buyer-section-title">
          <i className="fas fa-building"></i>
          Company Information
        </div>

        {isRevealed ? (
          /* ====== Revealed card ====== */
          <div className="buyer-card">
            <div className="buyer-avatar">
              <img
                src={isRealImageUrl(buyer.image || buyer.logo)
                  ? buyer.image || buyer.logo
                  : AVATAR_PLACEHOLDER}
                alt={buyerName}
                style={{
                  width: "100%",
                  height: "100%",
                  borderRadius: "50%",
                  objectFit: "cover",
                }}
                onError={(e) => handleImageError(e, AVATAR_PLACEHOLDER)}
              />
            </div>
            <div className="buyer-details">
              <h4>
                {buyerName}
                <span className="buyer-badge">
                  <i className="fas fa-check-circle"></i> Verified
                </span>
              </h4>
              <div className="sub">
                <CountryFlag countryCode={buyer.countryCode} size="16px" />{" "}
                {buyer.country || "—"} <span className="mx-2">·</span>{" "}
                <i className="fas fa-calendar-alt"></i> Member since{" "}
                {new Date(buyer.createdAt).getFullYear()}
              </div>
            </div>
            <Link
              href={
                buyer.profileNumber && buyer.slug
                  ? `/profiles/${buyer.profileNumber}/${buyer.slug}`
                  : "#"
              }
              className="btn btn-secondary"
              style={{ whiteSpace: "nowrap" }}
              aria-disabled={!buyer.profileNumber || !buyer.slug}
            >
              Company Information
            </Link>
          </div>
        ) : (
          /* ====== Blurred card + Reveal button ====== */
          <div className="blurred-wrapper">
            <div className="blurred-content">
              <div className="buyer-card">
                <div className="buyer-avatar">
                  <i className="fas fa-user-tie"></i>
                </div>
                <div className="buyer-details">
                  <h4>
                    ████████
                    <span className="buyer-badge">
                      <i className="fas fa-check-circle"></i> Verified
                    </span>
                  </h4>
                  <div className="sub">
                    ████ <span className="mx-2">·</span> ████████
                  </div>
                </div>
                <button className="btn btn-secondary" disabled>
                  Company Information
                </button>
              </div>
            </div>

            <div className="blurred-overlay">
              <div className="blurred-overlay-card compact">
                <div className="blurred-icon">
                  <i className="fas fa-building"></i>
                </div>
                <h3 className="blurred-title">Reveal Buyer Info</h3>
                <button
                  type="button"
                  onClick={handleRevealClick}
                  disabled={loading}
                  className="btn-blur-upgrade"
                  style={{ border: "none", cursor: "pointer" }}
                >
                  {loading ? (
                    <span className="spinner-border spinner-border-sm"></span>
                  ) : (
                    <>
                      <i className="fas fa-eye"></i> Reveal (1 quota)
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ====== Login modal ====== */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        redirectUrl={pathname}
      />

      {/* ====== Upgrade modal ====== */}
      {isUpgradeModalOpen && upgradeContent && (
        <ModalOverlay onClose={() => setIsUpgradeModalOpen(false)}>
          <IconCircle icon={upgradeContent.icon} variant="warning" />
          <h3 style={modalTitleStyle}>{upgradeContent.title}</h3>
          <p style={modalSubtitleStyle}>{upgradeContent.subtitle}</p>
          <Link href="/plans" style={primaryLinkStyle}>
            {upgradeContent.buttonText} <i className="fas fa-arrow-right"></i>
          </Link>
        </ModalOverlay>
      )}

      {/* ====== Reveal confirmation modal ====== */}
      {isConfirmModalOpen && (
        <ModalOverlay onClose={() => !loading && setIsConfirmModalOpen(false)}>
          <IconCircle icon="fa-info-circle" variant="info" />
          <h3 style={modalTitleStyle}>Reveal Buyer Info?</h3>
          <p style={modalSubtitleStyle}>
            This action will consume <strong>1 unit</strong> from your monthly
            inquiry quota. Continue?
          </p>
          <div
            style={{
              display: "flex",
              gap: 10,
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <button
              type="button"
              onClick={() => setIsConfirmModalOpen(false)}
              disabled={loading}
              style={secondaryBtnStyle}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmReveal}
              disabled={loading}
              style={primaryBtnStyle}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  Processing...
                </>
              ) : (
                <>
                  Confirm <i className="fas fa-check ms-1"></i>
                </>
              )}
            </button>
          </div>
        </ModalOverlay>
      )}
    </>
  );
}

// ====== Helper components‌ ======
function ModalOverlay({ children, onClose }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0, 0, 0, 0.6)",
        backdropFilter: "blur(6px)",
        zIndex: 10000,
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
          maxWidth: "440px",
          width: "100%",
          textAlign: "center",
          boxShadow: "0 30px 80px rgba(0, 0, 0, 0.25)",
          position: "relative",
        }}
      >
        {children}
      </div>
    </div>
  );
}

function IconCircle({ icon, variant }) {
  const v =
    variant === "warning"
      ? {
        background: "linear-gradient(135deg, #fff4dd, #fde2b5)",
        color: "#d97706",
      }
      : {
        background: "linear-gradient(135deg, #eaf7f1, #d1ede0)",
        color: "#13795b",
      };
  return (
    <div
      style={{
        width: "56px",
        height: "56px",
        margin: "0 auto 16px",
        borderRadius: "50%",
        display: "grid",
        placeItems: "center",
        fontSize: "24px",
        background: v.background,
        color: v.color,
      }}
    >
      <i className={`fas ${icon}`}></i>
    </div>
  );
}

const modalTitleStyle = {
  fontSize: "18px",
  fontWeight: 800,
  color: "#13251f",
  margin: "0 0 8px 0",
  fontFamily: "Manrope, sans-serif",
};

const modalSubtitleStyle = {
  fontSize: "13px",
  color: "#71807b",
  lineHeight: 1.6,
  margin: "0 0 20px 0",
};

const primaryLinkStyle = {
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
};

const primaryBtnStyle = {
  padding: "12px 24px",
  borderRadius: "50px",
  fontSize: "13px",
  fontWeight: 700,
  border: "none",
  cursor: "pointer",
  background: "linear-gradient(135deg, #13795b, #1d9a71)",
  color: "white",
  boxShadow: "0 8px 20px rgba(19, 121, 91, 0.25)",
  display: "inline-flex",
  alignItems: "center",
};

const secondaryBtnStyle = {
  padding: "12px 24px",
  borderRadius: "50px",
  fontSize: "13px",
  fontWeight: 700,
  border: "1px solid #e2e9e5",
  cursor: "pointer",
  background: "white",
  color: "#33413d",
};