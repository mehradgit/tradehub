// src/app/api/admin/categories/route.js
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getCategories, saveCategories } from "@/lib/categoriesService";

// ===== GET: List all categories =====
export async function GET() {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const categories = await getCategories();
  return NextResponse.json({ categories });
}

// ===== POST: Create a new category =====
export async function POST(request) {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, parent = 0, icon = null } = body;

    if (!name?.trim()) {
      return NextResponse.json(
        { message: "Name is required" },
        { status: 400 }
      );
    }

    const categories = await getCategories();

    // parent can be 0 (number) or a string (the parent category ID)
    const parentValue = parent === 0 || parent === "0" ? 0 : parent;

    // Duplicate check within the same parent
    const duplicate = categories.find(
      (c) =>
        c.parent === parentValue &&
        c.name.trim().toLowerCase() === name.trim().toLowerCase()
    );
    if (duplicate) {
      return NextResponse.json(
        { message: "This name already exists in this parent" },
        { status: 400 }
      );
    }

    // Build a unique slug from the name
    const baseSlug = name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    let slug = baseSlug || `cat-${Date.now()}`;
    let counter = 1;
    while (categories.some((c) => c.id === slug || c.slug === slug)) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Number of existing items in this parent, used for sortOrder
    const siblingCount = categories.filter(
      (c) => c.parent === parentValue
    ).length;

    const newCategory = {
      id: slug,
      name: name.trim(),
      slug: slug,
      parent: parentValue,
      icon: icon || null,
      description: null,
      sortOrder: siblingCount + 1,
      productTypes: [],
      isActive: true,
    };

    await saveCategories([...categories, newCategory]);

    return NextResponse.json({
      message: "Category created",
      category: newCategory,
    });
  } catch (error) {
    console.error("Create category error:", error);
    return NextResponse.json(
      { message: "Failed to create category" },
      { status: 500 }
    );
  }
}