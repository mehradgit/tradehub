// src/app/global-error.js
"use client";

import { useEffect } from "react";

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    console.error("Global error:", error);
  }, [error]);

  const isDev = process.env.NODE_ENV === "development";

  return (
    <html lang="en">
      <head>
        <title>Critical Error | FoodTradeHub</title>
      </head>
      <body style={{ margin: 0, padding: 0 }}>
        <div className="gerr-page">
          <div className="gerr-container">
            {/* Icon */}
            <div className="gerr-icon-wrap">
              <div className="gerr-icon">
                {/* Plug with X icon (SVG) */}
                <svg
                  width="46"
                  height="46"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M12 22v-5" />
                  <path d="M9 8V2" />
                  <path d="M15 8V2" />
                  <path d="M18 8v3a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V8" />
                  <path d="M14 16l6 6" />
                  <path d="M20 16l-6 6" />
                </svg>
              </div>
              <div className="gerr-icon-pulse"></div>
            </div>

            {/* Content */}
            <div className="gerr-content">
              <div className="gerr-badge">
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                Critical System Error
              </div>

              <h1 className="gerr-title">Something went very wrong.</h1>

              <p className="gerr-subtitle">
                The application encountered a critical error and couldn&apos;t
                load properly. Please try reloading the page. If the problem
                persists, contact our support team.
              </p>

              {/* Actions */}
              <div className="gerr-actions">
                <button
                  onClick={() => reset()}
                  className="gerr-btn primary"
                  type="button"
                >
                  {/* Rotate right icon */}
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M21 12a9 9 0 1 1-3-6.7L21 8" />
                    <path d="M21 3v5h-5" />
                  </svg>
                  Reload Application
                </button>
                <a href="/" className="gerr-btn ghost">
                  {/* Home icon */}
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                  </svg>
                  Back to Home
                </a>
              </div>

              {/* Info */}
              <div className="gerr-info">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                  style={{ flexShrink: 0 }}
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
                <span>
                  If this keeps happening, please contact us at{" "}
                  <a href="mailto:support@foodtradehub.com">
                    support@foodtradehub.com
                  </a>
                </span>
              </div>
            </div>

            {/* Dev details */}
            {isDev && error?.message && (
              <div className="gerr-details">
                <div className="gerr-details-title">
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <polyline points="16 18 22 12 16 6" />
                    <polyline points="8 6 2 12 8 18" />
                  </svg>
                  Developer Details
                </div>
                <div className="gerr-details-body">
                  <div className="gerr-details-label">Message:</div>
                  <code className="gerr-details-code">{error.message}</code>
                  {error.digest && (
                    <>
                      <div className="gerr-details-label">Digest:</div>
                      <code className="gerr-details-code">
                        {error.digest}
                      </code>
                    </>
                  )}
                  {error.stack && (
                    <>
                      <div className="gerr-details-label">Stack:</div>
                      <pre className="gerr-details-stack">{error.stack}</pre>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <style jsx global>{`
          .gerr-page {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 40px 20px;
            background:
              radial-gradient(circle at 20% 20%, rgba(239, 68, 68, 0.06) 0%, transparent 40%),
              radial-gradient(circle at 80% 80%, rgba(139, 92, 246, 0.05) 0%, transparent 40%),
              linear-gradient(180deg, #f6f8f9 0%, #f5f0f0 100%);
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            position: relative;
            overflow: hidden;
          }

          .gerr-page::before {
            content: "";
            position: absolute;
            width: 500px;
            height: 500px;
            border-radius: 50%;
            border: 60px solid rgba(239, 68, 68, 0.04);
            top: -250px;
            right: -100px;
            pointer-events: none;
          }

          .gerr-page::after {
            content: "";
            position: absolute;
            width: 400px;
            height: 400px;
            border-radius: 50%;
            border: 50px solid rgba(139, 92, 246, 0.03);
            bottom: -200px;
            left: -100px;
            pointer-events: none;
          }

          .gerr-container {
            max-width: 720px;
            width: 100%;
            text-align: center;
            position: relative;
            z-index: 1;
            animation: gerrFadeUp 0.6s cubic-bezier(0.4, 0, 0.2, 1);
          }

          @keyframes gerrFadeUp {
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
          .gerr-icon-wrap {
            position: relative;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 32px;
          }

          .gerr-icon {
            width: 110px;
            height: 110px;
            border-radius: 30px;
            background: linear-gradient(135deg, #ef4444 0%, #7f1d1d 100%);
            display: grid;
            place-items: center;
            color: white;
            position: relative;
            z-index: 2;
            box-shadow:
              0 20px 50px rgba(239, 68, 68, 0.35),
              inset 0 -10px 30px rgba(0, 0, 0, 0.15);
          }

          .gerr-icon-pulse {
            position: absolute;
            inset: -20px;
            border-radius: 40px;
            border: 3px solid rgba(239, 68, 68, 0.25);
            animation: gerrPulse 2s ease-in-out infinite;
          }

          @keyframes gerrPulse {
            0%, 100% {
              transform: scale(1);
              opacity: 0.7;
            }
            50% {
              transform: scale(1.15);
              opacity: 0;
            }
          }

          /* ===== Content ===== */
          .gerr-content {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 16px;
          }

          .gerr-badge {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 6px 16px;
            border-radius: 50px;
            background: rgba(239, 68, 68, 0.1);
            color: #dc2626;
            font-size: 11.5px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.8px;
          }

          .gerr-title {
            font-size: 32px;
            font-weight: 800;
            color: #0b1f18;
            letter-spacing: -0.03em;
            margin: 0;
            line-height: 1.2;
          }

          .gerr-subtitle {
            font-size: 15px;
            color: #64748b;
            line-height: 1.7;
            max-width: 520px;
            margin: 0;
          }

          /* ===== Actions ===== */
          .gerr-actions {
            display: flex;
            gap: 12px;
            margin-top: 12px;
            flex-wrap: wrap;
            justify-content: center;
          }

          .gerr-btn {
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

          .gerr-btn.primary {
            background: linear-gradient(135deg, #ef4444, #dc2626);
            color: white;
            box-shadow: 0 8px 24px rgba(239, 68, 68, 0.35);
          }

          .gerr-btn.primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 12px 32px rgba(239, 68, 68, 0.45);
          }

          .gerr-btn.ghost {
            background: white;
            color: #334155;
            border: 1px solid #e8edf0;
          }

          .gerr-btn.ghost:hover {
            border-color: #ef4444;
            color: #ef4444;
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(239, 68, 68, 0.15);
          }

          /* ===== Info Box ===== */
          .gerr-info {
            margin-top: 30px;
            padding: 14px 20px;
            border-radius: 12px;
            background: rgba(99, 102, 241, 0.06);
            border: 1px solid rgba(99, 102, 241, 0.15);
            display: inline-flex;
            align-items: center;
            gap: 10px;
            font-size: 12.5px;
            color: #475569;
            line-height: 1.5;
          }

          .gerr-info svg {
            color: #6366f1;
            flex-shrink: 0;
          }

          .gerr-info a {
            color: #6366f1;
            font-weight: 700;
            text-decoration: none;
          }

          .gerr-info a:hover {
            text-decoration: underline;
          }

          /* ===== Dev Details ===== */
          .gerr-details {
            margin-top: 30px;
            text-align: left;
            background: #0b1f18;
            border-radius: 12px;
            overflow: hidden;
            border: 1px solid #1e3a31;
          }

          .gerr-details-title {
            padding: 12px 16px;
            background: rgba(239, 68, 68, 0.1);
            color: #ef4444;
            font-size: 12px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.6px;
            display: flex;
            align-items: center;
            gap: 8px;
            border-bottom: 1px solid #1e3a31;
          }

          .gerr-details-body {
            padding: 16px;
            display: flex;
            flex-direction: column;
            gap: 10px;
            max-height: 400px;
            overflow-y: auto;
          }

          .gerr-details-label {
            font-size: 10px;
            font-weight: 800;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-top: 4px;
          }

          .gerr-details-code {
            font-family: "SF Mono", Monaco, Consolas, monospace;
            font-size: 12px;
            color: #fbbf24;
            background: rgba(251, 191, 36, 0.08);
            padding: 8px 10px;
            border-radius: 6px;
            word-break: break-all;
            line-height: 1.5;
          }

          .gerr-details-stack {
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
            .gerr-icon {
              width: 84px;
              height: 84px;
              border-radius: 24px;
            }

            .gerr-icon svg {
              width: 34px;
              height: 34px;
            }

            .gerr-icon-pulse {
              inset: -14px;
              border-radius: 30px;
            }

            .gerr-title {
              font-size: 24px;
            }

            .gerr-subtitle {
              font-size: 14px;
            }

            .gerr-actions {
              width: 100%;
              flex-direction: column;
            }

            .gerr-btn {
              width: 100%;
              justify-content: center;
            }

            .gerr-info {
              flex-direction: column;
              text-align: center;
            }
          }
        `}</style>
      </body>
    </html>
  );
}