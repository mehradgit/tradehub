// src/app/api/search/route.js
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim();
    const limit = parseInt(searchParams.get("limit")) || 4;

    // اگر کمتر از ۲ کاراکتر بود، خالی برگردان
    if (!q || q.length < 2) {
      return NextResponse.json({
        products: [],
        requests: [],
        profiles: [],
        query: q || "",
      });
    }

    const [products, requests, profiles] = await Promise.all([
      // ====== محصولات عمومی ======
      prisma.product.findMany({
        where: {
          isVisible: true,
          status: "APPROVED",
          OR: [
            { name: { contains: q } },
            { shortDesc: { contains: q } },
            { category: { contains: q } },
            { subCategory: { contains: q } },
          ],
        },
        select: {
          id: true,
          name: true,
          images: true,
          price: true,
          currency: true,
          unit: true,
          category: true,
          productNumber: true,
          slug: true,
          country: true,
          countryCode: true,
          user: {
            select: { companyName: true, name: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
      }),

      // ====== درخواست‌های خرید عمومی ======
      prisma.buyingRequest.findMany({
        where: {
          isVisible: true,
          status: "APPROVED",
          OR: [
            { title: { contains: q } },
            { description: { contains: q } },
            { category: { contains: q } },
            { subCategory: { contains: q } },
            { deliveryCountry: { contains: q } },
          ],
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
          buyerCountry: true,
          createdAt: true,
          requestNumber: true,
          slug: true,
        },
        orderBy: { createdAt: "desc" },
        take: limit,
      }),

      // ====== پروفایل‌های عمومی (کاربران تکمیل‌شده) ======
      prisma.user.findMany({
        where: {
          registrationComplete: true,
          OR: [
            { companyName: { contains: q } },
            { name: { contains: q } },
            { country: { contains: q } },
            { primaryCategory: { contains: q } },
            { businessType: { contains: q } },
          ],
        },
        select: {
          id: true,
          name: true,
          companyName: true,
          image: true,
          logo: true,
          country: true,
          countryCode: true,
          role: true,
          businessType: true,
          profileNumber: true,
          slug: true,
        },
        orderBy: { createdAt: "desc" },
        take: limit,
      }),
    ]);

    return NextResponse.json({
      products,
      requests,
      profiles,
      query: q,
    });
  } catch (error) {
    console.error("Public search error:", error);
    return NextResponse.json(
      { message: "Search failed" },
      { status: 500 }
    );
  }
}