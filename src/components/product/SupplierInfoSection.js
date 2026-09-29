// src/components/product/SupplierInfoSection.js
"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { toast } from "react-toastify";
import CountryFlag from "@/components/ui/CountryFlag";
import LoginModal from "@/components/ui/LoginModal";
import ConnectModal from "@/components/ui/ConnectModal";
export default function SupplierInfoSection({
  productId,
  supplier,
  initialPermission,
  alreadyRevealed,
  shouldAutoReveal,
  onRevealSuccess, // callback برای اطلاع به ProductDetail
}) {
  const pathname = usePathname();
  const { data: session } = useSession();

  const [isRevealed, setIsRevealed] = useState(
    alreadyRevealed || shouldAutoReveal,
  );
  const [loading, setLoading] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [permissionError, setPermissionError] = useState(null);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);

  const handleRevealClick = () => {
    if (!session) {
      setIsLoginModalOpen(true);
      return;
    }

    if (
      initialPermission.reason === "owner" ||
      initialPermission.reason === "admin"
    ) {
      setIsRevealed(true);
      onRevealSuccess?.();
      return;
    }

    if (alreadyRevealed) {
      setIsRevealed(true);
      onRevealSuccess?.();
      return;
    }

    if (!initialPermission.allowed) {
      setPermissionError(initialPermission);
      setIsUpgradeModalOpen(true);
      return;
    }

    setIsConfirmModalOpen(true);
  };

  const handleConfirmReveal = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/products/${productId}/reveal-supplier`, {
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
          throw new Error("Failed to reveal supplier info");
        }
        return;
      }

      if (data.consumed) {
        toast.success("1 inquiry used from your monthly quota");
      }
      setIsRevealed(true);
      setIsConfirmModalOpen(false);
      onRevealSuccess?.();
    } catch (err) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const upgradeContent = (() => {
    if (!permissionError) return null;
    const isQuota = permissionError.reason === "quota_exhausted";
    return {
      icon: isQuota ? "fa-hourglass-end" : "fa-crown",
      title: isQuota ? "Monthly quota exhausted" : "Upgrade your plan",
      subtitle: isQuota
        ? `You've used ${permissionError.used || 0} of ${permissionError.limit || 0} monthly inquiries. Upgrade your plan or wait until next month.`
        : `Your current plan (${permissionError.currentPlan || "Basic"}) doesn't allow viewing supplier information. Please upgrade to continue.`,
      buttonText: isQuota ? "Upgrade Plan" : "View Plans",
    };
  })();

  return (
    <>
      <div className="supplier-card-wrapper">
        {isRevealed ? (
          /* ====== کارت باز ====== */
          <div className="supplier-card">
            <div className="supplier-card-cover">
              <img src={supplier.coverImage} alt="Cover" />
              <div className="supplier-logo-wrapper">
                <img src={supplier.logo} alt={supplier.name} />
              </div>
            </div>
            <div className="supplier-card-body">
              <div className="supplier-card-header">
                <h3 className="supplier-name">{supplier.name}</h3>
                <p className="supplier-website">{supplier.website}</p>
              </div>
              <div className="supplier-divider"></div>
              <div className="supplier-details-grid">
                <div className="supplier-detail-item">
                  <span className="detail-label">Founding</span>
                  <span className="detail-value">{supplier.foundingYear}</span>
                </div>
                <div className="supplier-detail-item">
                  <span className="detail-label">Country</span>
                  <div className="detail-value-with-flag">
                    <CountryFlag
                      countryCode={supplier.countryCode || supplier.country}
                      size="20px"
                    />
                    <span>{supplier.country}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="supplier-actions">
              <Link
                href={`/profiles/${supplier.profileNumber}/${supplier.slug}`}
                className="company-info-link"
              >
                Company information
              </Link>
              <button
                className="connect-btn"
                onClick={() => setIsConnectModalOpen(true)}
              >
                Connect with Us
              </button>
            </div>
          </div>
        ) : (
          /* ====== کارت بلور ====== */
          <div className="blurred-wrapper">
            <div className="blurred-content">
              <div className="supplier-card">
                <div className="supplier-card-cover">
                  <div style={{ width: "100%", height: "100%", background: "#e8e2da" }} />
                  <div className="supplier-logo-wrapper">
                    <div style={{ width: "100%", height: "100%", background: "#d1dbd6", borderRadius: "50%" }} />
                  </div>
                </div>
                <div className="supplier-card-body">
                  <div className="supplier-card-header">
                    <h3 className="supplier-name">████████████</h3>
                    <p className="supplier-website">████████████</p>
                  </div>
                  <div className="supplier-divider"></div>
                  <div className="supplier-details-grid">
                    <div className="supplier-detail-item">
                      <span className="detail-label">Founding</span>
                      <span className="detail-value">████</span>
                    </div>
                    <div className="supplier-detail-item">
                      <span className="detail-label">Country</span>
                      <span className="detail-value">████</span>
                    </div>
                  </div>
                </div>
                <div className="supplier-actions">
                  <button className="connect-btn" disabled>
                    ████████████
                  </button>
                </div>
              </div>
            </div>

            <div className="blurred-overlay">
              <div className="blurred-overlay-card compact">
                <div className="blurred-icon">
                  <i className="fas fa-building"></i>
                </div>
                <h3 className="blurred-title">Reveal Supplier Info</h3>
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

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        redirectUrl={pathname}
      />

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

      {isConfirmModalOpen && (
        <ModalOverlay onClose={() => !loading && setIsConfirmModalOpen(false)}>
          <IconCircle icon="fa-info-circle" variant="info" />
          <h3 style={modalTitleStyle}>Reveal Supplier Info?</h3>
          <p style={modalSubtitleStyle}>
            This action will consume <strong>1 unit</strong> from your monthly
            inquiry quota and unlock contact + send request.
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
      <ConnectModal
        isOpen={isConnectModalOpen}
        onClose={() => setIsConnectModalOpen(false)}
        supplierId={supplier.id}
        supplierName={supplier.name}
        productId={productId}
      />
    </>
  );
}

// ====== کامپوننت‌های کمکی ======
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
