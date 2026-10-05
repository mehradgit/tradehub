// src/components/requests/ContactBuyerButton.js
"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { toast } from "react-toastify";
import LoginModal from "@/components/ui/LoginModal";

export default function ContactBuyerButton({ requestId, ownerId }) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();

  const [loading, setLoading] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [pendingPermission, setPendingPermission] = useState(null);

  // ====== Button click ======
  const handleClick = async () => {
    // 1. Guest → Login
    if (!session) {
      setIsLoginModalOpen(true);
      return;
    }

    // 2. Request owner → go straight through without quota
    if (session.user.id === ownerId) {
      await fetchContactAndGo();
      return;
    }

    // 3. Get the status from the API (no quota consumed - check only)
    setLoading(true);
    try {
      const res = await fetch(`/api/requests/${requestId}/contact-check`);
      const data = await res.json();

      if (res.status === 401) {
        setIsLoginModalOpen(true);
        return;
      }

      if (!data.allowed) {
        setPendingPermission(data);
        setIsUpgradeModalOpen(true);
        return;
      }

      // 4. If it consumes quota → confirmation modal
      if (data.consumeQuota) {
        setIsConfirmModalOpen(true);
      } else {
        // 5. Allowed with no quota → go straight through
        await fetchContactAndGo();
      }
    } catch (err) {
      toast.error("Failed to check access");
    } finally {
      setLoading(false);
    }
  };

  // ====== Fetch contact info + navigate ======
  const fetchContactAndGo = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/requests/${requestId}/contact`, {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.reason === "login_required") {
          setIsLoginModalOpen(true);
          return;
        }
        if (
          data.reason === "upgrade_required" ||
          data.reason === "quota_exhausted"
        ) {
          setPendingPermission(data);
          setIsUpgradeModalOpen(true);
          return;
        }
        throw new Error(data.message || "Failed to fetch contact info");
      }

      if (data.consumed) {
        toast.success("1 inquiry used from your monthly quota");
      }

      setIsConfirmModalOpen(false);
      router.push(data.contactInfo.profileUrl);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  // ====== Upgrade / Quota modal content ======
  const upgradeContent = (() => {
    if (!pendingPermission) return null;
    const isQuota = pendingPermission.reason === "quota_exhausted";
    return {
      icon: isQuota ? "fa-hourglass-end" : "fa-crown",
      title: isQuota ? "Monthly quota exhausted" : "Upgrade your plan",
      subtitle: isQuota
        ? `You've used ${pendingPermission.used || 0} of ${pendingPermission.limit || 0} monthly inquiries. Upgrade your plan or wait until next month.`
        : `Your current plan (${pendingPermission.currentPlan || "Basic"}) doesn't allow viewing contact information. Please upgrade to continue.`,
      buttonText: isQuota ? "Upgrade Plan" : "View Plans",
    };
  })();

  return (
    <>
      <button
        type="button"
        className="btn btn-secondary"
        style={{ whiteSpace: "nowrap" }}
        onClick={handleClick}
        disabled={loading}
      >
        {loading ? (
          <span className="spinner-border spinner-border-sm me-2"></span>
        ) : (
          <i className="fas fa-building me-2"></i>
        )}
        Company Information
      </button>

      {/* Login modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        redirectUrl={pathname}
      />

      {/* Upgrade / Quota modal */}
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

      {/* Quota consumption confirmation modal */}
      {isConfirmModalOpen && (
        <ModalOverlay onClose={() => !loading && setIsConfirmModalOpen(false)}>
          <IconCircle icon="fa-info-circle" variant="info" />
          <h3 style={modalTitleStyle}>Use 1 inquiry?</h3>
          <p style={modalSubtitleStyle}>
            This action will consume <strong>1 unit</strong> from your monthly
            inquiry quota. Continue to view the buyer&apos;s company
            information?
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
              onClick={fetchContactAndGo}
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

// ====== Styles‌ ======
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