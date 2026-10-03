// src/app/not-found.js
import Link from "next/link";

export const metadata = {
  title: "Page Not Found | FoodTradeLink",
};

export default function NotFound() {
  return (
    <div className="nf-page">
      <div className="nf-container">
        {/* Illustration */}
        <div className="nf-illustration">
          <div className="nf-number">
            <span className="nf-digit">4</span>
            <div className="nf-globe">
              <i className="fas fa-globe"></i>
              <div className="nf-orbit"></div>
            </div>
            <span className="nf-digit">4</span>
          </div>
        </div>

        {/* Content */}
        <div className="nf-content">
          <div className="nf-badge">
            <i className="fas fa-search"></i>
            Page Not Found
          </div>

          <h1 className="nf-title">Oops! This page went missing.</h1>

          <p className="nf-subtitle">
            The page you're looking for doesn't exist, was removed, or the URL
            might be misspelled. Let's get you back on track.
          </p>

          {/* Actions */}
          <div className="nf-actions">
            <Link href="/" className="nf-btn primary">
              <i className="fas fa-home"></i>
              Back to Home
            </Link>
            <Link href="/dashboard" className="nf-btn ghost">
              <i className="fas fa-gauge-high"></i>
              Go to Dashboard
            </Link>
          </div>

          {/* Quick Links */}
          <div className="nf-links">
            <span className="nf-links-label">Popular pages:</span>
            <div className="nf-links-grid">
              <Link href="/products" className="nf-link">
                <i className="fas fa-box"></i>
                Products
              </Link>
              <Link href="/requests" className="nf-link">
                <i className="fas fa-cart-shopping"></i>
                Buying Requests
              </Link>
              <Link href="/profiles" className="nf-link">
                <i className="fas fa-users"></i>
                Profiles
              </Link>
              <Link href="/dashboard/support" className="nf-link">
                <i className="fas fa-headset"></i>
                Support
              </Link>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .nf-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
          background:
            radial-gradient(circle at 20% 20%, rgba(15, 158, 110, 0.06) 0%, transparent 40%),
            radial-gradient(circle at 80% 80%, rgba(99, 102, 241, 0.05) 0%, transparent 40%),
            linear-gradient(180deg, #f6f8f9 0%, #eef4f2 100%);
          font-family: "Inter", -apple-system, BlinkMacSystemFont, sans-serif;
          position: relative;
          overflow: hidden;
        }

        .nf-page::before {
          content: "";
          position: absolute;
          width: 500px;
          height: 500px;
          border-radius: 50%;
          border: 60px solid rgba(15, 158, 110, 0.03);
          top: -250px;
          right: -100px;
          pointer-events: none;
        }

        .nf-page::after {
          content: "";
          position: absolute;
          width: 400px;
          height: 400px;
          border-radius: 50%;
          border: 50px solid rgba(99, 102, 241, 0.03);
          bottom: -200px;
          left: -100px;
          pointer-events: none;
        }

        .nf-container {
          max-width: 720px;
          width: 100%;
          text-align: center;
          position: relative;
          z-index: 1;
          animation: nfFadeUp 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        }

        @keyframes nfFadeUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* ===== Illustration ===== */
        .nf-illustration {
          margin-bottom: 32px;
          display: flex;
          justify-content: center;
        }

        .nf-number {
          display: flex;
          align-items: center;
          gap: 12px;
          font-family: "Manrope", sans-serif;
        }

        .nf-digit {
          font-size: 120px;
          font-weight: 900;
          line-height: 1;
          letter-spacing: -0.05em;
          background: linear-gradient(135deg, #0f9e6e 0%, #14b881 100%);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          filter: drop-shadow(0 10px 30px rgba(15, 158, 110, 0.15));
        }

        .nf-globe {
          width: 100px;
          height: 100px;
          border-radius: 50%;
          background: linear-gradient(135deg, #0f9e6e 0%, #0a7d55 100%);
          display: grid;
          place-items: center;
          font-size: 44px;
          color: white;
          position: relative;
          box-shadow:
            0 20px 50px rgba(15, 158, 110, 0.3),
            inset 0 -10px 30px rgba(0, 0, 0, 0.1);
          animation: nfFloat 3s ease-in-out infinite;
        }

        @keyframes nfFloat {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        .nf-orbit {
          position: absolute;
          inset: -14px;
          border-radius: 50%;
          border: 2px dashed rgba(15, 158, 110, 0.3);
          animation: nfSpin 20s linear infinite;
        }

        .nf-orbit::before {
          content: "";
          position: absolute;
          top: -4px;
          left: 50%;
          transform: translateX(-50%);
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #f5b544;
          box-shadow: 0 0 12px rgba(245, 181, 68, 0.8);
        }

        @keyframes nfSpin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        /* ===== Content ===== */
        .nf-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
        }

        .nf-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 16px;
          border-radius: 50px;
          background: rgba(15, 158, 110, 0.08);
          color: #0f9e6e;
          font-size: 11.5px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.8px;
        }

        .nf-title {
          font-family: "Manrope", sans-serif;
          font-size: 32px;
          font-weight: 800;
          color: #0b1f18;
          letter-spacing: -0.03em;
          margin: 0;
          line-height: 1.2;
        }

        .nf-subtitle {
          font-size: 15px;
          color: #64748b;
          line-height: 1.7;
          max-width: 520px;
          margin: 0;
        }

        /* ===== Actions ===== */
        .nf-actions {
          display: flex;
          gap: 12px;
          margin-top: 12px;
          flex-wrap: wrap;
          justify-content: center;
        }

        .nf-btn {
          display: inline-flex;
          align-items: center;
          gap: 9px;
          padding: 13px 24px;
          border-radius: 12px;
          font-size: 13.5px;
          font-weight: 700;
          text-decoration: none;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          white-space: nowrap;
        }

        .nf-btn.primary {
          background: linear-gradient(135deg, #0f9e6e, #0a7d55);
          color: white;
          box-shadow: 0 8px 24px rgba(15, 158, 110, 0.3);
        }

        .nf-btn.primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 32px rgba(15, 158, 110, 0.4);
          color: white;
        }

        .nf-btn.ghost {
          background: white;
          color: #334155;
          border: 1px solid #e8edf0;
        }

        .nf-btn.ghost:hover {
          border-color: #0f9e6e;
          color: #0f9e6e;
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(15, 158, 110, 0.1);
        }

        /* ===== Quick Links ===== */
        .nf-links {
          margin-top: 40px;
          padding-top: 30px;
          border-top: 1px solid #e8edf0;
          width: 100%;
        }

        .nf-links-label {
          display: block;
          font-size: 11px;
          font-weight: 800;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 16px;
        }

        .nf-links-grid {
          display: flex;
          gap: 10px;
          justify-content: center;
          flex-wrap: wrap;
        }

        .nf-link {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          border-radius: 10px;
          background: white;
          border: 1px solid #e8edf0;
          color: #334155;
          font-size: 12.5px;
          font-weight: 700;
          text-decoration: none;
          transition: all 0.2s ease;
        }

        .nf-link i {
          color: #0f9e6e;
          font-size: 13px;
        }

        .nf-link:hover {
          border-color: #0f9e6e;
          background: #f2fdf8;
          color: #0f9e6e;
          transform: translateY(-2px);
        }

        /* ===== Responsive ===== */
        @media (max-width: 640px) {
          .nf-digit {
            font-size: 80px;
          }

          .nf-globe {
            width: 72px;
            height: 72px;
            font-size: 30px;
          }

          .nf-title {
            font-size: 24px;
          }

          .nf-subtitle {
            font-size: 14px;
          }

          .nf-actions {
            width: 100%;
            flex-direction: column;
          }

          .nf-btn {
            width: 100%;
            justify-content: center;
          }

          .nf-links-grid {
            flex-direction: column;
          }

          .nf-link {
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
}