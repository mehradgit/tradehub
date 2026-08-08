// src/app/login/page.js
"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCredentialsLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Invalid email or password");
    } else {
      router.push("/dashboard");
    }
  };

  const handleGoogleLogin = () => {
    signIn("google", { callbackUrl: "/register" });
  };
  return (
    <div className="container" style={{ maxWidth: "440px", marginTop: "60px" }}>
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
            <i className="fas fa-utensils text-white fs-2"></i>
          </div>
          <h2 className="fw-bold">Welcome Back</h2>
          <p className="text-muted">Sign in to your account to continue</p>
        </div>

        {error && (
          <div className="alert alert-danger py-2" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleCredentialsLogin}>
          <div className="mb-3">
            <label className="form-label fw-semibold">Email Address</label>
            <input
              type="email"
              className="form-control form-control-lg"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label fw-semibold">Password</label>
            <input
              type="password"
              className="form-control form-control-lg"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg w-100 fw-semibold"
            disabled={loading}
            style={{
              background: "var(--color-primary, #e85d3a)",
              borderColor: "var(--color-primary, #e85d3a)",
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
          className="btn btn-outline-danger btn-lg w-100 fw-semibold"
          style={{ borderRadius: "50px" }}
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
              style={{ color: "var(--color-primary, #e85d3a)" }}
            >
              Create Account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
