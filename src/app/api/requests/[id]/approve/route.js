// src/app/api/admin/requests/[id]/approve/route.js
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache"; // ✅
import {
  createNotification,
  NOTIFICATION_TYPES,
} from "@/lib/notificationService";

export async function PATCH(request, { params }) {
  try {
    const session = await auth();
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { action, rejectionNote = "" } = body;

    if (!["approve", "reject"].includes(action)) {
      return NextResponse.json(
        { message: "Invalid action" },
        { status: 400 },
      );
    }

    const buyingRequest = await prisma.buyingRequest.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        userId: true,
        requestNumber: true,
        slug: true,
      },
    });

    if (!buyingRequest) {
      return NextResponse.json(
        { message: "Request not found" },
        { status: 404 },
      );
    }

    const isApproving = action === "approve";

    const updated = await prisma.buyingRequest.update({
      where: { id },
      data: {
        status: isApproving ? "APPROVED" : "REJECTED",
        isVisible: isApproving,
        rejectionNote: isApproving ? null : rejectionNote,
        approvedAt: isApproving ? new Date() : null,
        approvedBy: isApproving ? session.user.id : null,
      },
    });

    createNotification({
      userId: buyingRequest.userId,
      type: isApproving
        ? NOTIFICATION_TYPES.REQUEST_APPROVED
        : NOTIFICATION_TYPES.REQUEST_REJECTED,
      title: isApproving
        ? "Buying Request Approved"
        : "Buying Request Rejected",
      body: isApproving
        ? `Your buying request "${buyingRequest.title}" has been approved and is now live.`
        : `Your buying request "${buyingRequest.title}" was rejected. Reason: ${
            rejectionNote || "No reason provided."
          }`,
      link: `/dashboard/requests`,
      metadata: { requestId: buyingRequest.id },
    });

    // ✅ Invalidate caches
    revalidatePath("/");
    revalidatePath("/requests");
    revalidatePath(
      `/requests/${buyingRequest.requestNumber}/${buyingRequest.slug}`,
    );

    return NextResponse.json({
      message: isApproving
        ? "Request approved successfully"
        : "Request rejected",
      request: updated,
    });
  } catch (error) {
    console.error("Request approval error:", error);
    return NextResponse.json(
      { message: "Failed to update request" },
      { status: 500 },
    );
  }
}