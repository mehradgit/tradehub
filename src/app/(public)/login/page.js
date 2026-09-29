// src/app/(public)/login/page.js
"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "react-toastify";
import Captcha from "@/components/ui/Captcha";

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const captchaRef = useRef(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [unverifiedEmail, setUnverifiedEmail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (searchParams.get("reset") === "true") {
      toast.success("Password reset successfully! You can now sign in.");
    }
  }, [searchParams]);

  useEffect(() => {
    const urlError = searchParams.get("error");
    if (urlError === "OAuthAccountNotLinked") {
      setError(
        "An account with this email already exists. Please sign in with your password first.",
      );
    } else if (urlError === "OAuthCallback" || urlError === "OAuthSignin") {
      setError("Google sign-in failed. Please try again.");
    }
  }, [searchParams]);

  // ====== ورود با ایمیل/رمز ======
  const handleCredentialsLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setUnverifiedEmail(null);

    // ✅ بررسی کپچا
    const { answer, token } = captchaRef.current?.getPayload() || {};
    if (!answer || !token) {
      setError("Please answer the security question.");
      setLoading(false);
      return;
    }

    try {
      // ۱. اول چک می‌کنیم که اطلاعات درسته و ایمیل تأیید شده
      const checkRes = await fetch("/api/auth/check-credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          captchaAnswer: answer,
          captchaToken: token,
        }),
      });

      const checkData = await checkRes.json();

      if (!checkRes.ok) {
        // مدیریت خطاها بر اساس reason
        if (checkData.reason === "email_not_verified") {
          setUnverifiedEmail(checkData.email || email);
          setError(checkData.message);
        } else {
          setError(checkData.message || "Login failed");
        }
        // کپچا رو رفرش کن
        captchaRef.current?.refresh();
        setLoading(false);
        return;
      }

      // ۲. حالا signIn می‌کنیم (باید موفق باشه چون قبلاً چک کردیم)
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Login failed. Please try again.");
        captchaRef.current?.refresh();
        setLoading(false);
        return;
      }

      toast.success("Logged in successfully!");
      router.replace("/dashboard");
      router.refresh();
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
      captchaRef.current?.refresh();
    } finally {
      setLoading(false);
    }
  };

  // ====== ارسال مجدد ایمیل تأیید ======
  const handleResendVerification = async () => {
    if (!unverifiedEmail) return;
    setResending(true);
    try {
      const res = await fetch("/api/auth/send-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: unverifiedEmail }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Verification email sent! Please check your inbox.");
      } else {
        toast.error(data.message || "Failed to send verification email");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setResending(false);
    }
  };

  // ====== ورود با Google ======
  const handleGoogleLogin = () => {
    signIn("google", { callbackUrl: "/complete-registration" });
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
              background: "var(--primary, #13795b)",
              borderRadius: "16px",
            }}
          >
            <i className="fas fa-utensils text-white fs-2"></i>
          </div>
          <h2 className="fw-bold">Welcome Back</h2>
          <p className="text-muted">Sign in to your account to continue</p>
        </div>

        {error && (
          <div className="alert alert-danger py-2" role="alert">
            <div>{error}</div>

            {unverifiedEmail && (
              <button
                type="button"
                className="btn btn-sm btn-link p-0 mt-2 text-decoration-none fw-bold"
                onClick={handleResendVerification}
                disabled={resending}
              >
                {resending ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-1"></span>
                    Sending...
                  </>
                ) : (
                  <>
                    <i className="fas fa-redo me-1"></i>
                    Resend verification email
                  </>
                )}
              </button>
            )}
          </div>
        )}
        <form onSubmit={handleCredentialsLogin}>
          {/* Email */}
          <div className="mb-3">
            <label className="form-label fw-semibold">Email Address</label>
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

          {/* Password (فقط یک بار) */}
          <div className="mb-3">
            <div className="d-flex justify-content-between align-items-center mb-1">
              <label className="form-label fw-semibold mb-0">Password</label>
              <Link
                href="/forgot-password"
                className="text-decoration-none fw-semibold"
                style={{ color: "var(--primary, #13795b)", fontSize: 12.5 }}
              >
                Forgot Password?
              </Link>
            </div>
            <input
              type="password"
              className="form-control form-control-lg"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          {/* Captcha */}
          <Captcha ref={captchaRef} disabled={loading} />

          <button
            type="submit"
            className="btn btn-primary btn-lg w-100 fw-semibold"
            disabled={loading}
            style={{
              background: "var(--primary, #13795b)",
              borderColor: "var(--primary, #13795b)",
              borderRadius: "50px",
            }}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="d-flex align-items-center my-4">
          <hr className="flex-grow-1" />
          <span className="mx-3 text-muted small">or</span>
          <hr className="flex-grow-1" />
        </div>

        <button
          onClick={handleGoogleLogin}
          type="button"
          className="btn btn-outline-danger btn-lg w-100 fw-semibold"
          style={{ borderRadius: "50px" }}
          disabled={loading}
        >
          <i className="fab fa-google me-2"></i>
          Continue with Google
        </button>

        <div className="text-center mt-4">
          <p className="text-muted">
            Don't have an account?{" "}
            <Link
              href="/register"
              className="fw-bold text-decoration-none"
              style={{ color: "var(--primary, #13795b)" }}
            >
              Create Account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="container text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-muted mt-3">Loading...</p>
        </div>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}