// src/app/api/user/notifications/[id]/read/route.js
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

    const notification = await prisma.notification.findUnique({
      where: { id },
      select: { userId: true, read: true },
    });

    if (!notification) {
      return NextResponse.json(
        { message: "Notification not found" },
        { status: 404 }
      );
    }

    if (notification.userId !== session.user.id) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    if (notification.read) {
      return NextResponse.json({ message: "Already read" });
    }

    await prisma.notification.update({
      where: { id },
      data: { read: true, readAt: new Date() },
    });

    return NextResponse.json({ message: "Marked as read" });
  } catch (error) {
    console.error("Mark read error:", error);
    return NextResponse.json(
      { message: "Failed to mark as read" },
      { status: 500 }
    );
  }
}