// src/app/api/product-inquiries/[id]/read/route.js
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function PATCH(request, { params }) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const inquiry = await prisma.productInquiry.findUnique({
      where: { id },
      select: { supplierId: true, userId: true },
    });

    if (!inquiry) {
      return NextResponse.json({ message: "Inquiry not found" }, { status: 404 });
    }

    // If the user is neither the supplier nor the buyer, access is denied
    if (inquiry.supplierId !== session.user.id && inquiry.userId !== session.user.id) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    await prisma.productInquiry.update({
      where: { id },
      data: { read: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error marking inquiry as read:", error);
    return NextResponse.json({ message: "Failed to mark as read" }, { status: 500 });
  }
}