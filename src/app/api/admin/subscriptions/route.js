// src/app/api/admin/subscriptions/route.js
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const session = await auth();
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "all";

    const where = status !== "all" ? { status } : {};

    const subscriptions = await prisma.userSubscription.findMany({
      where,
      include: {
        user: { select: { email: true, name: true } },
        plan: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // ✅ Always return an array
    return NextResponse.json(subscriptions);
  } catch (error) {
    console.error("Admin subscriptions error:", error);
    // ✅ On error, still return an empty array so the component does not break
    return NextResponse.json([], { status: 200 });
  }
}
