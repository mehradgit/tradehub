// src/app/api/user/search/route.js
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim();
    const limit = parseInt(searchParams.get("limit")) || 3;

    // If fewer than 2 characters, return empty results
    if (!q || q.length < 2) {
      return NextResponse.json({
        products: [],
        requests: [],
        tickets: [],
        messages: [],
        query: q || "",
      });
    }

    const userId = session.user.id;

    const [products, requests, tickets, messages] = await Promise.all([
      // ====== User products ======
      prisma.product.findMany({
        where: {
          userId,
          OR: [
            { name: { contains: q } },
            { shortDesc: { contains: q } },
            { category: { contains: q } },
          ],
        },
        select: {
          id: true,
          name: true,
          images: true,
          productNumber: true,
          slug: true,
          category: true,
        },
        orderBy: { createdAt: "desc" },
        take: limit,
      }),

      // ====== User buying requests ======
      prisma.buyingRequest.findMany({
        where: {
          userId,
          OR: [
            { title: { contains: q } },
            { description: { contains: q } },
            { category: { contains: q } },
          ],
        },
        select: {
          id: true,
          title: true,
          requestNumber: true,
          slug: true,
          category: true,
        },
        orderBy: { createdAt: "desc" },
        take: limit,
      }),

      // ====== User tickets ======
      prisma.ticket.findMany({
        where: {
          userId,
          OR: [
            { subject: { contains: q } },
            { ticketNumber: parseInt(q) || -1 },
          ],
        },
        select: {
          id: true,
          subject: true,
          ticketNumber: true,
          status: true,
        },
        orderBy: { updatedAt: "desc" },
        take: limit,
      }),

      // ====== Messages ======
      prisma.message.findMany({
        where: {
          OR: [
            { senderId: userId, content: { contains: q } },
            { receiverId: userId, content: { contains: q } },
          ],
        },
        select: {
          id: true,
          content: true,
          createdAt: true,
          sender: {
            select: {
              id: true,
              name: true,
              companyName: true,
              image: true,
            },
          },
          receiver: {
            select: {
              id: true,
              name: true,
              companyName: true,
              image: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
      }),
    ]);

    return NextResponse.json({
      products,
      requests,
      tickets,
      messages,
      query: q,
    });
  } catch (error) {
    console.error("Global search error:", error);
    return NextResponse.json(
      { message: "Search failed" },
      { status: 500 }
    );
  }
}