// src/app/api/admin/items/search/route.js
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request) {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "products";
    const q = (searchParams.get("q") || "").trim();
    const limit = Math.min(parseInt(searchParams.get("limit")) || 20, 50);

    if (!["products", "requests"].includes(type)) {
      return NextResponse.json(
        { message: "Invalid type" },
        { status: 400 }
      );
    }

    // ===== Products =====
    if (type === "products") {
      const where = {
        isVisible: true,
        status: "APPROVED",
      };

      if (q.length >= 2) {
        where.OR = [
          { name: { contains: q } },
          { category: { contains: q } },
          { subCategory: { contains: q } },
          { country: { contains: q } },
        ];
      }

      const items = await prisma.product.findMany({
        where,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          category: true,
          subCategory: true,
          price: true,
          currency: true,
          unit: true,
          images: true,
          country: true,
          countryCode: true,
          productNumber: true,
          slug: true,
          user: {
            select: { companyName: true },
          },
        },
      });

      return NextResponse.json({
        items: items.map((p) => ({
          id: p.id,
          title: p.name,
          subtitle: `${p.category}${
            p.subCategory ? ` › ${p.subCategory}` : ""
          }`,
          meta: `${p.currency} ${p.price}/${p.unit}`,
          country: p.country,
          countryCode: p.countryCode,
          image: Array.isArray(p.images) ? p.images[0] : null,
          owner: p.user?.companyName || null,
          productNumber: p.productNumber,
          slug: p.slug,
        })),
      });
    }

    // ===== Requests =====
    const where = {
      isVisible: true,
      status: "APPROVED",
    };

    if (q.length >= 2) {
      where.OR = [
        { title: { contains: q } },
        { category: { contains: q } },
        { subCategory: { contains: q } },
        { buyerCountry: { contains: q } },
        { deliveryCountry: { contains: q } },
      ];
    }

    const items = await prisma.buyingRequest.findMany({
      where,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        category: true,
        subCategory: true,
        quantity: true,
        unit: true,
        buyerCountry: true,
        deliveryCountry: true,
        isUrgent: true,
        requestNumber: true,
        slug: true,
        user: {
          select: { companyName: true },
        },
      },
    });

    return NextResponse.json({
      items: items.map((r) => ({
        id: r.id,
        title: r.title,
        subtitle: `${r.category}${
          r.subCategory ? ` › ${r.subCategory}` : ""
        }`,
        meta: `${r.quantity} ${r.unit}`,
        country: r.buyerCountry || r.deliveryCountry,
        isUrgent: r.isUrgent,
        owner: r.user?.companyName || null,
        requestNumber: r.requestNumber,
        slug: r.slug,
      })),
    });
  } catch (error) {
    console.error("Search items error:", error);
    return NextResponse.json(
      { message: "Failed to search items" },
      { status: 500 }
    );
  }
}