// src/app/(public)/forgot-password/page.js
"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import Captcha from "@/components/ui/Captcha";

export default function ForgotPasswordPage() {
  const captchaRef = useRef(null);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const { answer, token } = captchaRef.current?.getPayload() || {};
    if (!answer || !token) {
      setError("Please answer the security question.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          captchaAnswer: answer,
          captchaToken: token,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to send reset link");
      }

      setSent(true);
    } catch (err) {
      setError(err.message);
      captchaRef.current?.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
      <div
        className="container"
        style={{ maxWidth: "440px", marginTop: "60px", marginBottom: "60px" }}
      >
        <div className="card shadow-lg border-0 rounded-4 p-4">
          <div className="text-center mb-4">
            <div
              className="mx-auto mb-3 d-flex align-items-center justify-content-center"
              style={{
                width: "64px",
                height: "64px",
                background: "linear-gradient(135deg, #f59e0b, #d97706)",
                borderRadius: "16px",
              }}
            >
              <i className="fas fa-key text-white fs-2"></i>
            </div>
            <h2 className="fw-bold">Forgot Password?</h2>
            <p className="text-muted">
              Enter your email and we'll send you a link to reset it.
            </p>
          </div>

          {sent ? (
            <div className="alert alert-success" role="alert">
              <i className="fas fa-check-circle me-2"></i>
              If an account with this email exists, we've sent a password reset
              link. Please check your inbox (and spam folder).
              <hr />
              <Link
                href="/login"
                className="fw-bold text-decoration-none"
                style={{ color: "#0b5b43" }}
              >
                <i className="fas fa-arrow-left me-1"></i>
                Back to Login
              </Link>
            </div>
          ) : (
            <>
              {error && (
                <div className="alert alert-danger py-2" role="alert">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label fw-semibold">
                    Email Address
                  </label>
                  <input
                    type="email"
                    className="form-control form-control-lg"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>

                <Captcha ref={captchaRef} disabled={loading} />

                <button
                  type="submit"
                  className="btn btn-lg w-100 fw-semibold text-white"
                  disabled={loading}
                  style={{
                    background: "linear-gradient(135deg, #f59e0b, #d97706)",
                    borderRadius: "50px",
                    border: "none",
                  }}
                >
                  {loading ? "Sending..." : "Send Reset Link"}
                </button>
              </form>

              <div className="text-center mt-4">
                <Link
                  href="/login"
                  className="text-decoration-none fw-bold"
                  style={{ color: "var(--primary, #13795b)", fontSize: 14 }}
                >
                  <i className="fas fa-arrow-left me-1"></i>
                  Back to Login
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
  );
}