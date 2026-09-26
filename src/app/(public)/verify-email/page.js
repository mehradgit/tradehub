// src/app/(public)/verify-email/page.js
"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "react-toastify";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const email = searchParams.get("email");

  const [status, setStatus] = useState("loading"); // loading | success | error
  const [message, setMessage] = useState("");
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (!token || !email) {
      setStatus("error");
      setMessage(
        "Invalid verification link. The link may be broken or incomplete.",
      );
      return;
    }

    const verifyEmail = async () => {
      try {
        const res = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, email }),
        });

        const data = await res.json();
        if (res.ok) {
          setStatus("success");
          setMessage(
            "Email verified successfully! Redirecting to complete your profile...",
          );
          setTimeout(() => {
            router.push(
              `/complete-registration?email=${encodeURIComponent(email)}&token=${token}`,
            );
          }, 2500);
        } else {
          setStatus("error");
          setMessage(
            data.message || "Verification failed. The link may have expired.",
          );
        }
      } catch (error) {
        setStatus("error");
        setMessage("Something went wrong. Please try again.");
      }
    };

    verifyEmail();
  }, [token, email, router]);

  const handleResend = async () => {
    if (!email) return;
    setResending(true);
    try {
      const res = await fetch("/api/auth/send-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (res.ok) {
        toast.success("New verification link sent. Please check your inbox.");
      } else {
        toast.error(data.message || "Failed to resend verification email");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="verify-page">
      <div className="verify-card">
        {status === "loading" && (
          <>
            <div className="verify-icon loading">
              <div
                className="spinner-border"
                style={{ color: "#13795b" }}
              ></div>
            </div>
            <h2 className="verify-title">Verifying your email...</h2>
            <p className="verify-subtitle">
              Please wait while we confirm your email address.
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="verify-icon success">
              <i className="fas fa-check"></i>
            </div>
            <h2 className="verify-title">Email Verified!</h2>
            <p className="verify-subtitle">{message}</p>
            <div className="verify-progress">
              <div className="verify-progress-bar"></div>
            </div>
          </>
        )}

        {status === "error" && (
          <>
            <div className="verify-icon error">
              <i className="fas fa-times"></i>
            </div>
            <h2 className="verify-title">Verification Failed</h2>
            <p className="verify-subtitle">{message}</p>

            <div className="verify-actions">
              {email && (
                <button
                  className="verify-btn primary"
                  onClick={handleResend}
                  disabled={resending}
                >
                  {resending ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Sending...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-redo"></i>
                      Resend Verification Email
                    </>
                  )}
                </button>
              )}
              <Link href="/login" className="verify-btn ghost">
                <i className="fas fa-sign-in-alt"></i>
                Back to Login
              </Link>
              <Link href="/register" className="verify-btn ghost">
                <i className="fas fa-user-plus"></i>
                Register Again
              </Link>
            </div>
          </>
        )}
      </div>

      <style jsx>{`
        .verify-page {
          min-height: 80vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
          background: linear-gradient(180deg, #f6f8f9 0%, #eef4f2 100%);
        }
        .verify-card {
          background: white;
          border-radius: 24px;
          padding: 48px 40px;
          max-width: 480px;
          width: 100%;
          text-align: center;
          box-shadow: 0 20px 60px rgba(19, 58, 46, 0.08);
          border: 1px solid #e2e9e5;
        }
        .verify-icon {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          margin: 0 auto 24px;
          display: grid;
          place-items: center;
          font-size: 32px;
          color: white;
        }
        .verify-icon.loading {
          background: #eaf7f1;
        }
        .verify-icon.loading :global(.spinner-border) {
          width: 40px;
          height: 40px;
        }
        .verify-icon.success {
          background: linear-gradient(135deg, #13795b, #1d9a71);
          box-shadow: 0 12px 32px rgba(19, 121, 91, 0.25);
        }
        .verify-icon.error {
          background: linear-gradient(135deg, #ef4444, #dc2626);
          box-shadow: 0 12px 32px rgba(239, 68, 68, 0.25);
        }
        .verify-title {
          font-family: "Manrope", sans-serif;
          font-size: 24px;
          font-weight: 800;
          color: #13251f;
          margin-bottom: 10px;
          letter-spacing: -0.5px;
        }
        .verify-subtitle {
          font-size: 14.5px;
          color: #71807b;
          line-height: 1.6;
          margin-bottom: 28px;
        }
        .verify-progress {
          height: 4px;
          background: #f0f4f2;
          border-radius: 4px;
          overflow: hidden;
          margin-top: 20px;
        }
        .verify-progress-bar {
          height: 100%;
          background: linear-gradient(90deg, #13795b, #1d9a71);
          border-radius: 4px;
          animation: verifyProgress 2.5s linear forwards;
        }
        @keyframes verifyProgress {
          from {
            width: 0%;
          }
          to {
            width: 100%;
          }
        }
        .verify-actions {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .verify-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px 22px;
          border-radius: 50px;
          font-size: 14px;
          font-weight: 700;
          text-decoration: none;
          cursor: pointer;
          transition: 0.2s;
          border: none;
          font-family: inherit;
        }
        .verify-btn.primary {
          background: linear-gradient(135deg, #13795b, #1d9a71);
          color: white;
          box-shadow: 0 8px 20px rgba(19, 121, 91, 0.25);
        }
        .verify-btn.primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 12px 28px rgba(19, 121, 91, 0.35);
        }
        .verify-btn.primary:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        .verify-btn.ghost {
          background: white;
          color: #33413d;
          border: 1.5px solid #e2e9e5;
        }
        .verify-btn.ghost:hover {
          border-color: #13795b;
          color: #13795b;
          transform: translateY(-2px);
        }
      `}</style>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="verify-page" style={{ minHeight: "80vh" }}>
          <div className="spinner-border" style={{ color: "#13795b" }}></div>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
