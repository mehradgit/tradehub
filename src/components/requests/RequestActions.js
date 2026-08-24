// src/components/requests/RequestActions.js
"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";
import ShareModal from "@/components/ui/ShareModal";
import LoginModal from "@/components/ui/LoginModal";
import SubmitQuoteModal from "./SubmitQuoteModal"; // ✅ مودال جدید

export default function RequestActions({ request, buyer }) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();

  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);

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

  // ====== دکمه Share ======
  const handleShare = () => {
    setIsShareModalOpen(true);
  };

  // ====== دکمه Save ======
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

  // ====== دکمه Submit Quote ======
  const handleSubmitQuote = () => {
    if (!session) {
      setIsLoginModalOpen(true);
      return;
    }
    setIsQuoteModalOpen(true);
  };

  return (
    <>
      <div className="d-flex gap-2 flex-wrap mt-3">
        {/* دکمه Save */}
        <button
          suppressHydrationWarning
          className={`btn ${isSaved ? "btn-primary" : "btn-outline-secondary"}`}
          onClick={handleSaveToggle}
          disabled={loading || checking}
          style={{ minWidth: "120px" }}
        >
          {loading ? (
            <span className="spinner-border spinner-border-sm me-2"></span>
          ) : (
            <i className={`fas ${isSaved ? "fa-bookmark" : "fa-bookmark"} me-2`}></i>
          )}
          {isSaved ? "Unsave" : "Save Request"}
        </button>

        {/* دکمه Share */}
        <button
          className="btn btn-outline-secondary"
          onClick={handleShare}
          style={{ borderColor: "var(--secondary)" }}
        >
          <i className="fas fa-share-alt me-2"></i> Share
        </button>

        {/* ✅ دکمه Submit Quote (جایگزین Contact Buyer) */}
        <button className="btn btn-primary" onClick={handleSubmitQuote}>
          <i className="fas fa-paper-plane me-2"></i> Submit Quote
        </button>
      </div>

      {/* ====== مودال‌ها ====== */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        product={request} // ShareModal با همان ساختار کار می‌کند
      />

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        redirectUrl={pathname}
      />

      {/* ✅ مودال ارسال پیشنهاد (با فیلدهای کامل) */}
      <SubmitQuoteModal
        isOpen={isQuoteModalOpen}
        onClose={() => setIsQuoteModalOpen(false)}
        requestId={request.id}
        buyerId={buyer.id}
        requestTitle={request.title}
      />
    </>
  );
}