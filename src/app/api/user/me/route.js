// src/app/api/user/me/route.js
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        logo: true,
        companyName: true,
        country: true,
        countryCode: true,
        plan: true,
        role: true,
        profileNumber: true,
        slug: true,
      },
    });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // آمار سریع برای badgeها
    const [unreadMessages, unreadNotifications, openTickets] =
      await Promise.all([
        prisma.message.count({
          where: { receiverId: user.id, read: false },
        }),
        prisma.notification.count({
          where: { userId: user.id, read: false },
        }),
        prisma.ticket.count({
          where: {
            userId: user.id,
            status: { in: ["open", "in_progress", "waiting_user", "resolved"] },
            unreadByUser: true,
          },
        }),
      ]);

    return NextResponse.json({
      user,
      stats: { unreadMessages, unreadNotifications, openTickets },
    });
  } catch (error) {
    console.error("User me error:", error);
    return NextResponse.json(
      { message: "Failed to fetch user" },
      { status: 500 }
    );
  }
}