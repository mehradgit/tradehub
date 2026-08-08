// src/app/verify-email/page.js
"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const email = searchParams.get("email");
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token || !email) {
      setStatus("error");
      setMessage("Invalid verification link.");
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
          setMessage("Email verified successfully! Redirecting...");
          setTimeout(() => {
            router.push(`/complete-registration?email=${encodeURIComponent(email)}`);
          }, 2000);
        } else {
          setStatus("error");
          setMessage(data.message || "Verification failed.");
        }
      } catch (error) {
        setStatus("error");
        setMessage("Something went wrong.");
      }
    };

    verifyEmail();
  }, [token, email, router]);

  return (
    <div className="container" style={{ maxWidth: "500px", marginTop: "80px" }}>
      <div className="card shadow p-4 text-center">
        {status === "loading" && (
          <>
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3">Verifying your email...</p>
          </>
        )}
        {status === "success" && (
          <>
            <i className="fas fa-check-circle text-success fs-1"></i>
            <h4 className="mt-3">{message}</h4>
          </>
        )}
        {status === "error" && (
          <>
            <i className="fas fa-times-circle text-danger fs-1"></i>
            <h4 className="mt-3">{message}</h4>
            <a href="/login" className="btn btn-primary mt-3">Go to Login</a>
          </>
        )}
      </div>
    </div>
  );
}