// src/app/api/admin/homepage-sections/route.js
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  getHomepageSections,
  saveHomepageSections,
} from "@/lib/homepageService";

const VALID_POSITIONS = ["top", "after-companies", "before-cta"];

export async function GET() {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const sections = await getHomepageSections();
  return NextResponse.json({ sections });
}

// ===== POST =====
export async function POST(request) {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      type = "products",
      mode = "latest",
      title,
      subtitle = "",
      icon = null,
      category = null,
      subCategory = null,
      limit = 6,
      itemIds = [],
      position = "top",                    // ✅ new
    } = body;

    if (!title?.trim()) {
      return NextResponse.json(
        { message: "Title is required" },
        { status: 400 }
      );
    }

    if (!["products", "requests"].includes(type)) {
      return NextResponse.json({ message: "Invalid type" }, { status: 400 });
    }

    if (!["latest", "category", "manual"].includes(mode)) {
      return NextResponse.json({ message: "Invalid mode" }, { status: 400 });
    }

    if (!VALID_POSITIONS.includes(position)) {
      return NextResponse.json(
        { message: "Invalid position" },
        { status: 400 }
      );
    }

    if (mode === "category" && !category?.trim()) {
      return NextResponse.json(
        { message: "Category is required for category mode" },
        { status: 400 }
      );
    }

    if (mode === "manual" && (!Array.isArray(itemIds) || itemIds.length === 0)) {
      return NextResponse.json(
        { message: "Please select at least one item for manual mode" },
        { status: 400 }
      );
    }

    const sections = await getHomepageSections();
    const id = `section-${Date.now().toString(36)}-${Math.random()
      .toString(36)
      .slice(2, 6)}`;

    const newSection = {
      id,
      type,
      mode,
      title: title.trim(),
      subtitle: subtitle?.trim() || "",
      icon: icon?.trim() || null,
      category: mode === "category" ? category.trim() : null,
      subCategory: mode === "category" ? subCategory?.trim() || null : null,
      itemIds: mode === "manual" ? itemIds : [],
      limit:
        mode === "manual"
          ? itemIds.length
          : Math.max(1, Math.min(24, parseInt(limit) || 6)),
      order: sections.length,
      position,                            // ✅
      isActive: true,
    };

    await saveHomepageSections([...sections, newSection]);

    return NextResponse.json({
      message: "Section created",
      section: newSection,
    });
  } catch (error) {
    console.error("Create section error:", error);
    return NextResponse.json(
      { message: "Failed to create section" },
      { status: 500 }
    );
  }
}

// ===== PUT (bulk reorder) =====
export async function PUT(request) {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await request.json();
    const { sections } = body;
    if (!Array.isArray(sections)) {
      return NextResponse.json({ message: "Invalid data" }, { status: 400 });
    }
    const reordered = sections.map((s, idx) => ({ ...s, order: idx }));
    await saveHomepageSections(reordered);
    return NextResponse.json({ message: "Sections updated" });
  } catch (error) {
    console.error("Bulk update error:", error);
    return NextResponse.json(
      { message: "Failed to update sections" },
      { status: 500 }
    );
  }
}