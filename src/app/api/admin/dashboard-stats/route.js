// src/app/api/admin/dashboard-stats/route.js
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const [openTickets, unreadMessages, pendingApprovals] = await Promise.all([
      prisma.ticket.count({
        where: { status: { in: ["open", "in_progress"] } },
      }),
      prisma.message.count({ where: { read: false } }),
      Promise.all([
        prisma.product.count({ where: { status: "PENDING" } }),
        prisma.buyingRequest.count({ where: { status: "PENDING" } }),
      ]).then(([p, r]) => p + r),
    ]);

    return NextResponse.json({
      openTickets,
      unreadMessages,
      pendingApprovals,
    });
  } catch (error) {
    console.error("Admin dashboard stats error:", error);
    return NextResponse.json(
      { message: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}