// src/components/layout/Header.js
"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";

export default function Header() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, right: 0 });
  const [mounted, setMounted] = useState(false);

  const triggerRef = useRef(null);
  const dropdownRef = useRef(null);

  // برای رندر Portal فقط در سمت کلاینت
  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMobileMenu = () => setIsMenuOpen(false);

  // محاسبه موقعیت دراپ‌داون نسبت به دکمه
  const updateDropdownPosition = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom + 12,
        right: window.innerWidth - rect.right,
      });
    }
  };

  // بستن با کلیک بیرون
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        triggerRef.current &&
        !triggerRef.current.contains(e.target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target)
      ) {
        setIsUserMenuOpen(false);
      }
    };
    const handleEscape = (e) => {
      if (e.key === "Escape") setIsUserMenuOpen(false);
    };

    if (isUserMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
      window.addEventListener("resize", updateDropdownPosition);
      window.addEventListener("scroll", updateDropdownPosition, true);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
      window.removeEventListener("resize", updateDropdownPosition);
      window.removeEventListener("scroll", updateDropdownPosition, true);
    };
  }, [isUserMenuOpen]);

  // بستن دراپ‌داون هنگام تغییر مسیر
  useEffect(() => {
    setIsUserMenuOpen(false);
    setIsMenuOpen(false);
  }, [pathname]);

  const handleToggleUserMenu = () => {
    if (!isUserMenuOpen) {
      updateDropdownPosition();
    }
    setIsUserMenuOpen((prev) => !prev);
  };

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/products", label: "Products" },
    { href: "/profiles", label: "Profiles" },
    { href: "/requests", label: "Requests" },
    { href: "/plans", label: "Plans" },
    { href: "/about", label: "About" },
    { href: "/contact", label: "Contact" },
  ];

  const displayName =
    session?.user?.companyName || session?.user?.name || "User";
  const initials = (session?.user?.name || session?.user?.email || "U")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const avatarUrl = session?.user?.logo || session?.user?.image || null;

  const handleSignOut = async () => {
    setIsUserMenuOpen(false);
    await signOut({ callbackUrl: "/" });
  };

  // ====== محتوای دراپ‌داون (قابل استفاده در Portal) ======
  const dropdownContent = (
    <div
      ref={dropdownRef}
      style={{
        position: "fixed",
        top: dropdownPos.top,
        right: dropdownPos.right,
        width: 280,
        maxWidth: "calc(100vw - 24px)",
        background: "white",
        borderRadius: 14,
        boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
        border: "1px solid var(--gray-light, #e8edf0)",
        overflow: "hidden",
        zIndex: 10000, // ✅ خیلی بالا تا از هدر هم بالاتر باشد
        animation: "headerFadeInDown 0.2s ease",
      }}
    >
      {session ? (
        <div
          style={{
            padding: 16,
            background: "linear-gradient(135deg, #f0faf6, #eaf7f1)",
            borderBottom: "1px solid var(--gray-light, #e8edf0)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: "50%",
                background: avatarUrl
                  ? "transparent"
                  : "linear-gradient(135deg, #13795b, #1d9a71)",
                color: "white",
                display: "grid",
                placeItems: "center",
                fontSize: 16,
                fontWeight: 800,
                overflow: "hidden",
                flexShrink: 0,
                border: "2px solid white",
                boxShadow: "0 4px 12px rgba(19,121,91,0.2)",
              }}
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={displayName}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                initials
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 800,
                  color: "var(--black, #0b1f18)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {displayName}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: "var(--gray, #64748b)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {session.user?.email}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div
          style={{
            padding: "18px 16px",
            background: "linear-gradient(135deg, #f0faf6, #eaf7f1)",
            borderBottom: "1px solid var(--gray-light, #e8edf0)",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: 14,
              fontWeight: 800,
              color: "var(--black, #0b1f18)",
              marginBottom: 4,
            }}
          >
            Welcome to FoodTradeHub
          </div>
          <div style={{ fontSize: 12, color: "var(--gray, #64748b)" }}>
            Sign in to access your account
          </div>
        </div>
      )}

      {session ? (
        <div style={{ padding: 8 }}>
          <DropdownItem href="/dashboard" icon="fa-chart-pie" label="Dashboard" onClick={() => setIsUserMenuOpen(false)} />
          <DropdownItem href="/dashboard/products" icon="fa-box" label="My Products" onClick={() => setIsUserMenuOpen(false)} />
          <DropdownItem href="/dashboard/requests" icon="fa-cart-shopping" label="My Buying Requests" onClick={() => setIsUserMenuOpen(false)} />
          <DropdownItem href="/dashboard/messages" icon="fa-comment-dots" label="Messages" onClick={() => setIsUserMenuOpen(false)} />
          <DropdownItem href="/dashboard/notifications" icon="fa-bell" label="Notifications" onClick={() => setIsUserMenuOpen(false)} />
          <DropdownItem href="/dashboard/saved-products" icon="fa-bookmark" label="Saved Items" onClick={() => setIsUserMenuOpen(false)} />
          <Divider />
          <DropdownItem href="/plans" icon="fa-crown" label="Membership Plans" onClick={() => setIsUserMenuOpen(false)} />
          <DropdownItem href="/dashboard/billing" icon="fa-credit-card" label="Billing & Payments" onClick={() => setIsUserMenuOpen(false)} />
          <DropdownItem href="/dashboard/edit-profile" icon="fa-building" label="Edit Profile" onClick={() => setIsUserMenuOpen(false)} />
          <DropdownItem href="/dashboard/support" icon="fa-headset" label="Support" onClick={() => setIsUserMenuOpen(false)} />
          <Divider />
          <button
            type="button"
            onClick={handleSignOut}
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: 8,
              background: "transparent",
              border: 0,
              color: "#dc2626",
              fontSize: 13,
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 10,
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            <i className="fas fa-sign-out-alt" style={{ width: 20, textAlign: "center", fontSize: 14 }}></i>
            Sign Out
          </button>
        </div>
      ) : (
        <div style={{ padding: 8 }}>
          <Link
            href="/login"
            onClick={() => setIsUserMenuOpen(false)}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              padding: "11px 16px",
              borderRadius: 10,
              background: "linear-gradient(135deg, #13795b, #1d9a71)",
              color: "white",
              fontSize: 13,
              fontWeight: 700,
              textDecoration: "none",
              marginBottom: 8,
              boxShadow: "0 6px 16px rgba(19,121,91,0.25)",
            }}
          >
            <i className="fas fa-sign-in-alt"></i>
            Sign In
          </Link>

          <Link
            href="/register"
            onClick={() => setIsUserMenuOpen(false)}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              padding: "11px 16px",
              borderRadius: 10,
              background: "white",
              color: "#13795b",
              border: "1.5px solid #13795b",
              fontSize: 13,
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            <i className="fas fa-user-plus"></i>
            Create Account
          </Link>

          <Divider />

          <DropdownItem href="/plans" icon="fa-crown" label="Membership Plans" onClick={() => setIsUserMenuOpen(false)} />
          <DropdownItem href="/products" icon="fa-box" label="Browse Products" onClick={() => setIsUserMenuOpen(false)} />
          <DropdownItem href="/requests" icon="fa-cart-shopping" label="Browse Requests" onClick={() => setIsUserMenuOpen(false)} />
          <DropdownItem href="/profiles" icon="fa-users" label="Browse Suppliers" onClick={() => setIsUserMenuOpen(false)} />
        </div>
      )}
    </div>
  );

  return (
    <header className="bg-white shadow-sm border-bottom sticky-top">
      <div className="container">
        <nav className="navbar navbar-expand-lg navbar-light py-2">
          {/* ========== Logo ========== */}
          <Link href="/" className="navbar-brand d-flex align-items-center gap-2">
            <div
              className="d-flex align-items-center justify-content-center rounded-3"
              style={{ width: "42px", height: "42px", background: "var(--primary, #13795b)" }}
            >
              <i className="fas fa-utensils text-white fs-5"></i>
            </div>
            <span className="fw-bold fs-4">
              Food<span style={{ color: "var(--primary, #13795b)" }}>TradeHub</span>
            </span>
          </Link>

          {/* ========== سمت راست ========== */}
          <div className="d-flex align-items-center gap-2 ms-auto order-lg-3">
            {status !== "loading" && (
              <button
                ref={triggerRef}
                type="button"
                onClick={handleToggleUserMenu}
                aria-label="User menu"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "4px 10px 4px 4px",
                  borderRadius: 50,
                  background: isUserMenuOpen ? "var(--primary-light, #eaf7f1)" : "white",
                  border: "1px solid var(--gray-light, #e8edf0)",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
              >
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: "50%",
                    background: avatarUrl ? "transparent" : "linear-gradient(135deg, #13795b, #1d9a71)",
                    color: "white",
                    display: "grid",
                    placeItems: "center",
                    fontSize: 13,
                    fontWeight: 800,
                    overflow: "hidden",
                    flexShrink: 0,
                  }}
                >
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={displayName}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : session ? (
                    initials
                  ) : (
                    <i className="fas fa-user" style={{ fontSize: 14 }}></i>
                  )}
                </div>

                <span
                  className="d-none d-lg-inline"
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: "var(--black, #0b1f18)",
                    maxWidth: 120,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {session ? displayName : "Welcome"}
                </span>

                <i
                  className={`fas fa-chevron-${isUserMenuOpen ? "up" : "down"}`}
                  style={{ fontSize: 10, color: "var(--gray, #64748b)", transition: "transform 0.2s ease" }}
                ></i>
              </button>
            )}

            {/* دکمه همبرگر - فقط موبایل */}
            <button
              className="navbar-toggler border-0 d-lg-none"
              type="button"
              onClick={toggleMenu}
              aria-label="Toggle navigation"
              style={{ padding: 6 }}
            >
              <i className={`fas ${isMenuOpen ? "fa-times" : "fa-bars"} fs-4`}></i>
            </button>
          </div>

          {/* ========== منوی لینک‌ها ========== */}
          <div className={`collapse navbar-collapse order-lg-2 ${isMenuOpen ? "show" : ""}`}>
            <ul className="navbar-nav mx-auto gap-2">
              {navLinks.map((link) => {
                const isActive =
                  link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
                return (
                  <li className="nav-item" key={link.href}>
                    <Link
                      href={link.href}
                      className={`nav-link ${isActive ? "active" : ""}`}
                      onClick={closeMobileMenu}
                    >
                      {link.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>
      </div>

      {/* ✅ دراپ‌داون از طریق Portal در body رندر می‌شود */}
      {mounted && isUserMenuOpen && createPortal(dropdownContent, document.body)}

      <style>{`
        @keyframes headerFadeInDown {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </header>
  );
}

// ====== کامپوننت آیتم منو ======
function DropdownItem({ href, icon, label, onClick }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 12px",
        borderRadius: 8,
        textDecoration: "none",
        color: "var(--gray-dark, #334155)",
        fontSize: 13,
        fontWeight: 600,
        transition: "background 0.15s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "var(--light, #f6f8f9)";
        e.currentTarget.style.color = "#13795b";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent";
        e.currentTarget.style.color = "var(--gray-dark, #334155)";
      }}
    >
      <i className={`fas ${icon}`} style={{ width: 20, textAlign: "center", fontSize: 14 }}></i>
      <span style={{ flex: 1 }}>{label}</span>
    </Link>
  );
}

// ====== جداکننده ======
function Divider() {
  return (
    <div
      style={{
        height: 1,
        background: "var(--gray-light, #e8edf0)",
        margin: "6px 4px",
      }}
    />
  );
}