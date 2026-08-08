// src/app/register/page.js
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import Layout from "@/components/layout/Layout";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Registration failed");
      }

      setSuccess(true);
      // پس از ثبت‌نام موفق، کاربر به صفحه لاگین می‌رود
      // یا می‌توانیم پیام موفقیت نشان دهیم
      setTimeout(() => {
        router.push("/login?registered=true");
      }, 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    signIn("google", { callbackUrl: "/complete-registration" });
  };

  return (
    <Layout>
      <div className="container" style={{ maxWidth: "440px", marginTop: "60px", marginBottom: "60px" }}>
        <div className="card shadow-lg border-0 rounded-4 p-4">
          <div className="text-center mb-4">
            <div
              className="mx-auto mb-3 d-flex align-items-center justify-content-center"
              style={{
                width: "64px",
                height: "64px",
                background: "var(--color-primary, #e85d3a)",
                borderRadius: "16px",
              }}
            >
              <i className="fas fa-user-plus text-white fs-2"></i>
            </div>
            <h2 className="fw-bold">Create Account</h2>
            <p className="text-muted">Join the largest B2B food marketplace</p>
          </div>

          {success && (
            <div className="alert alert-success py-2" role="alert">
              <i className="fas fa-check-circle me-2"></i>
              Registration successful! Please check your email to verify your account.
              <br />
              <small>Redirecting to login...</small>
            </div>
          )}

          {error && (
            <div className="alert alert-danger py-2" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label fw-semibold">Email Address <span className="text-danger">*</span></label>
              <input
                type="email"
                className="form-control form-control-lg"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={success}
              />
            </div>

            <div className="mb-3">
              <label className="form-label fw-semibold">Password <span className="text-danger">*</span></label>
              <input
                type="password"
                className="form-control form-control-lg"
                placeholder="Minimum 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={success}
              />
            </div>

            <div className="mb-3">
              <label className="form-label fw-semibold">Confirm Password <span className="text-danger">*</span></label>
              <input
                type="password"
                className="form-control form-control-lg"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={success}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg w-100 fw-semibold"
              style={{
                background: "var(--color-primary, #e85d3a)",
                borderColor: "var(--color-primary, #e85d3a)",
                borderRadius: "50px",
              }}
              disabled={loading || success}
            >
              {loading ? "Creating Account..." : "Create Account"}
            </button>
          </form>

          <div className="d-flex align-items-center my-4">
            <hr className="flex-grow-1" />
            <span className="mx-3 text-muted small">or</span>
            <hr className="flex-grow-1" />
          </div>

          <button
            onClick={handleGoogleSignIn}
            className="btn btn-outline-danger btn-lg w-100 fw-semibold"
            style={{ borderRadius: "50px" }}
            disabled={success}
          >
            <i className="fab fa-google me-2"></i>
            Continue with Google
          </button>

          <div className="text-center mt-4">
            <p className="text-muted">
              Already have an account?{" "}
              <Link
                href="/login"
                className="fw-bold text-decoration-none"
                style={{ color: "var(--color-primary, #e85d3a)" }}
              >
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}