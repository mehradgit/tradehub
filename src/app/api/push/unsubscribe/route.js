// src/app/api/push/unsubscribe/route.js
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { endpoint } = body;

    if (endpoint) {
      // حذف یک subscription خاص
      await prisma.pushSubscription.deleteMany({
        where: { endpoint, userId: session.user.id },
      });
    } else {
      // حذف همه‌ی subscriptions کاربر
      await prisma.pushSubscription.deleteMany({
        where: { userId: session.user.id },
      });
    }

    return NextResponse.json({ message: "Subscription(s) removed" });
  } catch (error) {
    console.error("Push unsubscribe error:", error);
    return NextResponse.json(
      { message: "Failed to remove subscription" },
      { status: 500 }
    );
  }
}