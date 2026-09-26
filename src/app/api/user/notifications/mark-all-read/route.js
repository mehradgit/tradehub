// src/app/api/user/notifications/mark-all-read/route.js
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function PATCH() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const result = await prisma.notification.updateMany({
      where: { userId: session.user.id, read: false },
      data: { read: true, readAt: new Date() },
    });

    return NextResponse.json({
      message: `${result.count} notifications marked as read`,
      updated: result.count,
    });
  } catch (error) {
    console.error("Mark all read error:", error);
    return NextResponse.json(
      { message: "Failed to mark all as read" },
      { status: 500 }
    );
  }
}