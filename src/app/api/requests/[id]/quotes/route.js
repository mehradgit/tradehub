// src/app/api/requests/[id]/quotes/route.js
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function GET(request, { params }) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // بررسی دسترسی: فقط صاحب درخواست می‌تواند پاسخ‌ها را ببیند
    const buyingRequest = await prisma.buyingRequest.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!buyingRequest || buyingRequest.userId !== session.user.id) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const quotes = await prisma.quote.findMany({
      where: { requestId: id },
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
            companyName: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ quotes });
  } catch (error) {
    console.error("Error fetching quotes:", error);
    return NextResponse.json({ message: "Failed to fetch quotes" }, { status: 500 });
  }
}