// src/app/api/admin/homepage-sections/[id]/route.js
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  getHomepageSections,
  saveHomepageSections,
} from "@/lib/homepageService";

const VALID_POSITIONS = ["top", "after-companies", "before-cta"];

export async function PUT(request, { params }) {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();

    const sections = await getHomepageSections();
    const index = sections.findIndex((s) => s.id === id);
    if (index === -1) {
      return NextResponse.json(
        { message: "Section not found" },
        { status: 404 }
      );
    }

    const section = { ...sections[index] };

    if (body.title !== undefined) {
      if (!body.title.trim()) {
        return NextResponse.json(
          { message: "Title cannot be empty" },
          { status: 400 }
        );
      }
      section.title = body.title.trim();
    }

    if (body.subtitle !== undefined) section.subtitle = body.subtitle.trim();
    if (body.icon !== undefined) section.icon = body.icon?.trim() || null;

    if (body.type !== undefined) {
      if (!["products", "requests"].includes(body.type)) {
        return NextResponse.json({ message: "Invalid type" }, { status: 400 });
      }
      section.type = body.type;
    }

    if (body.mode !== undefined) {
      if (!["latest", "category", "manual"].includes(body.mode)) {
        return NextResponse.json({ message: "Invalid mode" }, { status: 400 });
      }
      section.mode = body.mode;
      if (body.mode === "latest") {
        section.category = null;
        section.subCategory = null;
        section.itemIds = [];
      }
    }

    // ✅ Position
    if (body.position !== undefined) {
      if (!VALID_POSITIONS.includes(body.position)) {
        return NextResponse.json(
          { message: "Invalid position" },
          { status: 400 }
        );
      }
      section.position = body.position;
    }

    if (body.category !== undefined) {
      section.category =
        section.mode === "category" ? body.category?.trim() || null : null;
    }

    if (body.subCategory !== undefined) {
      section.subCategory =
        section.mode === "category"
          ? body.subCategory?.trim() || null
          : null;
    }

    if (body.itemIds !== undefined) {
      section.itemIds =
        section.mode === "manual" && Array.isArray(body.itemIds)
          ? body.itemIds
          : [];
    }

    if (body.limit !== undefined) {
      section.limit =
        section.mode === "manual"
          ? (section.itemIds || []).length
          : Math.max(1, Math.min(24, parseInt(body.limit) || 6));
    }

    if (body.isActive !== undefined) section.isActive = !!body.isActive;

    if (section.mode === "category" && !section.category) {
      return NextResponse.json(
        { message: "Category is required for category mode" },
        { status: 400 }
      );
    }

    if (
      section.mode === "manual" &&
      (!section.itemIds || section.itemIds.length === 0)
    ) {
      return NextResponse.json(
        { message: "Please select at least one item for manual mode" },
        { status: 400 }
      );
    }

    if (section.mode === "manual") {
      section.limit = section.itemIds.length;
    }

    sections[index] = section;
    await saveHomepageSections(sections);

    return NextResponse.json({ message: "Section updated", section });
  } catch (error) {
    console.error("Update section error:", error);
    return NextResponse.json(
      { message: "Failed to update section" },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  try {
    const { id } = await params;
    const sections = await getHomepageSections();
    if (!sections.some((s) => s.id === id)) {
      return NextResponse.json(
        { message: "Section not found" },
        { status: 404 }
      );
    }
    const updated = sections
      .filter((s) => s.id !== id)
      .map((s, idx) => ({ ...s, order: idx }));
    await saveHomepageSections(updated);
    return NextResponse.json({ message: "Section deleted" });
  } catch (error) {
    console.error("Delete section error:", error);
    return NextResponse.json(
      { message: "Failed to delete section" },
      { status: 500 }
    );
  }
}