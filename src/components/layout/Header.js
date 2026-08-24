// src/components/layout/Header.js
"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";

export default function Header() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/products", label: "Products" },
    { href: "/profiles", label: "profiles" },
    { href: "/requests", label: "Requests" },
    { href: "/about", label: "About" },
  ];

  return (
    // ✅ کلاس sticky-top اضافه شد
    <header className="bg-white shadow-sm border-bottom sticky-top">
      <div className="container">
        <nav className="navbar navbar-expand-lg navbar-light py-2">
          {/* Logo */}
          <Link href="/" className="navbar-brand d-flex align-items-center gap-2">
            <div
              className="d-flex align-items-center justify-content-center rounded-3"
              style={{
                width: "42px",
                height: "42px",
                background: "var(--primary, #e85d3a)",
              }}
            >
              <i className="fas fa-utensils text-white fs-5"></i>
            </div>
            <span className="fw-bold fs-4">
              Food<span style={{ color: "var(--primary, #e85d3a)" }}>Hub</span>
            </span>
          </Link>

          {/* Hamburger */}
          <button
            className="navbar-toggler border-0"
            type="button"
            onClick={toggleMenu}
            aria-label="Toggle navigation"
          >
            <i className={`fas ${isMenuOpen ? "fa-times" : "fa-bars"} fs-3`}></i>
          </button>

          {/* Collapsible Menu */}
          <div className={`collapse navbar-collapse ${isMenuOpen ? "show" : ""}`}>
            <ul className="navbar-nav mx-auto gap-2">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <li className="nav-item" key={link.href}>
                    <Link
                      href={link.href}
                      className={`nav-link ${isActive ? "active" : ""}`}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {link.label}
                    </Link>
                  </li>
                );
              })}
            </ul>

            <div className="d-flex align-items-center gap-2 flex-wrap">
              {session ? (
                <>
                  <Link
                    href="/dashboard"
                    className="btn btn-outline-primary btn-sm rounded-pill px-3"
                  >
                    <i className="fas fa-user me-1"></i>
                    Dashboard
                  </Link>
                  <button
                    onClick={() => signOut()}
                    className="btn btn-danger btn-sm rounded-pill px-3"
                  >
                    <i className="fas fa-sign-out-alt me-1"></i>
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="btn btn-outline-secondary btn-sm rounded-pill px-3"
                  >
                    <i className="fas fa-sign-in-alt me-1"></i>
                    Sign In
                  </Link>
                  <Link
                    href="/register"
                    className="btn btn-primary btn-sm rounded-pill px-3"
                  >
                    <i className="fas fa-user-plus me-1"></i>
                    Register
                  </Link>
                </>
              )}
            </div>
          </div>
        </nav>
      </div>
    </header>
  );
}