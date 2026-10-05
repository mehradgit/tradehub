// src/components/home/HeroSearch.js
"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function HeroSearch() {
  const router = useRouter();
  const inputRef = useRef(null);
  const wrapperRef = useRef(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // ====== Close on outside click ======
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
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
          `/api/search?q=${encodeURIComponent(query)}&limit=4`
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
      // The header mega search is the only search entry point; the /search page was removed
      router.push(`/products?search=${encodeURIComponent(query.trim())}`);
      setIsOpen(false);
    }
  };

  const hasResults =
    results &&
    (results.products?.length > 0 ||
      results.requests?.length > 0 ||
      results.profiles?.length > 0);

  const totalResults =
    (results?.products?.length || 0) +
    (results?.requests?.length || 0) +
    (results?.profiles?.length || 0);

  const renderDropdown = () => {
    if (!query || query.length < 2) return null;

    if (loading) {
      return (
        <div style={dropdownStyle}>
          <div style={{ padding: 30, textAlign: "center" }}>
            <div
              className="spinner-border spinner-border-sm"
              style={{ color: "#13795b" }}
            ></div>
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
              color: "#71807b",
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
            No results for &quot;{query}&quot;
          </div>
        </div>
      );
    }

    return (
      <div style={dropdownStyle}>
        <div style={{ maxHeight: 420, overflowY: "auto" }}>
          {/* Products */}
          {results.products?.length > 0 && (
            <ResultGroup title="Products" icon="fa-box">
              {results.products.map((p) => (
                <ResultItem
                  key={p.id}
                  href={`/products/${p.productNumber}/${p.slug}`}
                  image={p.images?.[0]}
                  title={p.name}
                  subtitle={`${p.category || ""} · $${p.price}/${p.unit}`}
                  onClick={() => setIsOpen(false)}
                />
              ))}
            </ResultGroup>
          )}

          {/* Buying requests */}
          {results.requests?.length > 0 && (
            <ResultGroup title="Buying Requests" icon="fa-cart-shopping">
              {results.requests.map((r) => (
                <ResultItem
                  key={r.id}
                  href={`/requests/${r.requestNumber}/${r.slug}`}
                  icon="fa-file-alt"
                  title={r.title}
                  subtitle={`${r.category || ""} · ${r.quantity} ${r.unit}${
                    r.deliveryCountry ? ` · ${r.deliveryCountry}` : ""
                  }`}
                  onClick={() => setIsOpen(false)}
                />
              ))}
            </ResultGroup>
          )}

          {/* Profiles */}
          {results.profiles?.length > 0 && (
            <ResultGroup title="Profiles" icon="fa-users">
              {results.profiles.map((u) => (
                <ResultItem
                  key={u.id}
                  href={`/profiles/${u.profileNumber}/${u.slug}`}
                  image={u.logo || u.image}
                  icon="fa-building"
                  title={u.companyName || u.name || "User"}
                  subtitle={`${u.role === "SUPPLIER" ? "Supplier" : "Buyer"}${
                    u.country ? ` · ${u.country}` : ""
                  }`}
                  onClick={() => setIsOpen(false)}
                />
              ))}
            </ResultGroup>
          )}
        </div>

        {/* See all */}
        <Link
          href={`/products?search=${encodeURIComponent(query)}`}
          onClick={() => setIsOpen(false)}
          style={{
            display: "block",
            padding: "12px",
            textAlign: "center",
            background: "#f6f8f9",
            color: "#13795b",
            fontSize: 12,
            fontWeight: 700,
            textDecoration: "none",
            borderTop: "1px solid #e8edf0",
          }}
        >
          See all results for &quot;{query}&quot; →
        </Link>
      </div>
    );
  };

  return (
    <div ref={wrapperRef} style={{ position: "relative", width: "100%" }}>
      <form onSubmit={handleSubmit} className="search-box">
        <i className="fa-solid fa-magnifying-glass"></i>
        <input
          ref={inputRef}
          type="text"
          placeholder="Search products, suppliers, requests..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
        />
        <button type="submit" className="search-btn">
          Search
          <i className="fa-solid fa-arrow-right"></i>
        </button>
      </form>

      {/* Dropdown */}
      {isOpen && query.length >= 2 && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            left: 0,
            right: 0,
            zIndex: 1000,
          }}
        >
          {renderDropdown()}
        </div>
      )}
    </div>
  );
}

// ====== Group ======
function ResultGroup({ title, icon, children }) {
  return (
    <div>
      <div
        style={{
          padding: "10px 14px 6px",
          fontSize: 10,
          fontWeight: 800,
          color: "#71807b",
          textTransform: "uppercase",
          letterSpacing: 0.5,
          display: "flex",
          alignItems: "center",
          gap: 6,
          background: "#f6f8f9",
        }}
      >
        <i className={`fas ${icon}`}></i>
        {title}
      </div>
      {children}
    </div>
  );
}

// ====== Item ======
function ResultItem({ href, image, icon, title, subtitle, onClick }) {
  return (
    <Link
      href={href}
      onClick={onClick}
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
        e.currentTarget.style.background = "#f6f8f9";
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
            width: 40,
            height: 40,
            borderRadius: 8,
            objectFit: "cover",
            flexShrink: 0,
          }}
        />
      ) : (
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 8,
            background: "#eaf7f1",
            color: "#13795b",
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
            color: "#13251f",
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
              color: "#71807b",
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
  borderRadius: 14,
  boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
  border: "1px solid #e8edf0",
  overflow: "hidden",
  animation: "heroSearchFadeIn 0.2s ease",
};