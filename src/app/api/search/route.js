// src/app/api/search/route.js
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim();
    const limit = parseInt(searchParams.get("limit")) || 4;

    // If fewer than 2 characters, return an empty result
    if (!q || q.length < 2) {
      return NextResponse.json({
        products: [],
        requests: [],
        profiles: [],
        query: q || "",
      });
    }

    // ============================================================
    // Important note about search:
    //
    // `contains` actually produces LIKE '%x%' and because the pattern
    // starts with a wildcard character, MySQL cannot use any regular
    // index and is forced to do a full table scan.
    //
    // That is why the combined searchText column was added and a
    // FULLTEXT index is built on it (prisma/sql/fulltext-indexes.sql).
    // For now the contains condition on searchText exists only for
    // compatibility so that old rows with an empty searchText are not
    // lost; in the next step this condition can be converted to
    // MATCH(searchText) AGAINST(?) so that search becomes indexable
    // and ranked.
    // ============================================================
    const [products, requests, profiles] = await Promise.all([
      // ====== Public products ======
      prisma.product.findMany({
        where: {
          isVisible: true,
          status: "APPROVED",
          OR: [
            // Combined search text (when populated) — the future FULLTEXT path
            { searchText: { contains: q } },
            // fallback: the previous columns, for old rows without searchText
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
          ratingAverage: true,
          ratingCount: true,
          user: {
            select: { companyName: true, name: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
      }),

      // ====== Public buying requests ======
      prisma.buyingRequest.findMany({
        where: {
          isVisible: true,
          status: "APPROVED",
          OR: [
            { searchText: { contains: q } },
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

      // ====== Public profiles (completed users) ======
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