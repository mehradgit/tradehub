// src/app/api/admin/categories/[id]/route.js
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getCategories, saveCategories } from "@/lib/categoriesService";

// ===== PUT: Update a single category =====
export async function PUT(request, { params }) {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;

    // ID is now a string
    if (!id || typeof id !== "string") {
      return NextResponse.json({ message: "Invalid ID" }, { status: 400 });
    }

    const body = await request.json();
    const { name, icon, isActive, productTypes } = body;

    const categories = await getCategories();
    const index = categories.findIndex((c) => c.id === id);
    if (index === -1) {
      return NextResponse.json(
        { message: "Category not found" },
        { status: 404 }
      );
    }

    if (name !== undefined) {
      const trimmed = name.trim();
      if (!trimmed) {
        return NextResponse.json(
          { message: "Name cannot be empty" },
          { status: 400 }
        );
      }

      // Duplicate check within the same parent (excluding itself)
      const parentId = categories[index].parent;
      const duplicate = categories.find(
        (c) =>
          c.id !== id &&
          c.parent === parentId &&
          c.name.trim().toLowerCase() === trimmed.toLowerCase()
      );
      if (duplicate) {
        return NextResponse.json(
          { message: "This name already exists in this parent" },
          { status: 400 }
        );
      }

      categories[index].name = trimmed;
    }

    if (icon !== undefined) categories[index].icon = icon;
    if (isActive !== undefined) categories[index].isActive = !!isActive;

    // Update productTypes (only meaningful for subcategories)
    if (productTypes !== undefined) {
      if (Array.isArray(productTypes)) {
        categories[index].productTypes = productTypes
          .map((s) => String(s).trim())
          .filter(Boolean);
      } else if (typeof productTypes === "string") {
        categories[index].productTypes = productTypes
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      }
    }

    await saveCategories(categories);

    return NextResponse.json({
      message: "Category updated",
      category: categories[index],
    });
  } catch (error) {
    console.error("Update category error:", error);
    return NextResponse.json(
      { message: "Failed to update category" },
      { status: 500 }
    );
  }
}

// ===== DELETE: Delete a category (with usage check) =====
export async function DELETE(request, { params }) {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;

    // ID is a string
    if (!id || typeof id !== "string") {
      return NextResponse.json({ message: "Invalid ID" }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const cascade = searchParams.get("cascade") === "true";

    const categories = await getCategories();
    const target = categories.find((c) => c.id === id);
    if (!target) {
      return NextResponse.json(
        { message: "Category not found" },
        { status: 404 }
      );
    }

    // Check: is any product/request using this ID?
    const [productCount, requestCount] = await Promise.all([
      prisma.product.count({
        where: {
          OR: [{ category: id }, { subCategory: id }],
        },
      }),
      prisma.buyingRequest.count({
        where: {
          OR: [{ category: id }, { subCategory: id }],
        },
      }),
    ]);

    if (productCount > 0 || requestCount > 0) {
      return NextResponse.json(
        {
          message: `Cannot delete: ${productCount} product(s) and ${requestCount} request(s) are using this category. Please rename or remove them first.`,
          productCount,
          requestCount,
        },
        { status: 400 }
      );
    }

    let updated;
    let removedCount = 1;

    if (cascade) {
      // Delete itself plus all of its subcategories
      const subs = categories.filter((c) => c.parent === id);
      removedCount += subs.length;
      updated = categories.filter(
        (c) => c.id !== id && c.parent !== id
      );
    } else {
      // Only itself; subcategories get parent = 0
      updated = categories
        .filter((c) => c.id !== id)
        .map((c) => (c.parent === id ? { ...c, parent: 0 } : c));
    }

    await saveCategories(updated);

    return NextResponse.json({
      message: `Deleted ${removedCount} item(s)`,
      removedCount,
    });
  } catch (error) {
    console.error("Delete category error:", error);
    return NextResponse.json(
      { message: "Failed to delete category" },
      { status: 500 }
    );
  }
}