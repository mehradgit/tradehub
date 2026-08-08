// src/components/requests/Pagination.js
"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

export default function Pagination({ currentPage, totalPages }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const createPageUrl = (page) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", page);
    return `${pathname}?${params.toString()}`;
  };

  const pages = [];
  const maxVisible = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  let endPage = Math.min(totalPages, startPage + maxVisible - 1);

  if (endPage - startPage < maxVisible - 1) {
    startPage = Math.max(1, endPage - maxVisible + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  if (totalPages <= 1) return null;

  return (
    <div className="pagination-container">
      <nav aria-label="Page navigation">
        <ul className="pagination">
          {currentPage > 1 && (
            <li className="page-item">
              <Link href={createPageUrl(currentPage - 1)} className="page-link">
                <i className="fas fa-chevron-left"></i>
              </Link>
            </li>
          )}

          {startPage > 1 && (
            <>
              <li className="page-item">
                <Link href={createPageUrl(1)} className="page-link">
                  1
                </Link>
              </li>
              {startPage > 2 && <li className="page-item disabled"><span className="page-link">…</span></li>}
            </>
          )}

          {pages.map((page) => (
            <li key={page} className={`page-item ${page === currentPage ? "active" : ""}`}>
              <Link href={createPageUrl(page)} className="page-link">
                {page}
              </Link>
            </li>
          ))}

          {endPage < totalPages && (
            <>
              {endPage < totalPages - 1 && <li className="page-item disabled"><span className="page-link">…</span></li>}
              <li className="page-item">
                <Link href={createPageUrl(totalPages)} className="page-link">
                  {totalPages}
                </Link>
              </li>
            </>
          )}

          {currentPage < totalPages && (
            <li className="page-item">
              <Link href={createPageUrl(currentPage + 1)} className="page-link">
                <i className="fas fa-chevron-right"></i>
              </Link>
            </li>
          )}
        </ul>
      </nav>
    </div>
  );
}