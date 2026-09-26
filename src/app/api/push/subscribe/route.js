// src/app/api/push/subscribe/route.js
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
    const { endpoint, keys, userAgent } = body;

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return NextResponse.json(
        { message: "Invalid subscription data" },
        { status: 400 }
      );
    }

    // upsert: اگر endpoint وجود داشت، به‌روزرسانی کن
    const subscription = await prisma.pushSubscription.upsert({
      where: { endpoint },
      update: {
        userId: session.user.id,
        p256dh: keys.p256dh,
        auth: keys.auth,
        userAgent: userAgent || null,
      },
      create: {
        userId: session.user.id,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
        userAgent: userAgent || null,
      },
    });

    return NextResponse.json({
      message: "Subscription saved",
      subscriptionId: subscription.id,
    });
  } catch (error) {
    console.error("Push subscribe error:", error);
    return NextResponse.json(
      { message: "Failed to save subscription" },
      { status: 500 }
    );
  }
}