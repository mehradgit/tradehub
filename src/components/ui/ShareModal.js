// src/components/ui/ShareModal.js
"use client";

import { useState, useEffect } from "react";
import { toast } from "react-toastify";

export default function ShareModal({ isOpen, onClose, product }) {
  const [url, setUrl] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setUrl(window.location.href);
    }
  }, []);

  if (!isOpen) return null;

  const shareData = {
    title: product?.name || "Check out this product",
    text: product?.shortDesc || "",
    url: url,
  };

  const shareLinks = {
    whatsapp: `https://api.whatsapp.com/send?text=${encodeURIComponent(
      `${shareData.title}\n${shareData.text}\n${shareData.url}`
    )}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareData.url)}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(
      shareData.title
    )}&url=${encodeURIComponent(shareData.url)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareData.url)}`,
    email: `mailto:?subject=${encodeURIComponent(shareData.title)}&body=${encodeURIComponent(
      `${shareData.text}\n\n${shareData.url}`
    )}`,
    telegram: `https://t.me/share/url?url=${encodeURIComponent(shareData.url)}&text=${encodeURIComponent(
      shareData.title
    )}`,
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareData.url);
      toast.success("Link copied to clipboard!");
    } catch (err) {
      const textarea = document.createElement("textarea");
      textarea.value = shareData.url;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      toast.success("Link copied to clipboard!");
    }
  };

  const handleShare = (platform) => {
    window.open(shareLinks[platform], "_blank", "width=600,height=500");
  };

  return (
    <div className="share-modal-overlay" onClick={onClose}>
      <div className="share-modal" onClick={(e) => e.stopPropagation()}>
        <button className="share-modal-close" onClick={onClose}>
          <i className="fas fa-times"></i>
        </button>

        <div className="share-modal-header">
          <div className="share-modal-icon">
            <i className="fas fa-share-alt"></i>
          </div>
          <h3>Share This Product</h3>
          <p className="share-modal-subtitle">
            Share {product?.name || "this product"} with your network
          </p>
        </div>

        <div className="share-modal-body">
          <div className="share-platforms">
            {/* WhatsApp */}
            <button
              className="share-platform-btn whatsapp"
              onClick={() => handleShare("whatsapp")}
            >
              <i className="fab fa-whatsapp"></i>
              <span>WhatsApp</span>
            </button>

            {/* Facebook */}
            <button
              className="share-platform-btn facebook"
              onClick={() => handleShare("facebook")}
            >
              <i className="fab fa-facebook-f"></i>
              <span>Facebook</span>
            </button>

            {/* X (Twitter) */}
            <button
              className="share-platform-btn twitter"
              onClick={() => handleShare("twitter")}
            >
              <i className="fab fa-x-twitter"></i>
              <span>X</span>
            </button>

            {/* LinkedIn */}
            <button
              className="share-platform-btn linkedin"
              onClick={() => handleShare("linkedin")}
            >
              <i className="fab fa-linkedin-in"></i>
              <span>LinkedIn</span>
            </button>

            {/* Telegram */}
            <button
              className="share-platform-btn telegram"
              onClick={() => handleShare("telegram")}
            >
              <i className="fab fa-telegram-plane"></i>
              <span>Telegram</span>
            </button>

            {/* Email */}
            <button
              className="share-platform-btn email"
              onClick={() => handleShare("email")}
            >
              <i className="fas fa-envelope"></i>
              <span>Email</span>
            </button>
          </div>

          <div className="share-copy-link">
            <input
              type="text"
              value={shareData.url}
              readOnly
              className="share-link-input"
            />
            <button className="share-copy-btn" onClick={handleCopyLink}>
              <i className="fas fa-copy"></i>
              Copy Link
            </button>
          </div>
        </div>

        <div className="share-modal-footer">
          <button className="share-modal-close-btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>

      <style jsx>{`
        .share-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(6px);
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: fadeIn 0.3s ease;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            transform: translateY(30px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .share-modal {
          background: var(--white);
          border-radius: var(--radius-lg);
          padding: 32px;
          max-width: 480px;
          width: 90%;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 30px 80px rgba(0, 0, 0, 0.25);
          animation: slideUp 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
          position: relative;
        }

        .share-modal-close {
          position: absolute;
          top: 16px;
          right: 20px;
          font-size: 20px;
          background: none;
          border: none;
          color: var(--gray);
          cursor: pointer;
          transition: var(--transition);
          padding: 4px 8px;
          border-radius: 8px;
        }

        .share-modal-close:hover {
          color: var(--black);
          background: var(--light);
        }

        .share-modal-header {
          text-align: center;
          margin-bottom: 24px;
        }

        .share-modal-icon {
          width: 56px;
          height: 56px;
          background: rgba(232, 93, 58, 0.08);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 12px;
          font-size: 24px;
          color: var(--primary);
        }

        .share-modal-header h3 {
          font-size: 20px;
          font-weight: 700;
          color: var(--black);
          margin: 0 0 4px 0;
          font-family: "Poppins", sans-serif;
        }

        .share-modal-subtitle {
          font-size: 14px;
          color: var(--gray);
          margin: 0;
        }

        .share-modal-body {
          margin-bottom: 20px;
        }

        .share-platforms {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          margin-bottom: 20px;
        }

        .share-platform-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          padding: 14px 8px;
          border: 1.5px solid var(--gray-light);
          border-radius: var(--radius);
          background: var(--white);
          cursor: pointer;
          transition: var(--transition);
          font-family: "Inter", sans-serif;
          font-size: 12px;
          font-weight: 500;
          color: var(--gray-dark);
        }

        .share-platform-btn:hover {
          border-color: var(--primary);
          transform: translateY(-2px);
          box-shadow: var(--shadow);
        }

        .share-platform-btn i {
          font-size: 24px;
        }

        .share-platform-btn.whatsapp i {
          color: #25d366;
        }
        .share-platform-btn.facebook i {
          color: #1877f2;
        }
        .share-platform-btn.twitter i {
          color: #000;
        }
        .share-platform-btn.linkedin i {
          color: #0a66c2;
        }
        .share-platform-btn.telegram i {
          color: #0088cc;
        }
        .share-platform-btn.email i {
          color: #ea4335;
        }

        .share-platform-btn.whatsapp:hover {
          border-color: #25d366;
          background: rgba(37, 211, 102, 0.05);
        }
        .share-platform-btn.facebook:hover {
          border-color: #1877f2;
          background: rgba(24, 119, 242, 0.05);
        }
        .share-platform-btn.twitter:hover {
          border-color: #000;
          background: rgba(0, 0, 0, 0.03);
        }
        .share-platform-btn.linkedin:hover {
          border-color: #0a66c2;
          background: rgba(10, 102, 194, 0.05);
        }
        .share-platform-btn.telegram:hover {
          border-color: #0088cc;
          background: rgba(0, 136, 204, 0.05);
        }
        .share-platform-btn.email:hover {
          border-color: #ea4335;
          background: rgba(234, 67, 53, 0.05);
        }

        .share-copy-link {
          display: flex;
          gap: 8px;
          border: 1.5px solid var(--gray-light);
          border-radius: var(--radius);
          overflow: hidden;
          background: var(--light);
        }

        .share-link-input {
          flex: 1;
          padding: 10px 14px;
          border: none;
          background: transparent;
          font-size: 13px;
          color: var(--gray-dark);
          outline: none;
          font-family: "Inter", sans-serif;
          min-width: 0;
        }

        .share-copy-btn {
          padding: 10px 18px;
          background: var(--primary);
          color: white;
          border: none;
          cursor: pointer;
          font-weight: 600;
          font-size: 13px;
          transition: var(--transition);
          white-space: nowrap;
          font-family: "Inter", sans-serif;
        }

        .share-copy-btn:hover {
          background: var(--primary-dark);
        }

        .share-modal-footer {
          text-align: center;
        }

        .share-modal-close-btn {
          padding: 10px 32px;
          background: transparent;
          border: 1.5px solid var(--gray-light);
          border-radius: 50px;
          font-size: 14px;
          font-weight: 600;
          color: var(--gray-dark);
          cursor: pointer;
          transition: var(--transition);
          font-family: "Inter", sans-serif;
        }

        .share-modal-close-btn:hover {
          border-color: var(--primary);
          color: var(--primary);
        }

        @media (max-width: 480px) {
          .share-modal {
            padding: 24px 16px;
          }

          .share-platforms {
            grid-template-columns: repeat(3, 1fr);
            gap: 8px;
          }

          .share-platform-btn {
            padding: 10px 6px;
            font-size: 11px;
          }

          .share-platform-btn i {
            font-size: 20px;
          }
        }
      `}</style>
    </div>
  );
}