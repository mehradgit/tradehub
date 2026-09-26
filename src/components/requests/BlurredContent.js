// src/components/requests/BlurredContent.js
"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";

export default function BlurredContent({
  children,
  permissionInfo,
  requestOwnerId,
  compact = false,
}) {
  const { data: session } = useSession();
  const reason = permissionInfo?.reason;

  const renderMessage = () => {
    if (reason === "login_required") {
      return {
        icon: "fa-lock",
        title: "Sign in to view",
        subtitle: "Login to see the full details of this request.",
        buttonText: "Sign In",
        buttonLink: "/login",
        buttonClass: "btn-blur-login",
      };
    }

    if (reason === "upgrade_required") {
      return {
        icon: "fa-crown",
        title: "Upgrade your plan",
        subtitle: `Your current plan (${permissionInfo.currentPlan || "Basic"}) doesn't allow viewing this content.`,
        buttonText: "View Plans",
        buttonLink: "/plans",
        buttonClass: "btn-blur-upgrade",
      };
    }

    if (reason === "quota_exhausted") {
      return {
        icon: "fa-hourglass-end",
        title: "Monthly quota exhausted",
        subtitle: `You've used ${permissionInfo.used} of ${permissionInfo.limit} monthly inquiries.`,
        buttonText: "Upgrade Plan",
        buttonLink: "/plans",
        buttonClass: "btn-blur-upgrade",
      };
    }

    return {
      icon: "fa-eye-slash",
      title: "Details hidden",
      subtitle: "You don't have permission to view this content.",
      buttonText: "View Plans",
      buttonLink: "/plans",
      buttonClass: "btn-blur-upgrade",
    };
  };

  const msg = renderMessage();

  return (
    <div className={`blurred-wrapper ${compact ? "blurred-compact" : ""}`}>
      {/* محتوای بلور شده */}
      <div className="blurred-content">{children}</div>

      {/* Overlay */}
      <div className="blurred-overlay">
        <div className={`blurred-overlay-card ${compact ? "compact" : ""}`}>
          <div className="blurred-icon">
            <i className={`fa-solid ${msg.icon}`}></i>
          </div>
          <h3 className="blurred-title">{msg.title}</h3>
          {!compact && <p className="blurred-subtitle">{msg.subtitle}</p>}
          <Link
            href={msg.buttonLink}
            className={msg.buttonClass}
            style={{ textDecoration: "none" }}
          >
            {msg.buttonText} <i className="fa-solid fa-arrow-right"></i>
          </Link>
        </div>
      </div>
    </div>
  );
}