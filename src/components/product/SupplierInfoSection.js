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
import SafeImage from "@/components/ui/SafeImage";

export default function SupplierInfoSection({
  productId,
  supplier,
  initialPermission,
  alreadyRevealed,
  shouldAutoReveal,
  onRevealSuccess,
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
        ? `You've used ${permissionError.used || 0} of ${
            permissionError.limit || 0
          } monthly inquiries. Upgrade your plan or wait until next month.`
        : `Your current plan (${
            permissionError.currentPlan || "Basic"
          }) doesn't allow viewing supplier information. Please upgrade to continue.`,
      buttonText: isQuota ? "Upgrade Plan" : "View Plans",
    };
  })();

  return (
    <>
      <div className="supplier-card-wrapper">
        {isRevealed ? (
          /* ====== Revealed card ====== */
          <div className="supplier-card">
            <div className="supplier-card-cover">
              <SafeImage
                src={supplier.coverImage}
                alt="Cover"
                fallbackType="cover"
              />
              <div className="supplier-logo-wrapper">
                <SafeImage
                  src={supplier.logo}
                  alt={supplier.name}
                  fallbackType="avatar"
                />
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
          /* ====== Blurred card ====== */
          <div className="blurred-wrapper">
            <div className="blurred-content">
              <div className="supplier-card">
                <div className="supplier-card-cover">
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      background: "#e8e2da",
                    }}
                  />
                  <div className="supplier-logo-wrapper">
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        background: "#d1dbd6",
                        borderRadius: "50%",
                      }}
                    />
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

      {/* ====== Styles ====== */}
      <style jsx>{`
        /* ============================================================
           Wrapper
           ============================================================ */
        .supplier-card-wrapper {
          width: 100%;
          max-width: 300px;
          min-width: 0;
        }

        /* ============================================================
           Card
           ============================================================ */
        .supplier-card {
          background: white;
          border-radius: 20px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
          overflow: hidden;
          width: 100%;
          min-width: 0;
          display: flex;
          flex-direction: column;
          border: 1px solid #e8edf0;
        }

        /* ============================================================
           Cover
           ============================================================ */
        .supplier-card-cover {
          position: relative;
          width: 100%;
          height: 90px;
          overflow: visible;
          flex-shrink: 0;
        }

        .supplier-card-cover > img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        /* ============================================================
           Logo (over the cover, offset downwards)
           ============================================================ */
        .supplier-logo-wrapper {
          position: absolute;
          bottom: -32px;
          right: 20px;
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: #080f3b;
          border: 3px solid white;
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
          overflow: hidden;
          display: grid;
          place-items: center;
          z-index: 2;
        }

        .supplier-logo-wrapper img {
          width: 70%;
          height: 70%;
          object-fit: contain;
        }

        /* ============================================================
           Body
           ============================================================ */
        .supplier-card-body {
          padding: 44px 20px 16px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          min-width: 0;
        }

        .supplier-card-header {
          display: flex;
          flex-direction: column;
          gap: 4px;
          min-width: 0;
        }

        .supplier-name {
          font-size: 15.5px;
          font-weight: 700;
          color: #052311;
          font-family: "Poppins", sans-serif;
          line-height: 1.35;
          margin: 0;
          word-wrap: break-word;
          overflow-wrap: break-word;
          min-width: 0;
        }

        .supplier-website {
          font-size: 12.5px;
          color: rgba(5, 35, 17, 0.55);
          font-family: "Poppins", sans-serif;
          line-height: 1.4;
          margin: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          min-width: 0;
        }

        .supplier-divider {
          width: 60%;
          height: 1px;
          background: #f7c3a3;
          border-radius: 2px;
          margin: 6px 0;
        }

        /* ============================================================
           Details Grid
           ============================================================ */
        .supplier-details-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
          width: 100%;
          min-width: 0;
        }

        .supplier-detail-item {
          display: flex;
          flex-direction: column;
          gap: 3px;
          min-width: 0;
        }

        .detail-label {
          font-size: 11.5px;
          color: rgba(5, 35, 17, 0.5);
          font-weight: 500;
          font-family: "Poppins", sans-serif;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }

        .detail-value {
          font-size: 13.5px;
          font-weight: 600;
          color: #000;
          font-family: "Poppins", sans-serif;
          line-height: 1.3;
          min-width: 0;
          word-wrap: break-word;
        }

        .detail-value-with-flag {
          display: flex;
          align-items: center;
          gap: 6px;
          min-width: 0;
        }

        .detail-value-with-flag span {
          font-size: 13.5px;
          font-weight: 600;
          color: #052311;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          min-width: 0;
        }

        /* ============================================================
           Actions
           ============================================================ */
        .supplier-actions {
          padding: 12px 20px 20px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          min-width: 0;
          border-top: 1px solid #f1f5f7;
        }

        .company-info-link {
          color: rgba(22, 144, 212, 0.9);
          font-size: 13px;
          font-weight: 600;
          font-family: "Poppins", sans-serif;
          text-align: center;
          text-decoration: none;
          cursor: pointer;
          transition: color 0.2s ease;
        }

        .company-info-link:hover {
          color: #168fd4;
          text-decoration: underline;
        }

        .connect-btn {
          width: 100%;
          padding: 10px 18px;
          background: transparent;
          border: 1.5px solid #5dc888;
          border-radius: 10px;
          color: #117c3c;
          font-size: 13px;
          font-weight: 600;
          font-family: "Poppins", sans-serif;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .connect-btn:hover {
          background: #5dc888;
          color: white;
        }

        .connect-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* ============================================================
           Blurred (for Basic)
           ============================================================ */
        .blurred-wrapper {
          position: relative;
          border-radius: 20px;
          overflow: hidden;
          min-height: 320px;
        }

        .blurred-content {
          filter: blur(8px);
          user-select: none;
          pointer-events: none;
          opacity: 0.55;
        }

        .blurred-overlay {
          position: absolute;
          inset: 0;
          display: grid;
          place-items: center;
          padding: 12px;
          background: rgba(255, 255, 255, 0.35);
          backdrop-filter: blur(2px);
          z-index: 10;
        }

        .blurred-overlay-card {
          background: white;
          border-radius: 16px;
          padding: 20px 18px;
          max-width: 320px;
          width: 100%;
          text-align: center;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
          border: 1px solid #e2e9e5;
        }

        .blurred-overlay-card.compact {
          padding: 16px 14px;
          max-width: 260px;
        }

        .blurred-overlay-card.compact .blurred-icon {
          width: 40px;
          height: 40px;
          font-size: 16px;
          margin-bottom: 8px;
        }

        .blurred-icon {
          width: 46px;
          height: 46px;
          margin: 0 auto 10px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          font-size: 18px;
          background: linear-gradient(135deg, #eaf7f1, #d1ede0);
          color: #13795b;
        }

        .blurred-title {
          font-family: "Manrope", sans-serif;
          font-size: 14.5px;
          font-weight: 800;
          color: #13251f;
          margin: 0 0 12px 0;
        }

        .btn-blur-upgrade {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 9px 18px;
          border-radius: 50px;
          font-size: 12.5px;
          font-weight: 700;
          background: linear-gradient(135deg, #f59e0b, #d97706);
          color: white;
          border: none;
          cursor: pointer;
          transition: all 0.25s ease;
          box-shadow: 0 6px 16px rgba(245, 158, 11, 0.25);
        }

        .btn-blur-upgrade:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 10px 24px rgba(245, 158, 11, 0.35);
        }

        .btn-blur-upgrade:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
      `}</style>
    </>
  );
}

// ====== Helper components ======
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