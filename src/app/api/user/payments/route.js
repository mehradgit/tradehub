// src/app/api/user/payments/route.js
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
    const status = searchParams.get("status") || "";
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 20;
    const skip = (page - 1) * limit;

    const where = { userId: session.user.id };
    if (status && status !== "all") where.status = status;
    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search } },
        { referenceNumber: { contains: search } },
      ];
    }

    const [payments, totalCount, paidSum] = await Promise.all([
      prisma.payment.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          plan: { select: { id: true, name: true } },
          coupon: { select: { id: true, code: true } },
        },
      }),
      prisma.payment.count({ where }),
      prisma.payment.aggregate({
        where: { userId: session.user.id, status: "paid" },
        _sum: { amount: true },
      }),
    ]);

    return NextResponse.json({
      payments,
      totalCount,
      totalPaid: Number(paidSum._sum.amount || 0),
      page,
      totalPages: Math.ceil(totalCount / limit),
    });
  } catch (error) {
    console.error("Payments fetch error:", error);
    return NextResponse.json(
      { message: "Failed to fetch payments" },
      { status: 500 }
    );
  }
}