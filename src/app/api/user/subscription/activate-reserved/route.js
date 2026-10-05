import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const userId = session.user.id;
    const reserved = await prisma.userSubscription.findFirst({
      where: { userId, status: "reserved" },
      orderBy: { createdAt: "desc" },
    });

    if (!reserved) {
      return NextResponse.json({ message: "No reserved subscription found" }, { status: 404 });
    }

    // Cancel the currently active subscription (if any)
    await prisma.userSubscription.updateMany({
      where: { userId, status: "active" },
      data: { status: "ended" },
    });

    // Activate the reserved subscription
    await prisma.userSubscription.update({
      where: { id: reserved.id },
      data: { status: "active" },
    });

    return NextResponse.json({ message: "Reserved subscription activated successfully" });
  } catch (error) {
    console.error("Activate reserved error:", error);
    return NextResponse.json({ message: "Failed to activate reserved subscription" }, { status: 500 });
  }
}