// src/app/error.js
"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({ error, reset }) {
  useEffect(() => {
    // Log the error for debugging
    console.error("Application error:", error);
  }, [error]);

  const isDev = process.env.NODE_ENV === "development";

  return (
    <div className="err-page">
      <div className="err-container">
        {/* Icon */}
        <div className="err-icon-wrap">
          <div className="err-icon">
            <i className="fas fa-triangle-exclamation"></i>
          </div>
          <div className="err-icon-pulse"></div>
        </div>

        {/* Content */}
        <div className="err-content">
          <div className="err-badge">
            <i className="fas fa-bug"></i>
            Something went wrong
          </div>

          <h1 className="err-title">We hit an unexpected error.</h1>

          <p className="err-subtitle">
            Don't worry — your data is safe. This is likely a temporary
            glitch. Try refreshing the page or go back to safety.
          </p>

          {/* Actions */}
          <div className="err-actions">
            <button onClick={() => reset()} className="err-btn primary">
              <i className="fas fa-rotate-right"></i>
              Try Again
            </button>
            <Link href="/" className="err-btn ghost">
              <i className="fas fa-home"></i>
              Back to Home
            </Link>
            <Link href="/dashboard" className="err-btn ghost">
              <i className="fas fa-gauge-high"></i>
              Dashboard
            </Link>
          </div>

          {/* Helpful links */}
          <div className="err-links">
            <span className="err-links-label">Still having issues?</span>
            <div className="err-links-grid">
              <Link href="/dashboard/support" className="err-link">
                <i className="fas fa-headset"></i>
                Contact Support
              </Link>
              <a
                href="mailto:support@FoodTradeLink.com"
                className="err-link"
              >
                <i className="fas fa-envelope"></i>
                Email Us
              </a>
            </div>
          </div>
        </div>

        {/* Dev error details */}
        {isDev && error?.message && (
          <details className="err-details">
            <summary>
              <i className="fas fa-code"></i>
              Developer Details
            </summary>
            <div className="err-details-body">
              <div className="err-details-row">
                <span className="err-details-label">Message:</span>
                <code className="err-details-code">{error.message}</code>
              </div>
              {error.digest && (
                <div className="err-details-row">
                  <span className="err-details-label">Digest:</span>
                  <code className="err-details-code">{error.digest}</code>
                </div>
              )}
              {error.stack && (
                <div className="err-details-row">
                  <span className="err-details-label">Stack:</span>
                  <pre className="err-details-stack">{error.stack}</pre>
                </div>
              )}
            </div>
          </details>
        )}
      </div>

      <style>{`
        .err-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
          background:
            radial-gradient(circle at 20% 20%, rgba(239, 68, 68, 0.05) 0%, transparent 40%),
            radial-gradient(circle at 80% 80%, rgba(249, 115, 22, 0.05) 0%, transparent 40%),
            linear-gradient(180deg, #f6f8f9 0%, #fef6f5 100%);
          font-family: "Inter", -apple-system, BlinkMacSystemFont, sans-serif;
          position: relative;
          overflow: hidden;
        }

        .err-page::before {
          content: "";
          position: absolute;
          width: 500px;
          height: 500px;
          border-radius: 50%;
          border: 60px solid rgba(239, 68, 68, 0.03);
          top: -250px;
          right: -100px;
          pointer-events: none;
        }

        .err-page::after {
          content: "";
          position: absolute;
          width: 400px;
          height: 400px;
          border-radius: 50%;
          border: 50px solid rgba(249, 115, 22, 0.03);
          bottom: -200px;
          left: -100px;
          pointer-events: none;
        }

        .err-container {
          max-width: 720px;
          width: 100%;
          text-align: center;
          position: relative;
          z-index: 1;
          animation: errFadeUp 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        }

        @keyframes errFadeUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* ===== Icon ===== */
        .err-icon-wrap {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 32px;
        }

        .err-icon {
          width: 110px;
          height: 110px;
          border-radius: 30px;
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          display: grid;
          place-items: center;
          font-size: 46px;
          color: white;
          position: relative;
          z-index: 2;
          box-shadow:
            0 20px 50px rgba(239, 68, 68, 0.3),
            inset 0 -10px 30px rgba(0, 0, 0, 0.1);
          animation: errShake 0.6s ease-in-out;
        }

        @keyframes errShake {
          0%, 100% { transform: rotate(0deg); }
          20% { transform: rotate(-5deg); }
          40% { transform: rotate(5deg); }
          60% { transform: rotate(-3deg); }
          80% { transform: rotate(3deg); }
        }

        .err-icon-pulse {
          position: absolute;
          inset: -20px;
          border-radius: 40px;
          border: 3px solid rgba(239, 68, 68, 0.2);
          animation: errPulse 2.5s ease-in-out infinite;
        }

        @keyframes errPulse {
          0%, 100% {
            transform: scale(1);
            opacity: 0.6;
          }
          50% {
            transform: scale(1.1);
            opacity: 0;
          }
        }

        /* ===== Content ===== */
        .err-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
        }

        .err-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 16px;
          border-radius: 50px;
          background: rgba(239, 68, 68, 0.08);
          color: #dc2626;
          font-size: 11.5px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.8px;
        }

        .err-title {
          font-family: "Manrope", sans-serif;
          font-size: 32px;
          font-weight: 800;
          color: #0b1f18;
          letter-spacing: -0.03em;
          margin: 0;
          line-height: 1.2;
        }

        .err-subtitle {
          font-size: 15px;
          color: #64748b;
          line-height: 1.7;
          max-width: 520px;
          margin: 0;
        }

        /* ===== Actions ===== */
        .err-actions {
          display: flex;
          gap: 12px;
          margin-top: 12px;
          flex-wrap: wrap;
          justify-content: center;
        }

        .err-btn {
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
          cursor: pointer;
          border: none;
          font-family: inherit;
        }

        .err-btn.primary {
          background: linear-gradient(135deg, #ef4444, #dc2626);
          color: white;
          box-shadow: 0 8px 24px rgba(239, 68, 68, 0.3);
        }

        .err-btn.primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 32px rgba(239, 68, 68, 0.4);
        }

        .err-btn.ghost {
          background: white;
          color: #334155;
          border: 1px solid #e8edf0;
        }

        .err-btn.ghost:hover {
          border-color: #ef4444;
          color: #ef4444;
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(239, 68, 68, 0.1);
        }

        /* ===== Quick Links ===== */
        .err-links {
          margin-top: 36px;
          padding-top: 28px;
          border-top: 1px solid #e8edf0;
          width: 100%;
        }

        .err-links-label {
          display: block;
          font-size: 11px;
          font-weight: 800;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 14px;
        }

        .err-links-grid {
          display: flex;
          gap: 10px;
          justify-content: center;
          flex-wrap: wrap;
        }

        .err-link {
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

        .err-link i {
          color: #ef4444;
          font-size: 13px;
        }

        .err-link:hover {
          border-color: #ef4444;
          background: #fef2f2;
          color: #ef4444;
          transform: translateY(-2px);
        }

        /* ===== Dev Details ===== */
        .err-details {
          margin-top: 30px;
          width: 100%;
          text-align: left;
          background: #0b1f18;
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid #1e3a31;
        }

        .err-details summary {
          padding: 12px 16px;
          cursor: pointer;
          background: rgba(255, 255, 255, 0.03);
          color: #94a3b8;
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.6px;
          list-style: none;
          display: flex;
          align-items: center;
          gap: 8px;
          user-select: none;
          transition: background 0.2s ease;
        }

        .err-details summary::-webkit-details-marker {
          display: none;
        }

        .err-details summary:hover {
          background: rgba(255, 255, 255, 0.06);
        }

        .err-details[open] summary {
          border-bottom: 1px solid #1e3a31;
          color: #ef4444;
        }

        .err-details-body {
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          max-height: 400px;
          overflow-y: auto;
        }

        .err-details-row {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .err-details-label {
          font-size: 10px;
          font-weight: 800;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .err-details-code {
          font-family: "SF Mono", Monaco, Consolas, monospace;
          font-size: 12px;
          color: #fbbf24;
          background: rgba(251, 191, 36, 0.08);
          padding: 8px 10px;
          border-radius: 6px;
          word-break: break-all;
          line-height: 1.5;
        }

        .err-details-stack {
          font-family: "SF Mono", Monaco, Consolas, monospace;
          font-size: 11px;
          color: #94a3b8;
          background: rgba(0, 0, 0, 0.3);
          padding: 12px;
          border-radius: 6px;
          overflow-x: auto;
          white-space: pre-wrap;
          line-height: 1.5;
          margin: 0;
        }

        /* ===== Responsive ===== */
        @media (max-width: 640px) {
          .err-icon {
            width: 84px;
            height: 84px;
            font-size: 34px;
            border-radius: 24px;
          }

          .err-icon-pulse {
            inset: -14px;
            border-radius: 30px;
          }

          .err-title {
            font-size: 24px;
          }

          .err-subtitle {
            font-size: 14px;
          }

          .err-actions {
            width: 100%;
            flex-direction: column;
          }

          .err-btn {
            width: 100%;
            justify-content: center;
          }

          .err-links-grid {
            flex-direction: column;
          }

          .err-link {
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
}