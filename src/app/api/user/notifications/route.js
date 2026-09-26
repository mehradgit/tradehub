// src/app/api/user/notifications/route.js
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { NextResponse } from "next/server";

// ====== GET: لیست نوتیفیکیشن‌ها با صفحه‌بندی ======
export async function GET(request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filter = searchParams.get("filter") || "all"; // all, unread, read
    const type = searchParams.get("type") || "";
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 20;
    const skip = (page - 1) * limit;

    const where = { userId: session.user.id };
    if (filter === "unread") where.read = false;
    if (filter === "read") where.read = true;
    if (type) where.type = type;

    const [notifications, totalCount, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({
        where: { userId: session.user.id, read: false },
      }),
    ]);

    return NextResponse.json({
      notifications,
      totalCount,
      unreadCount,
      page,
      totalPages: Math.ceil(totalCount / limit),
    });
  } catch (error) {
    console.error("Notifications fetch error:", error);
    return NextResponse.json(
      { message: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}

// ====== DELETE: پاک کردن همه‌ی نوتیفیکیشن‌ها ======
export async function DELETE() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const result = await prisma.notification.deleteMany({
      where: { userId: session.user.id },
    });

    return NextResponse.json({
      message: `${result.count} notifications deleted`,
      deleted: result.count,
    });
  } catch (error) {
    console.error("Notifications clear error:", error);
    return NextResponse.json(
      { message: "Failed to clear notifications" },
      { status: 500 }
    );
  }
}