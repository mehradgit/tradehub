// src/components/layout/Header.js
"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import Image from "next/image";
import HeaderSearch from "@/components/layout/HeaderSearch";   // ✅ خط جدید

export default function Header() {
  // ... بدون تغییر
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, right: 0 });
  const [mounted, setMounted] = useState(false);

  const triggerRef = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const updateDropdownPosition = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom + 12,
        right: Math.max(12, window.innerWidth - rect.right),
      });
    }
  };

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

  useEffect(() => {
    setIsUserMenuOpen(false);
  }, [pathname]);

  const handleToggleUserMenu = () => {
    if (!isUserMenuOpen) {
      updateDropdownPosition();
    }
    setIsUserMenuOpen((prev) => !prev);
  };

  const navLinks = [
    { href: "/", label: "Home", icon: "fa-home" },
    { href: "/products", label: "Products", icon: "fa-box" },
    { href: "/requests", label: "Requests", icon: "fa-cart-shopping" },
    { href: "/profiles", label: "Profiles", icon: "fa-users" },
    { href: "/plans", label: "Plans", icon: "fa-crown" },
    { href: "/about", label: "About", icon: "fa-info-circle" },
    { href: "/contact", label: "Contact", icon: "fa-envelope" },
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

  const isActiveLink = (href) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  // ====== محتوای Dropdown (بدون تغییر) ======
  const dropdownContent = (
    <div
      ref={dropdownRef}
      className="header-dropdown"
      style={{
        position: "fixed",
        top: dropdownPos.top,
        right: dropdownPos.right,
        zIndex: 10000,
      }}
    >
      {session ? (
        <>
          <div className="dropdown-user-header">
            <div
              className="dropdown-avatar"
              style={{
                background: avatarUrl
                  ? "transparent"
                  : "linear-gradient(135deg, #13795b, #1d9a71)",
              }}
            >
              {avatarUrl ? <img src={avatarUrl} alt={displayName} /> : initials}
            </div>
            <div className="dropdown-user-info">
              <div className="dropdown-user-name">{displayName}</div>
              <div className="dropdown-user-email">{session.user?.email}</div>
            </div>
          </div>

          <div className="dropdown-nav-section dropdown-mobile-only">
            <div className="dropdown-section-label">Navigation</div>
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsUserMenuOpen(false)}
                className={`dropdown-item ${
                  isActiveLink(link.href) ? "active" : ""
                }`}
              >
                <i className={`fas ${link.icon}`}></i>
                <span>{link.label}</span>
              </Link>
            ))}
          </div>

          <div className="dropdown-menu-section">
            <div className="dropdown-section-label">Account</div>
            <DropdownItem
              href="/dashboard"
              icon="fa-chart-pie"
              label="Dashboard"
              onClick={() => setIsUserMenuOpen(false)}
            />
            <DropdownItem
              href="/dashboard/products"
              icon="fa-box"
              label="My Products"
              onClick={() => setIsUserMenuOpen(false)}
            />
            <DropdownItem
              href="/dashboard/requests"
              icon="fa-cart-shopping"
              label="My Requests"
              onClick={() => setIsUserMenuOpen(false)}
            />
            <DropdownItem
              href="/dashboard/messages"
              icon="fa-comment-dots"
              label="Messages"
              onClick={() => setIsUserMenuOpen(false)}
            />
            <DropdownItem
              href="/dashboard/saved-products"
              icon="fa-bookmark"
              label="Saved Items"
              onClick={() => setIsUserMenuOpen(false)}
            />
            <DropdownItem
              href="/dashboard/edit-profile"
              icon="fa-building"
              label="Edit Profile"
              onClick={() => setIsUserMenuOpen(false)}
            />
            <DropdownItem
              href="/dashboard/support"
              icon="fa-headset"
              label="Support"
              onClick={() => setIsUserMenuOpen(false)}
            />
          </div>

          <div className="dropdown-footer">
            <button
              type="button"
              onClick={handleSignOut}
              className="dropdown-signout"
            >
              <i className="fas fa-sign-out-alt"></i>
              <span>Sign Out</span>
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="dropdown-guest-header">
            <div className="dropdown-guest-icon">
              <i className="fas fa-user-circle"></i>
            </div>
            <div className="dropdown-guest-title">Welcome</div>
            <div className="dropdown-guest-sub">
              Sign in to access your account
            </div>
          </div>

          <div className="dropdown-nav-section dropdown-mobile-only">
            <div className="dropdown-section-label">Navigation</div>
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsUserMenuOpen(false)}
                className={`dropdown-item ${
                  isActiveLink(link.href) ? "active" : ""
                }`}
              >
                <i className={`fas ${link.icon}`}></i>
                <span>{link.label}</span>
              </Link>
            ))}
          </div>

          <div className="dropdown-menu-section">
            <Link
              href="/login"
              onClick={() => setIsUserMenuOpen(false)}
              className="dropdown-btn-primary"
            >
              <i className="fas fa-sign-in-alt"></i>
              Sign In
            </Link>
            <Link
              href="/register"
              onClick={() => setIsUserMenuOpen(false)}
              className="dropdown-btn-outline"
            >
              <i className="fas fa-user-plus"></i>
              Create Account
            </Link>
          </div>
        </>
      )}
    </div>
  );

  return (
    <>
      <header className="site-header">
        <div className="container">
          <nav className="header-nav">
            {/* ===== Logo ===== */}
            <Link
              href="/"
              className="header-logo"
              aria-label="FoodTradeLink — Home"
            >
              <Image
                src="/images/logo-foodtradelink.png"
                alt="FoodTradeLink — Global B2B Food Marketplace"
                width={240}
                height={60}
                priority
                className="logo-img"
              />
            </Link>

            {/* ===== Nav Links (Desktop only) ===== */}
            <ul className="header-nav-links">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={`header-nav-link ${
                      isActiveLink(link.href) ? "active" : ""
                    }`}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>

            {/* ===== Header Actions ===== */}
            <div className="header-actions">
              {/* ✅ دکمه سرچ + نوار — اضافه شده */}
              <HeaderSearch />

              {status !== "loading" && (
                <button
                  ref={triggerRef}
                  type="button"
                  onClick={handleToggleUserMenu}
                  aria-label="User menu"
                  aria-expanded={isUserMenuOpen}
                  className={`user-menu-trigger ${
                    isUserMenuOpen ? "active" : ""
                  }`}
                >
                  <div
                    className="trigger-avatar"
                    style={{
                      background: avatarUrl
                        ? "transparent"
                        : "linear-gradient(135deg, #13795b, #1d9a71)",
                    }}
                  >
                    {avatarUrl ? (
                      <img src={avatarUrl} alt={displayName} />
                    ) : session ? (
                      initials
                    ) : (
                      <i className="fas fa-user"></i>
                    )}
                  </div>

                  <span className="trigger-name">
                    {session ? displayName : "Menu"}
                  </span>

                  <i
                    className={`fas fa-chevron-${
                      isUserMenuOpen ? "up" : "down"
                    } trigger-chevron`}
                  ></i>
                </button>
              )}
            </div>
          </nav>
        </div>
      </header>

      {/* Dropdown Portal */}
      {mounted && isUserMenuOpen && createPortal(dropdownContent, document.body)}
    </>
  );
}

// ====== DropdownItem Component ======
function DropdownItem({ href, icon, label, onClick }) {
  return (
    <Link href={href} onClick={onClick} className="dropdown-item">
      <i className={`fas ${icon}`}></i>
      <span>{label}</span>
    </Link>
  );
}