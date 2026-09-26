// src/app/api/admin/coupons/[id]/route.js
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function PATCH(request, { params }) {
  try {
    const session = await auth();
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const coupon = await prisma.coupon.update({
      where: { id },
      data: {
        ...(body.isActive !== undefined && { isActive: body.isActive }),
        ...(body.maxUses !== undefined && { maxUses: body.maxUses }),
        ...(body.validUntil !== undefined && {
          validUntil: body.validUntil ? new Date(body.validUntil) : null,
        }),
      },
    });

    return NextResponse.json({ coupon });
  } catch (error) {
    console.error("Coupon update error:", error);
    return NextResponse.json(
      { message: "Failed to update coupon" },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await auth();
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    await prisma.coupon.delete({ where: { id } });

    return NextResponse.json({ message: "Coupon deleted" });
  } catch (error) {
    console.error("Coupon delete error:", error);
    return NextResponse.json(
      { message: "Failed to delete coupon" },
      { status: 500 }
    );
  }
}