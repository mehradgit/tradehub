// src/app/(public)/search/page.js
// ============================================================
// This page has been removed.
//
// With the addition of the "mega search" in the header and the
// scope selector (Products / Requests / Companies), search always
// goes to one of the filtered pages. The combined search page is
// no longer needed.
//
// To preserve old links and bookmarks, instead of a 404 it
// redirects to the products page with the same search term.
//
// You can delete this file manually (the whole search folder).
// ============================================================
import { redirect } from "next/navigation";

export default async function SearchPage({ searchParams }) {
  const params = (await searchParams) || {};
  const q = String(params.q || params.search || "").trim();

  const target = new URLSearchParams();
  if (q) target.set("search", q);
  const query = target.toString();

  redirect(query ? `/products?${query}` : "/products");
}
