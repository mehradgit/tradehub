// src/app/api/admin/payments/[id]/route.js
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function GET(request, { params }) {
  try {
    const session = await auth();
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            companyName: true,
            country: true,
            countryCode: true,
            plan: true,
            profileNumber: true,
            slug: true,
          },
        },
        plan: true,
        coupon: true,
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        usages: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    if (!payment) {
      return NextResponse.json(
        { message: "Payment not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ payment });
  } catch (error) {
    console.error("Admin payment detail error:", error);
    return NextResponse.json(
      { message: "Failed to fetch payment" },
      { status: 500 }
    );
  }
}