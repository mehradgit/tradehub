// src/components/ui/LoginModal.js
"use client";

import { useState, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "react-toastify";

export default function LoginModal({ isOpen, onClose, redirectUrl }) {
  const router = useRouter();
  const { update } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Prevent background scrolling while the modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // ====== Sign in with email and password ======
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid email or password");
      setLoading(false);
    } else {
      toast.success("Logged in successfully!");
      await update(); // refresh the session
      onClose();
      setLoading(false);
      // Return to the previous page
      if (redirectUrl) {
        window.location.href = redirectUrl;
      } else {
        router.back();
      }
    }
  };

  // ====== Sign in with Google ======
  const handleGoogleLogin = async () => {
    // ✅ For Google, set callbackUrl to redirectUrl or the previous page
    const callbackUrl = redirectUrl || window.location.pathname;
    await signIn("google", { callbackUrl });
  };

  // ====== Close on backdrop click ======
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="login-modal-overlay"
      onClick={handleOverlayClick}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0, 0, 0, 0.6)",
        backdropFilter: "blur(6px)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        animation: "fadeIn 0.3s ease",
        padding: "20px",
      }}
    >
      <div
        className="login-modal"
        style={{
          background: "#ffffff",
          borderRadius: "24px",
          padding: "32px",
          maxWidth: "420px",
          width: "100%",
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: "0 30px 80px rgba(0, 0, 0, 0.25)",
          animation: "slideUp 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)",
          position: "relative",
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "16px",
            right: "20px",
            fontSize: "20px",
            background: "none",
            border: "none",
            color: "#7a6e64",
            cursor: "pointer",
            transition: "all 0.3s ease",
            padding: "4px 8px",
            borderRadius: "8px",
          }}
          onMouseEnter={(e) => {
            e.target.style.color = "#1e1916";
            e.target.style.background = "#f9f7f4";
          }}
          onMouseLeave={(e) => {
            e.target.style.color = "#7a6e64";
            e.target.style.background = "transparent";
          }}
        >
          <i className="fas fa-times"></i>
        </button>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <h3
            style={{
              fontSize: "20px",
              fontWeight: 700,
              color: "#1e1916",
              margin: "0 0 4px 0",
              fontFamily: "Poppins, sans-serif",
            }}
          >
            Sign In to Continue
          </h3>
          <p style={{ fontSize: "14px", color: "#7a6e64", margin: 0 }}>
            Please sign in to send a request to the supplier
          </p>
        </div>

        {/* Login form */}
        <form
          onSubmit={handleLogin}
          style={{ display: "flex", flexDirection: "column", gap: "14px" }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <label
              style={{ fontSize: "13px", fontWeight: 600, color: "#3d352e" }}
            >
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              style={{
                padding: "10px 14px",
                border: "1.5px solid #e8e2da",
                borderRadius: "12px",
                fontSize: "14px",
                transition: "all 0.3s ease",
                fontFamily: "Inter, sans-serif",
                outline: "none",
                width: "100%",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#e85d3a";
                e.target.style.boxShadow = "0 0 0 3px rgba(232, 93, 58, 0.1)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#e8e2da";
                e.target.style.boxShadow = "none";
              }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <label
              style={{ fontSize: "13px", fontWeight: 600, color: "#3d352e" }}
            >
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              style={{
                padding: "10px 14px",
                border: "1.5px solid #e8e2da",
                borderRadius: "12px",
                fontSize: "14px",
                transition: "all 0.3s ease",
                fontFamily: "Inter, sans-serif",
                outline: "none",
                width: "100%",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#e85d3a";
                e.target.style.boxShadow = "0 0 0 3px rgba(232, 93, 58, 0.1)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#e8e2da";
                e.target.style.boxShadow = "none";
              }}
            />
          </div>

          {error && (
            <div
              style={{
                color: "#e74c3c",
                fontSize: "13px",
                textAlign: "center",
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "12px",
              background: "#e85d3a",
              color: "white",
              border: "none",
              borderRadius: "12px",
              fontSize: "16px",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.3s ease",
              fontFamily: "Inter, sans-serif",
              opacity: loading ? 0.6 : 1,
              width: "100%",
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.target.style.background = "#c73e1d";
                e.target.style.transform = "translateY(-2px)";
              }
            }}
            onMouseLeave={(e) => {
              e.target.style.background = "#e85d3a";
              e.target.style.transform = "translateY(0)";
            }}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        {/* Divider */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            margin: "16px 0",
          }}
        >
          <div style={{ flex: 1, height: "1px", background: "#e8e2da" }}></div>
          <span
            style={{ padding: "0 16px", fontSize: "13px", color: "#7a6e64" }}
          >
            or
          </span>
          <div style={{ flex: 1, height: "1px", background: "#e8e2da" }}></div>
        </div>

        {/* Google button */}
        <button
          onClick={handleGoogleLogin}
          style={{
            width: "100%",
            padding: "12px",
            background: "white",
            color: "#333",
            border: "1.5px solid #e8e2da",
            borderRadius: "12px",
            fontSize: "15px",
            fontWeight: 500,
            cursor: "pointer",
            transition: "all 0.3s ease",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
            fontFamily: "Inter, sans-serif",
          }}
          onMouseEnter={(e) => {
            e.target.style.borderColor = "#e85d3a";
            e.target.style.background = "rgba(232, 93, 58, 0.02)";
          }}
          onMouseLeave={(e) => {
            e.target.style.borderColor = "#e8e2da";
            e.target.style.background = "white";
          }}
        >
          <i
            className="fab fa-google"
            style={{ color: "#ea4335", fontSize: "18px" }}
          ></i>
          Continue with Google
        </button>

        {/* Register link */}
        <div
          style={{
            textAlign: "center",
            marginTop: "16px",
            fontSize: "14px",
            color: "#7a6e64",
          }}
        >
          Don't have an account?{" "}
          <Link
            href="/register"
            onClick={onClose}
            style={{
              color: "#e85d3a",
              fontWeight: 600,
              textDecoration: "none",
            }}
            onMouseEnter={(e) => {
              e.target.style.textDecoration = "underline";
            }}
            onMouseLeave={(e) => {
              e.target.style.textDecoration = "none";
            }}
          >
            Create Account
          </Link>
        </div>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
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
        .login-modal {
          animation: slideUp 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .login-modal-overlay {
          animation: fadeIn 0.3s ease;
        }
        /* Scrollbar for long content */
        .login-modal::-webkit-scrollbar {
          width: 4px;
        }
        .login-modal::-webkit-scrollbar-thumb {
          background: #e8e2da;
          border-radius: 4px;
        }
        .login-modal::-webkit-scrollbar-track {
          background: transparent;
        }
      `}</style>
    </div>
  );
}
