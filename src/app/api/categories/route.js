// src/app/api/categories/route.js
import { NextResponse } from "next/server";
import { getCategories } from "@/lib/categoriesService";
import { buildCategoryTree, flattenTree } from "@/lib/categoryTree";

export const revalidate = 60; // cache 60s

export async function GET() {
  try {
    const categories = await getCategories();
    const active = categories.filter((c) => c.isActive !== false);

    // ===== Three-level tree =====
    const tree = buildCategoryTree(active).filter((n) => n.isActive !== false);

    // ===== Flat list (for compatibility with the existing code) =====
    const flat = flattenTree(tree).filter((n) => n.isActive !== false);

    return NextResponse.json({
      categories: active, // ← previous shape, unchanged
      tree, // ← three-level tree
      flat, // ← three-level flat list with path
    });
  } catch (error) {
    console.error("Public categories error:", error);
    return NextResponse.json(
      { message: "Failed to load categories" },
      { status: 500 }
    );
  }
}
