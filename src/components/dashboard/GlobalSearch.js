// src/components/dashboard/GlobalSearch.js
"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function GlobalSearch() {
  const router = useRouter();
  const inputRef = useRef(null);
  const wrapperRef = useRef(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // ====== Ctrl+K shortcut ======
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        if (window.innerWidth < 900) {
          setIsMobileOpen(true);
        } else {
          inputRef.current?.focus();
          setIsOpen(true);
        }
      }
      if (e.key === "Escape") {
        setIsOpen(false);
        setIsMobileOpen(false);
        inputRef.current?.blur();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // ====== بستن با کلیک بیرون ======
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target) &&
        !e.target.closest("[data-search-trigger]")
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ====== Debounced search ======
  useEffect(() => {
    if (!query || query.length < 2) {
      setResults(null);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/user/search?q=${encodeURIComponent(query)}&limit=3`
        );
        if (res.ok) {
          const data = await res.json();
          setResults(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/dashboard/search?q=${encodeURIComponent(query.trim())}`);
      setIsOpen(false);
      setIsMobileOpen(false);
      setQuery("");
    }
  };

  const closeSearch = () => {
    setIsOpen(false);
    setIsMobileOpen(false);
  };

  const hasResults =
    results &&
    (results.products?.length > 0 ||
      results.requests?.length > 0 ||
      results.tickets?.length > 0 ||
      results.messages?.length > 0);

  const totalResults =
    (results?.products?.length || 0) +
    (results?.requests?.length || 0) +
    (results?.tickets?.length || 0) +
    (results?.messages?.length || 0);

  const renderDropdown = () => {
    if (!query || query.length < 2) return null;

    if (loading) {
      return (
        <div style={dropdownStyle}>
          <div style={{ padding: 30, textAlign: "center" }}>
            <div className="spinner-border spinner-border-sm text-primary"></div>
          </div>
        </div>
      );
    }

    if (!hasResults) {
      return (
        <div style={dropdownStyle}>
          <div
            style={{
              padding: 30,
              textAlign: "center",
              color: "var(--gray)",
              fontSize: 13,
            }}
          >
            <i
              className="fas fa-search"
              style={{
                fontSize: 24,
                opacity: 0.3,
                marginBottom: 8,
                display: "block",
              }}
            ></i>
            No results for "{query}"
          </div>
        </div>
      );
    }

    return (
      <div style={dropdownStyle}>
        <div style={{ maxHeight: 400, overflowY: "auto" }}>
          {/* Products */}
          {results.products?.length > 0 && (
            <ResultGroup title="Products" icon="fa-box">
              {results.products.map((p) => (
                <ResultItem
                  key={p.id}
                  href={`/products/${p.productNumber}/${p.slug}`}
                  image={p.images?.[0]}
                  title={p.name}
                  subtitle={p.category}
                  onClick={closeSearch}
                  external
                />
              ))}
            </ResultGroup>
          )}

          {/* Requests */}
          {results.requests?.length > 0 && (
            <ResultGroup title="Buying Requests" icon="fa-shopping-cart">
              {results.requests.map((r) => (
                <ResultItem
                  key={r.id}
                  href={`/requests/${r.requestNumber}/${r.slug}`}
                  icon="fa-file-alt"
                  title={r.title}
                  subtitle={r.category}
                  onClick={closeSearch}
                  external
                />
              ))}
            </ResultGroup>
          )}

          {/* Tickets */}
          {results.tickets?.length > 0 && (
            <ResultGroup title="Support Tickets" icon="fa-headset">
              {results.tickets.map((t) => (
                <ResultItem
                  key={t.id}
                  href={`/dashboard/support/${t.ticketNumber}`}
                  icon="fa-ticket-alt"
                  title={`#${t.ticketNumber} · ${t.subject}`}
                  subtitle={t.status}
                  onClick={closeSearch}
                />
              ))}
            </ResultGroup>
          )}

          {/* Messages */}
          {results.messages?.length > 0 && (
            <ResultGroup title="Messages" icon="fa-message">
              {results.messages.map((m) => {
                const other =
                  m.sender?.id !== m.receiver?.id
                    ? m.sender
                    : m.receiver;
                return (
                  <ResultItem
                    key={m.id}
                    href={`/dashboard/messages?userId=${
                      other?.id
                    }`}
                    icon="fa-comment"
                    title={
                      other?.companyName || other?.name || "Message"
                    }
                    subtitle={m.content?.slice(0, 60)}
                    onClick={closeSearch}
                  />
                );
              })}
            </ResultGroup>
          )}
        </div>

        {/* Footer: See all */}
        <Link
          href={`/dashboard/search?q=${encodeURIComponent(query)}`}
          onClick={closeSearch}
          style={{
            display: "block",
            padding: "12px",
            textAlign: "center",
            background: "var(--light)",
            color: "var(--primary)",
            fontSize: 12,
            fontWeight: 700,
            textDecoration: "none",
            borderTop: "1px solid var(--gray-light)",
          }}
        >
          See all {totalResults} results for "{query}" →
        </Link>
      </div>
    );
  };

  return (
    <>
      {/* Desktop Search */}
      <div
        ref={wrapperRef}
        style={{ position: "relative" }}
        className="desktop-search-wrapper"
      >
        <form
          onSubmit={handleSubmit}
          style={{
            width: 280,
            height: 40,
            background: "var(--light)",
            border: `1px solid ${isOpen ? "var(--primary)" : "var(--gray-light)"}`,
            borderRadius: 11,
            display: "flex",
            alignItems: "center",
            padding: "0 12px",
            transition: "all 0.2s ease",
          }}
        >
          <i
            className="fas fa-search"
            style={{ color: "var(--gray)", fontSize: 13 }}
          ></i>
          <input
            ref={inputRef}
            type="text"
            placeholder="Search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsOpen(true)}
            style={{
              flex: 1,
              border: 0,
              outline: 0,
              background: "transparent",
              padding: "0 10px",
              fontSize: 13,
              color: "var(--black)",
            }}
          />
          <kbd
            style={{
              fontSize: 10,
              background: "white",
              border: "1px solid var(--gray-light)",
              borderRadius: 4,
              padding: "2px 6px",
              color: "var(--gray)",
              fontFamily: "inherit",
            }}
          >
            ⌘K
          </kbd>
        </form>

        {isOpen && query.length >= 2 && (
          <div style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 1000 }}>
            {renderDropdown()}
          </div>
        )}
      </div>

      {/* Mobile Search Trigger */}
      <button
        data-search-trigger
        onClick={() => setIsMobileOpen(true)}
        className="top-icon mobile-search-trigger"
        style={{ display: "none" }}
      >
        <i className="fas fa-search"></i>
      </button>

      {/* Mobile Search Modal */}
      {isMobileOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "white",
            zIndex: 2000,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              padding: 16,
              borderBottom: "1px solid var(--gray-light)",
              display: "flex",
              gap: 10,
              alignItems: "center",
            }}
          >
            <form
              onSubmit={handleSubmit}
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                background: "var(--light)",
                borderRadius: 11,
                padding: "0 12px",
                height: 44,
              }}
            >
              <i
                className="fas fa-search"
                style={{ color: "var(--gray)", fontSize: 14 }}
              ></i>
              <input
                autoFocus
                type="text"
                placeholder="Search..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                style={{
                  flex: 1,
                  border: 0,
                  outline: 0,
                  background: "transparent",
                  padding: "0 10px",
                  fontSize: 14,
                }}
              />
            </form>
            <button
              onClick={() => {
                setIsMobileOpen(false);
                setQuery("");
              }}
              style={{
                background: "transparent",
                border: 0,
                color: "var(--gray)",
                fontSize: 14,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>

          <div style={{ flex: 1, overflowY: "auto" }}>
            {query.length >= 2 && renderDropdown()}
          </div>
        </div>
      )}

      <style jsx>{`
        @media (max-width: 900px) {
          :global(.desktop-search-wrapper) {
            display: none !important;
          }
          :global(.mobile-search-trigger) {
            display: flex !important;
          }
        }
      `}</style>
    </>
  );
}

// ====== Result Group ======
function ResultGroup({ title, icon, children }) {
  return (
    <div>
      <div
        style={{
          padding: "10px 14px 6px",
          fontSize: 10,
          fontWeight: 800,
          color: "var(--gray)",
          textTransform: "uppercase",
          letterSpacing: 0.5,
          display: "flex",
          alignItems: "center",
          gap: 6,
          background: "var(--light)",
        }}
      >
        <i className={`fas ${icon}`}></i>
        {title}
      </div>
      {children}
    </div>
  );
}

// ====== Result Item ======
function ResultItem({
  href,
  image,
  icon,
  title,
  subtitle,
  onClick,
  external,
}) {
  const props = external ? { target: "_blank", rel: "noopener noreferrer" } : {};

  return (
    <Link
      href={href}
      onClick={onClick}
      {...props}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 14px",
        textDecoration: "none",
        borderBottom: "1px solid #f0f2f1",
        transition: "background 0.15s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "var(--light)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent";
      }}
    >
      {image ? (
        <img
          src={image}
          alt=""
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            objectFit: "cover",
            flexShrink: 0,
          }}
        />
      ) : (
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            background: "var(--light)",
            color: "var(--primary)",
            display: "grid",
            placeItems: "center",
            fontSize: 14,
            flexShrink: 0,
          }}
        >
          <i className={`fas ${icon || "fa-file"}`}></i>
        </div>
      )}

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: "var(--black)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {title}
        </div>
        {subtitle && (
          <div
            style={{
              fontSize: 11,
              color: "var(--gray)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              marginTop: 2,
            }}
          >
            {subtitle}
          </div>
        )}
      </div>
    </Link>
  );
}

const dropdownStyle = {
  background: "white",
  borderRadius: 12,
  boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
  border: "1px solid var(--gray-light)",
  overflow: "hidden",
  marginTop: 6,
  animation: "fadeInDown 0.2s ease",
};