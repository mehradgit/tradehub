// src/app/api/admin/payments/route.js
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import {
  createPayment,
  confirmPayment,
  createSubscriptionFromPayment,
} from "@/lib/paymentService";

// ====== GET: list all payments ======
export async function GET(request) {
  try {
    const session = await auth();
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "";
    const planId = searchParams.get("planId") || "";
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 20;
    const skip = (page - 1) * limit;

    const where = {};
    if (status && status !== "all") where.status = status;
    if (planId) where.planId = planId;
    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search } },
        { referenceNumber: { contains: search } },
        { user: { email: { contains: search } } },
        { user: { name: { contains: search } } },
        { user: { companyName: { contains: search } } },
      ];
    }

    const [payments, totalCount, stats] = await Promise.all([
      prisma.payment.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              companyName: true,
              country: true,
              countryCode: true,
            },
          },
          plan: { select: { id: true, name: true } },
          coupon: { select: { code: true } },
        },
      }),
      prisma.payment.count({ where }),
      Promise.all([
        prisma.payment.aggregate({
          where: { status: "paid" },
          _sum: { amount: true },
        }),
        prisma.payment.count({ where: { status: "paid" } }),
        prisma.payment.count({ where: { status: "pending" } }),
        prisma.payment.count({ where: { status: "failed" } }),
      ]),
    ]);

    const [totalRevenue, paidCount, pendingCount, failedCount] = stats;

    return NextResponse.json({
      payments,
      totalCount,
      stats: {
        totalRevenue: Number(totalRevenue._sum.amount || 0),
        paidCount,
        pendingCount,
        failedCount,
      },
      page,
      totalPages: Math.ceil(totalCount / limit),
    });
  } catch (error) {
    console.error("Admin payments error:", error);
    return NextResponse.json(
      { message: "Failed to fetch payments" },
      { status: 500 }
    );
  }
}

// ====== POST: create a Payment manually (by an admin) ======
export async function POST(request) {
  try {
    const session = await auth();
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      userId,
      planId,
      duration,
      amount,
      description,
      status = "paid",
      method = "manual",
      referenceNumber,
    } = body;

    if (!userId || !planId || !duration || !amount) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    const payment = await createPayment({
      userId,
      planId,
      duration,
      originalAmount: parseFloat(amount),
      amount: parseFloat(amount),
      discountAmount: 0,
      status,
      method,
      description: description || "Manual payment",
      createdById: session.user.id,
    });

    // If status = paid, create the subscription
    if (status === "paid") {
      await createSubscriptionFromPayment(payment);
    }

    return NextResponse.json({
      message: "Payment created successfully",
      payment,
    });
  } catch (error) {
    console.error("Manual payment error:", error);
    return NextResponse.json(
      { message: "Failed to create payment" },
      { status: 500 }
    );
  }
}