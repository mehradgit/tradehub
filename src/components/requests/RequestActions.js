// src/components/requests/RequestActions.js
"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";
import ShareModal from "@/components/ui/ShareModal";
import LoginModal from "@/components/ui/LoginModal";
import ConnectModal from "@/components/ui/ConnectModal";

export default function RequestActions({ request, buyer }) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();

  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);

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

  // ====== دکمه Contact Buyer ======
  const handleContact = () => {
    if (!session) {
      setIsLoginModalOpen(true);
      return;
    }
    setIsConnectModalOpen(true);
  };

  // ====== پس از لاگین موفق، ادامه عملیات ======
  const handleLoginSuccess = () => {
    // اگر کاربر پس از لاگین بخواهد ذخیره کند، دوباره فراخوانی می‌شود
    // اما ما از طریق مودال لاگین، پس از بسته شدن، عملیات را ادامه نمی‌دهیم.
    // در عوض، کاربر دوباره روی دکمه کلیک می‌کند.
  };

  return (
    <>
      <div className="d-flex gap-2 flex-wrap mt-3">
        {/* دکمه Save */}
        <button
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

        {/* دکمه Contact Buyer */}
        <button
          className="btn btn-primary"
          onClick={handleContact}
        >
          <i className="fas fa-envelope me-2"></i> Contact Buyer
        </button>
      </div>

      {/* ====== مودال‌ها ====== */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        product={request} // از آنجا که ShareModal برای محصول طراحی شده، نام فیلدها را تطبیق دهید
      />

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        redirectUrl={pathname}
      />

      <ConnectModal
        isOpen={isConnectModalOpen}
        onClose={() => setIsConnectModalOpen(false)}
        supplierId={buyer.id} // در درخواست، خریدار همان طرف مقابل است
        supplierName={buyer.name}
        productId={request.productId} // اگر درخواست به محصول خاصی مرتبط است
      />
    </>
  );
}