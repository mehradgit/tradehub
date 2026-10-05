// src/app/api/admin/coupons/route.js
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { NextResponse } from "next/server";

// GET: list the codes
export async function GET(request) {
  try {
    const session = await auth();
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const active = searchParams.get("active") || "";

    const where = {};
    if (search) where.code = { contains: search };
    if (active === "true") where.isActive = true;
    if (active === "false") where.isActive = false;

    const coupons = await prisma.coupon.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { usages: true } },
      },
    });

    return NextResponse.json({ coupons });
  } catch (error) {
    console.error("Coupons fetch error:", error);
    return NextResponse.json(
      { message: "Failed to fetch coupons" },
      { status: 500 }
    );
  }
}

// POST: create a new code
export async function POST(request) {
  try {
    const session = await auth();
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      code,
      type,
      value,
      maxUses,
      minAmount,
      maxDiscount,
      appliesToPlans,
      validUntil,
      isActive = true,
    } = body;

    if (!code || !type || value === undefined) {
      return NextResponse.json(
        { message: "Code, type, and value are required" },
        { status: 400 }
      );
    }

    const upperCode = code.toUpperCase().trim();

    const existing = await prisma.coupon.findUnique({
      where: { code: upperCode },
    });

    if (existing) {
      return NextResponse.json(
        { message: "This coupon code already exists" },
        { status: 400 }
      );
    }

    const coupon = await prisma.coupon.create({
      data: {
        code: upperCode,
        type,
        value: parseFloat(value),
        maxUses: maxUses ? parseInt(maxUses) : null,
        minAmount: minAmount ? parseFloat(minAmount) : null,
        maxDiscount: maxDiscount ? parseFloat(maxDiscount) : null,
        appliesToPlans:
          appliesToPlans && appliesToPlans.length > 0
            ? appliesToPlans
            : null,
        validUntil: validUntil ? new Date(validUntil) : null,
        isActive,
        createdById: session.user.id,
      },
    });

    return NextResponse.json({ message: "Coupon created", coupon });
  } catch (error) {
    console.error("Coupon create error:", error);
    return NextResponse.json(
      { message: "Failed to create coupon" },
      { status: 500 }
    );
  }
}