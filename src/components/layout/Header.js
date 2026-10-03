// src/components/layout/Header.js
"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import Image from "next/image";
import HeaderSearch from "@/components/layout/HeaderSearch";

export default function Header() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isJoinMenuOpen, setIsJoinMenuOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, right: 0 });
  const [joinMenuPos, setJoinMenuPos] = useState({ top: 0, right: 0 });
  const [mounted, setMounted] = useState(false);

  const triggerRef = useRef(null);
  const dropdownRef = useRef(null);
  const joinTriggerRef = useRef(null);
  const joinMenuRef = useRef(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // ====== موقعیت dropdown کاربر ======
  const updateDropdownPosition = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom + 12,
        right: Math.max(12, window.innerWidth - rect.right),
      });
    }
  };

  // ====== موقعیت dropdown Join Free ======
  const updateJoinMenuPosition = () => {
    if (joinTriggerRef.current) {
      const rect = joinTriggerRef.current.getBoundingClientRect();
      setJoinMenuPos({
        top: rect.bottom + 8,
        right: Math.max(12, window.innerWidth - rect.right),
      });
    }
  };

  // ====== Click outside ======
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
      if (
        joinTriggerRef.current &&
        !joinTriggerRef.current.contains(e.target) &&
        joinMenuRef.current &&
        !joinMenuRef.current.contains(e.target)
      ) {
        setIsJoinMenuOpen(false);
      }
    };
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        setIsUserMenuOpen(false);
        setIsJoinMenuOpen(false);
      }
    };

    if (isUserMenuOpen || isJoinMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
      window.addEventListener("resize", updateDropdownPosition);
      window.addEventListener("resize", updateJoinMenuPosition);
      window.addEventListener("scroll", updateDropdownPosition, true);
      window.addEventListener("scroll", updateJoinMenuPosition, true);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
      window.removeEventListener("resize", updateDropdownPosition);
      window.removeEventListener("resize", updateJoinMenuPosition);
      window.removeEventListener("scroll", updateDropdownPosition, true);
      window.removeEventListener("scroll", updateJoinMenuPosition, true);
    };
  }, [isUserMenuOpen, isJoinMenuOpen]);

  useEffect(() => {
    setIsUserMenuOpen(false);
    setIsJoinMenuOpen(false);
  }, [pathname]);

  const handleToggleUserMenu = () => {
    if (!isUserMenuOpen) updateDropdownPosition();
    setIsUserMenuOpen((prev) => !prev);
    setIsJoinMenuOpen(false);
  };

  const handleToggleJoinMenu = () => {
    if (!isJoinMenuOpen) updateJoinMenuPosition();
    setIsJoinMenuOpen((prev) => !prev);
    setIsUserMenuOpen(false);
  };

  // ====== لینک‌های اصلی ناوبری ======
  const navLinks = [
    { href: "/products", label: "Products" },
    { href: "/requests", label: "Buy Requests" },
    { href: "/profiles?role=supplier", label: "Suppliers" },
    { href: "/profiles?role=buyer", label: "Buyers" },
    { href: "/about", label: "How It Works" },
  ];

  // ====== شناسه کاربر ======
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
    // پشتیبانی از query string
    const baseHref = href.split("?")[0];
    return pathname.startsWith(baseHref);
  };

  // ============================================================
  // User Dropdown Content (فقط برای کاربر لاگین‌کرده)
  // ============================================================
  const userDropdownContent = session ? (
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
            className={`dropdown-item ${isActiveLink(link.href) ? "active" : ""
              }`}
          >
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
          href="/dashboard/billing"
          icon="fa-credit-card"
          label="Billing"
          onClick={() => setIsUserMenuOpen(false)}
        />
        <DropdownItem
          href="/dashboard/edit-profile"
          icon="fa-user-pen"
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
    </div>
  ) : null;

  // ============================================================
  // Join Free Dropdown Content
  // ============================================================
  const joinDropdownContent = (
    <div
      ref={joinMenuRef}
      className="join-dropdown"
      style={{
        position: "fixed",
        top: joinMenuPos.top,
        right: joinMenuPos.right,
        zIndex: 10000,
      }}
    >
      <div className="join-dropdown-header">
        <strong>Create Free Account</strong>
        <span>Choose your path</span>
      </div>

      <Link
        href="/register?role=supplier"
        className="join-option"
        onClick={() => setIsJoinMenuOpen(false)}
      >
        <div className="join-option-icon supplier">
          <i className="fas fa-tractor"></i>
        </div>
        <div className="join-option-content">
          <strong>Join as Supplier</strong>
          <span>Sell products to global buyers</span>
        </div>
        <i className="fas fa-arrow-right join-option-arrow"></i>
      </Link>

      <Link
        href="/register?role=buyer"
        className="join-option"
        onClick={() => setIsJoinMenuOpen(false)}
      >
        <div className="join-option-icon buyer">
          <i className="fas fa-shopping-bag"></i>
        </div>
        <div className="join-option-content">
          <strong>Join as Buyer</strong>
          <span>Source food from verified suppliers</span>
        </div>
        <i className="fas fa-arrow-right join-option-arrow"></i>
      </Link>
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
                alt="FoodTradeLink"
                width={220}
                height={55}
                priority
                className="logo-img"
              />
            </Link>

            {/* ===== Nav Links (Desktop) ===== */}
            <ul className="header-nav-links">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={`header-nav-link ${isActiveLink(link.href) ? "active" : ""
                      }`}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>

            {/* ===== Header Actions ===== */}
            <div className="header-actions">
              {/* Search */}
              <HeaderSearch />

              {status !== "loading" && (
                <>
                  {session ? (
                    /* ====== کاربر لاگین کرده: فقط User Menu ====== */
                    <>
                      <Link
                        href="/requests/new"
                        className="btn-post-request"
                      >
                        <i className="fas fa-plus"></i>
                        <span>Post a Request</span>
                      </Link>

                      <button
                        ref={triggerRef}
                        type="button"
                        onClick={handleToggleUserMenu}
                        aria-label="User menu"
                        aria-expanded={isUserMenuOpen}
                        className={`user-menu-trigger ${isUserMenuOpen ? "active" : ""
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
                          ) : (
                            initials
                          )}
                        </div>
                        <span className="trigger-name">{displayName}</span>
                        <i
                          className={`fas fa-chevron-${isUserMenuOpen ? "up" : "down"
                            } trigger-chevron`}
                        ></i>
                      </button>
                    </>
                  ) : (
                    /* ====== مهمان: Login + Join Free + Post a Request ====== */
                    <>
                      <Link href="/login" className="btn-login">
                        Login
                      </Link>

                      <div
                        className="join-trigger-wrapper"
                        ref={joinTriggerRef}
                      >
                        <button
                          type="button"
                          onClick={handleToggleJoinMenu}
                          className={`btn-join-free ${isJoinMenuOpen ? "active" : ""
                            }`}
                          aria-haspopup="menu"
                          aria-expanded={isJoinMenuOpen}
                        >
                          <span>Join Free</span>
                          <i
                            className={`fas fa-chevron-${isJoinMenuOpen ? "up" : "down"
                              }`}
                          ></i>
                        </button>
                      </div>

                      <Link
                        href="/requests/new"
                        className="btn-post-request"
                      >
                        <i className="fas fa-plus"></i>
                        <span>Post a Request</span>
                      </Link>
                    </>
                  )}
                </>
              )}
            </div>
          </nav>
        </div>
      </header>

      {/* Portals */}
      {mounted && isUserMenuOpen && createPortal(userDropdownContent, document.body)}
      {mounted && isJoinMenuOpen && createPortal(joinDropdownContent, document.body)}
    </>
  );
}

// ============================================================
// DropdownItem
// ============================================================
function DropdownItem({ href, icon, label, onClick }) {
  return (
    <Link href={href} onClick={onClick} className="dropdown-item">
      <i className={`fas ${icon}`}></i>
      <span>{label}</span>
    </Link>
  );
}