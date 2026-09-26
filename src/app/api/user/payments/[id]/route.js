// src/app/api/user/payments/[id]/route.js
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

    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        plan: { select: { id: true, name: true, description: true } },
        coupon: { select: { id: true, code: true, type: true, value: true } },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            companyName: true,
            country: true,
            countryCode: true,
            address: true,
            phone: true,
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

    if (payment.userId !== session.user.id) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ payment });
  } catch (error) {
    console.error("Payment fetch error:", error);
    return NextResponse.json(
      { message: "Failed to fetch payment" },
      { status: 500 }
    );
  }
}