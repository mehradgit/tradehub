// src/components/profiles/ProfileHeader.js
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import ConnectModal from "@/components/ui/ConnectModal";
import LoginModal from "@/components/ui/LoginModal";

export default function ProfileHeader({ targetUserId, targetName }) {
  const { data: session } = useSession();
  const router = useRouter();
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);

  useEffect(() => {
    const checkSavedStatus = async () => {
      if (!session?.user) return;
      try {
        const res = await fetch(`/api/user/saved-profiles?targetId=${targetUserId}`);
        if (res.ok) {
          const data = await res.json();
          setIsSaved(data.isSaved || false);
        }
      } catch (error) {
        console.error("Error checking saved status:", error);
      }
    };
    checkSavedStatus();
  }, [targetUserId, session]);

  const toggleSave = async () => {
    if (!session) {
      setIsLoginModalOpen(true);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/user/saved-profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetId: targetUserId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to toggle save");
      setIsSaved(data.isSaved);
      toast.success(data.message);
      router.refresh();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleContact = () => {
    if (!session) {
      setIsLoginModalOpen(true);
      return;
    }
    setIsConnectModalOpen(true);
  };

  return (
    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", paddingTop: "60px" }}>
      <button
        className={`btn ${isSaved ? "btn-primary" : "btn-outline-secondary"}`}
        onClick={toggleSave}
        disabled={loading}
        style={{ minWidth: "100px" }}
      >
        {loading ? (
          <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
        ) : (
          <i className={`fas ${isSaved ? "fa-bookmark" : "fa-bookmark"} me-2`}></i>
        )}
        {isSaved ? "Unsave" : "Save"}
      </button>

      <button className="btn btn-primary" onClick={handleContact}>
        <i className="fas fa-envelope me-2"></i> Contact
      </button>

      {/* مودال‌ها */}
      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} redirectUrl={`/profiles/${targetUserId}`} />
      <ConnectModal
        isOpen={isConnectModalOpen}
        onClose={() => setIsConnectModalOpen(false)}
        mode="profile"
        targetUserId={targetUserId}
        targetName={targetName}
      />
    </div>
  );
}