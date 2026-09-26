// src/app/api/admin/requests/[id]/approve/route.js
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
    const { action, rejectionNote } = body;

    if (action === "approve") {
      const updated = await prisma.buyingRequest.update({
        where: { id },
        data: {
          status: "APPROVED",
          isVisible: true,
          approvedAt: new Date(),
          approvedBy: session.user.id,
          rejectionNote: null,
        },
      });
      return NextResponse.json({ message: "Request approved", request: updated });
    }

    if (action === "reject") {
      const updated = await prisma.buyingRequest.update({
        where: { id },
        data: {
          status: "REJECTED",
          isVisible: false,
          rejectionNote: rejectionNote || "Rejected by admin",
          approvedAt: null,
          approvedBy: null,
        },
      });
      return NextResponse.json({ message: "Request rejected", request: updated });
    }

    return NextResponse.json({ message: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Request approval error:", error);
    return NextResponse.json(
      { message: "Failed to update request" },
      { status: 500 }
    );
  }
}