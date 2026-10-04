// src/app/api/requests/[id]/approve/route.js
// ⚠️ توجه: این روت با /api/admin/requests/[id]/approve تکراری است.
//    پنل ادمین نسخه‌ی admin را صدا می‌زند. این فایل فقط برای
//    سازگاری عقب‌رو نگه داشته شده و رفتارش یکسان شده است.
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { NextResponse, after } from "next/server";
import { revalidatePath } from "next/cache"; // ✅
import { dispatchEvent } from "@/lib/eventService";

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

    // ✅ اطلاع به صاحب درخواست از مسیر مرکزی رویداد
    after(async () => {
      const result = await dispatchEvent("request.reviewed", {
        requestId: buyingRequest.id,
        approved: isApproving,
        rejectionNote,
      });
      if (result?.error) {
        console.error("[request.reviewed] dispatch error:", result.error);
      }
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