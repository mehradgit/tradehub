// src/components/requests/RequestActions.js
"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { toast } from "react-toastify";
import ShareModal from "@/components/ui/ShareModal";
import LoginModal from "@/components/ui/LoginModal";
import SubmitQuoteModal from "./SubmitQuoteModal";

export default function RequestActions({
  request,
  buyer,
  buyerInfoPermission,
  alreadyRevealed,
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();

  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [permissionError, setPermissionError] = useState(null);
  const [localRevealed, setLocalRevealed] = useState(false);

  // ====== محاسبه وضعیت ======
  const isOwner = session?.user?.id === request.userId;
  const effectiveRevealed = alreadyRevealed || localRevealed;

  // ====== بررسی وضعیت ذخیره ======
  useEffect(() => {
    const checkSavedStatus = async () => {
      if (!session?.user || !request?.id) {
        setChecking(false);
        return;
      }
      try {
        const res = await fetch(
          `/api/user/saved-requests?requestId=${request.id}`
        );
        if (res.ok) {
          const data = await res.json();
          setIsSaved(data.isSaved || false);
        }
      } catch (error) {
        console.error("Error checking saved status:", error);
      } finally {
        setChecking(false);
      }
    };
    checkSavedStatus();
  }, [request?.id, session]);

  const handleShare = () => setIsShareModalOpen(true);

  const handleSaveToggle = async () => {
    if (!session) {
      setIsLoginModalOpen(true);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/user/saved-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId: request.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to save request");
      setIsSaved(data.isSaved);
      toast.success(data.message);
      router.refresh();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  // ====== Submit Quote ======
  const handleSubmitQuote = () => {
    // ۱. مهمان
    if (!session) {
      setIsLoginModalOpen(true);
      return;
    }

    // ۲. صاحب درخواست
    if (isOwner) return;

    // ۳. قبلاً Reveal کرده → فرم را باز کن
    if (effectiveRevealed) {
      setIsQuoteModalOpen(true);
      return;
    }

    // ۴. بدون مجوز → Upgrade
    if (!buyerInfoPermission.allowed) {
      setPermissionError(buyerInfoPermission);
      setIsUpgradeModalOpen(true);
      return;
    }

    // ۵. مجاز → مودال تأیید مصرف سهمیه
    setIsConfirmModalOpen(true);
  };

  // ====== تأیید مصرف سهمیه ======
  const handleConfirmReveal = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/requests/${request.id}/reveal-buyer`, {
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
        toast.success("1 quote used from your monthly quota");
      }
      setLocalRevealed(true);
      setIsConfirmModalOpen(false);
      // ✅ بعد از موفقیت، فرم را باز کن
      setIsQuoteModalOpen(true);
      router.refresh(); // به‌روزرسانی کارت خریدار در BuyerInfoSection
    } catch (err) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // ====== محتوای Upgrade ======
  const upgradeContent = (() => {
    if (!permissionError) return null;
    const isQuota = permissionError.reason === "quota_exhausted";
    return {
      icon: isQuota ? "fa-hourglass-end" : "fa-crown",
      title: isQuota ? "Monthly quota exhausted" : "Upgrade your plan",
      subtitle: isQuota
        ? `You've used ${permissionError.used || 0} of ${permissionError.limit || 0} monthly quotes. Upgrade your plan or wait until next month.`
        : `Your current plan (${permissionError.currentPlan || "Basic"}) doesn't allow submitting quotes. Please upgrade to continue.`,
      buttonText: isQuota ? "Upgrade Plan" : "View Plans",
    };
  })();

  // ====== متن و آیکون دکمه ======
  const submitDisabled = isOwner;
  const submitLabel = isOwner
    ? "Submit Quote"
    : !session || buyerInfoPermission.allowed
    ? "Submit Quote"
    : "Upgrade to Submit Quote";
  const submitIcon =
    !session || buyerInfoPermission.allowed ? "fa-paper-plane" : "fa-crown";

  return (
    <>
      <div className="d-flex gap-2 flex-wrap mt-3">
        {/* Save */}
        <button
          className={`btn ${isSaved ? "btn-primary" : "btn-outline-secondary"}`}
          onClick={handleSaveToggle}
          disabled={loading || checking}
          style={{ minWidth: "120px" }}
        >
          {loading ? (
            <span className="spinner-border spinner-border-sm me-2"></span>
          ) : (
            <i className="fas fa-bookmark me-2"></i>
          )}
          {isSaved ? "Unsave" : "Save Request"}
        </button>

        {/* Share */}
        <button
          className="btn btn-outline-secondary"
          onClick={handleShare}
          style={{ borderColor: "var(--secondary)" }}
        >
          <i className="fas fa-share-alt me-2"></i> Share
        </button>

        {/* Submit Quote */}
        <button
          className="btn btn-primary"
          onClick={handleSubmitQuote}
          disabled={submitDisabled}
          title={isOwner ? "You cannot quote your own request" : ""}
        >
          <i className={`fas ${submitIcon} me-2`}></i>
          {submitLabel}
        </button>
      </div>

      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        product={request}
      />

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        redirectUrl={pathname}
      />

      {/* Submit Quote Form */}
      {isQuoteModalOpen && (
        <SubmitQuoteModal
          isOpen={isQuoteModalOpen}
          onClose={() => setIsQuoteModalOpen(false)}
          requestId={request.id}
          buyerId={buyer.id}
          requestTitle={request.title}
          permission={buyerInfoPermission}
        />
      )}

      {/* Confirm Reveal Modal */}
      {isConfirmModalOpen && (
        <ModalOverlay onClose={() => !loading && setIsConfirmModalOpen(false)}>
          <IconCircle icon="fa-info-circle" variant="info" />
          <h3 style={modalTitleStyle}>Use 1 quote?</h3>
          <p style={modalSubtitleStyle}>
            This will consume <strong>1 unit</strong> from your monthly quote
            quota and unlock buyer info + submit quote for this request.
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

      {/* Upgrade Modal */}
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