// src/app/api/categories/route.js
import { NextResponse } from "next/server";
import { getCategories } from "@/lib/categoriesService";

export const revalidate = 60; // cache 60s

export async function GET() {
  try {
    const categories = await getCategories();
    // فقط active ها برای کاربران عادی
    const active = categories.filter((c) => c.isActive !== false);
    return NextResponse.json({ categories: active });
  } catch (error) {
    console.error("Public categories error:", error);
    return NextResponse.json(
      { message: "Failed to load categories" },
      { status: 500 }
    );
  }
}