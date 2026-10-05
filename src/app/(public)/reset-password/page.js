// src/app/(public)/reset-password/page.js
"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "react-toastify";
import Layout from "@/components/layout/Layout";

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const token = searchParams.get("token");
  const email = searchParams.get("email");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!token || !email) {
      setError(
        "Invalid reset link. Please request a new password reset email."
      );
    }
  }, [token, email]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, email, newPassword: password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to reset password");
      }

      setSuccess(true);
      toast.success("Password reset successfully!");
      setTimeout(() => {
        router.replace("/login?reset=true");
      }, 2500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Password strength icon
  const getStrength = () => {
    if (!password) return { level: 0, label: "", color: "" };
    if (password.length < 6) return { level: 1, label: "Weak", color: "#ef4444" };
    if (password.length < 10)
      return { level: 2, label: "Medium", color: "#f59e0b" };
    if (/[A-Z]/.test(password) && /[0-9]/.test(password) && password.length >= 10)
      return { level: 4, label: "Strong", color: "#13795b" };
    return { level: 3, label: "Good", color: "#22c55e" };
  };

  const strength = getStrength();

  return (
    <Layout>
      <div
        className="container"
        style={{ maxWidth: "460px", marginTop: "60px", marginBottom: "60px" }}
      >
        <div className="card shadow-lg border-0 rounded-4 p-4">
          <div className="text-center mb-4">
            <div
              className="mx-auto mb-3 d-flex align-items-center justify-content-center"
              style={{
                width: "64px",
                height: "64px",
                background: "linear-gradient(135deg, #13795b, #1d9a71)",
                borderRadius: "16px",
              }}
            >
              <i className="fas fa-lock text-white fs-2"></i>
            </div>
            <h2 className="fw-bold">Set New Password</h2>
            <p className="text-muted">
              Choose a strong password to secure your account.
            </p>
          </div>

          {success ? (
            <div className="alert alert-success" role="alert">
              <i className="fas fa-check-circle me-2"></i>
              Password reset successfully! Redirecting to login...
              <div className="progress mt-3" style={{ height: 4 }}>
                <div
                  className="progress-bar"
                  style={{
                    width: "100%",
                    background: "linear-gradient(90deg, #13795b, #1d9a71)",
                    animation: "resetProgress 2.5s linear forwards",
                  }}
                ></div>
              </div>
            </div>
          ) : (
            <>
              {error && (
                <div className="alert alert-danger py-2" role="alert">
                  {error}
                </div>
              )}

              {!token || !email ? (
                <div className="text-center">
                  <Link
                    href="/forgot-password"
                    className="btn btn-primary w-100"
                    style={{ borderRadius: "50px" }}
                  >
                    Request New Reset Link
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">
                      New Password
                    </label>
                    <div style={{ position: "relative" }}>
                      <input
                        type={showPassword ? "text" : "password"}
                        className="form-control form-control-lg"
                        placeholder="Minimum 8 characters"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={loading}
                        style={{ paddingRight: 45 }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((p) => !p)}
                        style={{
                          position: "absolute",
                          right: 14,
                          top: "50%",
                          transform: "translateY(-50%)",
                          background: "transparent",
                          border: "none",
                          color: "#71807b",
                          cursor: "pointer",
                          padding: 0,
                        }}
                        tabIndex={-1}
                      >
                        <i
                          className={`fas fa-eye${showPassword ? "-slash" : ""}`}
                        ></i>
                      </button>
                    </div>

                    {/* Strength indicator */}
                    {password && (
                      <div className="mt-2">
                        <div className="d-flex gap-1 mb-1">
                          {[1, 2, 3, 4].map((i) => (
                            <div
                              key={i}
                              style={{
                                flex: 1,
                                height: 4,
                                borderRadius: 4,
                                background:
                                  i <= strength.level
                                    ? strength.color
                                    : "#e8edf0",
                                transition: "0.2s",
                              }}
                            />
                          ))}
                        </div>
                        <small
                          style={{
                            color: strength.color,
                            fontWeight: 700,
                            fontSize: 12,
                          }}
                        >
                          {strength.label}
                        </small>
                      </div>
                    )}
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">
                      Confirm Password
                    </label>
                    <input
                      type={showPassword ? "text" : "password"}
                      className="form-control form-control-lg"
                      placeholder="Re-enter your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      disabled={loading}
                    />
                    {confirmPassword && password !== confirmPassword && (
                      <small
                        className="d-block mt-1"
                        style={{ color: "#dc2626", fontSize: 12 }}
                      >
                        <i className="fas fa-times-circle me-1"></i>
                        Passwords do not match
                      </small>
                    )}
                    {confirmPassword &&
                      password === confirmPassword &&
                      password.length >= 8 && (
                        <small
                          className="d-block mt-1"
                          style={{ color: "#13795b", fontSize: 12 }}
                        >
                          <i className="fas fa-check-circle me-1"></i>
                          Passwords match
                        </small>
                      )}
                  </div>

                  <button
                    type="submit"
                    className="btn btn-lg w-100 fw-semibold text-white"
                    disabled={loading || password !== confirmPassword}
                    style={{
                      background: "linear-gradient(135deg, #13795b, #1d9a71)",
                      borderRadius: "50px",
                      border: "none",
                    }}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Resetting...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-check me-2"></i>
                        Reset Password
                      </>
                    )}
                  </button>

                  <div className="text-center mt-3">
                    <Link
                      href="/login"
                      className="text-decoration-none fw-bold"
                      style={{ color: "var(--gray, #71807b)", fontSize: 13 }}
                    >
                      <i className="fas fa-arrow-left me-1"></i>
                      Back to Login
                    </Link>
                  </div>
                </form>
              )}
            </>
          )}
        </div>

        <style jsx>{`
          @keyframes resetProgress {
            from {
              width: 0%;
            }
            to {
              width: 100%;
            }
          }
        `}</style>
      </div>
    </Layout>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <Layout>
          <div className="container text-center py-5">
            <div className="spinner-border text-primary"></div>
          </div>
        </Layout>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}