import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function PATCH(request, { params }) {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  // ✅ Await params in Next.js 15
  const { subscriptionId } = await params;

  const body = await request.json(); // { action: "cancel" | "extend", days?: number }

  try {
    const subscription = await prisma.userSubscription.findUnique({
      where: { id: subscriptionId },
    });

    if (!subscription) {
      return NextResponse.json({ message: "Subscription not found" }, { status: 404 });
    }

    if (body.action === "cancel") {
      await prisma.userSubscription.update({
        where: { id: subscriptionId },
        data: { status: "cancelled", cancelReason: body.reason || "Cancelled by admin" },
      });
    } else if (body.action === "extend" && body.days) {
      const days = parseInt(body.days, 10);
      if (isNaN(days) || days <= 0) {
        return NextResponse.json({ message: "Invalid days value" }, { status: 400 });
      }
      const newEndDate = new Date(subscription.endDate);
      newEndDate.setDate(newEndDate.getDate() + days);
      await prisma.userSubscription.update({
        where: { id: subscriptionId },
        data: { endDate: newEndDate },
      });
    } else {
      return NextResponse.json({ message: "Invalid action" }, { status: 400 });
    }

    return NextResponse.json({ message: "Subscription updated" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Failed to update subscription" }, { status: 500 });
  }
}