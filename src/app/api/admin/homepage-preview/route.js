// src/app/api/admin/homepage-preview/route.js
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request) {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { sections } = body;

    if (!Array.isArray(sections)) {
      return NextResponse.json(
        { message: "Invalid data" },
        { status: 400 }
      );
    }

    const preview = {};

    await Promise.all(
      sections.map(async (section) => {
        try {
          preview[section.id] = await fetchSectionItems(section);
        } catch (err) {
          console.error(`Preview error for section ${section.id}:`, err);
          preview[section.id] = [];
        }
      })
    );

    return NextResponse.json({ preview });
  } catch (error) {
    console.error("Preview API error:", error);
    return NextResponse.json(
      { message: "Failed to load preview" },
      { status: 500 }
    );
  }
}

// ===== Fetch items per section (مثل منطق HomePage) =====
async function fetchSectionItems(section) {
  const limit = section.limit || 6;

  // ===== Manual =====
  if (section.mode === "manual") {
    const ids = Array.isArray(section.itemIds) ? section.itemIds : [];
    if (ids.length === 0) return [];

    if (section.type === "products") {
      const items = await prisma.product.findMany({
        where: {
          id: { in: ids },
          isVisible: true,
          status: "APPROVED",
        },
        select: {
          id: true,
          name: true,
          price: true,
          unit: true,
          images: true,
          category: true,
        },
      });
      const map = new Map(items.map((i) => [i.id, i]));
      return ids.map((id) => map.get(id)).filter(Boolean);
    }

    const items = await prisma.buyingRequest.findMany({
      where: {
        id: { in: ids },
        isVisible: true,
        status: "APPROVED",
      },
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        quantity: true,
        unit: true,
        isUrgent: true,
        deliveryCountry: true,
      },
    });
    const map = new Map(items.map((i) => [i.id, i]));
    return ids.map((id) => map.get(id)).filter(Boolean);
  }

  // ===== Latest / Category =====
  const where = { isVisible: true, status: "APPROVED" };

  if (section.mode === "category" && section.category) {
    where.category = section.category;
    if (section.subCategory) {
      where.subCategory = section.subCategory;
    }
  }

  if (section.type === "products") {
    return prisma.product.findMany({
      where,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        price: true,
        unit: true,
        images: true,
        category: true,
      },
    });
  }

  return prisma.buyingRequest.findMany({
    where,
    take: limit,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      description: true,
      category: true,
      quantity: true,
      unit: true,
      isUrgent: true,
      deliveryCountry: true,
    },
  });
}