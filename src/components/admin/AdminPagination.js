// src/components/admin/AdminPagination.js
"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

export default function AdminPagination({ currentPage, totalPages }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const buildUrl = (page) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page);
    return `${pathname}?${params.toString()}`;
  };

  if (totalPages <= 1) return null;

  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== "...") {
      pages.push("...");
    }
  }

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        gap: "6px",
        marginTop: "20px",
        flexWrap: "wrap",
      }}
    >
      {currentPage > 1 && (
        <Link
          href={buildUrl(currentPage - 1)}
          style={{
            minWidth: "36px",
            height: "36px",
            padding: "0 12px",
            borderRadius: "8px",
            background: "#fff",
            border: "1px solid var(--line)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "11px",
            color: "var(--text)",
          }}
        >
          <i className="fa-solid fa-chevron-left"></i>
        </Link>
      )}

      {pages.map((p, i) =>
        p === "..." ? (
          <span
            key={`dots-${i}`}
            style={{
              minWidth: "36px",
              height: "36px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--muted)",
              fontSize: "11px",
            }}
          >
            ...
          </span>
        ) : (
          <Link
            key={p}
            href={buildUrl(p)}
            style={{
              minWidth: "36px",
              height: "36px",
              padding: "0 12px",
              borderRadius: "8px",
              background: p === currentPage ? "var(--green2)" : "#fff",
              border: "1px solid var(--line)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "11px",
              color: p === currentPage ? "white" : "var(--text)",
              fontWeight: p === currentPage ? 700 : 500,
            }}
          >
            {p}
          </Link>
        )
      )}

      {currentPage < totalPages && (
        <Link
          href={buildUrl(currentPage + 1)}
          style={{
            minWidth: "36px",
            height: "36px",
            padding: "0 12px",
            borderRadius: "8px",
            background: "#fff",
            border: "1px solid var(--line)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "11px",
            color: "var(--text)",
          }}
        >
          <i className="fa-solid fa-chevron-right"></i>
        </Link>
      )}
    </div>
  );
}