// src/app/api/admin/users/search/route.js
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
    const q = searchParams.get("q")?.trim();

    if (!q || q.length < 2) {
      return NextResponse.json({ users: [] });
    }

    const users = await prisma.user.findMany({
      where: {
        OR: [
          { email: { contains: q } },
          { name: { contains: q } },
          { companyName: { contains: q } },
        ],
      },
      take: 10,
      select: {
        id: true,
        name: true,
        email: true,
        companyName: true,
        country: true,
        plan: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error("User search error:", error);
    return NextResponse.json(
      { message: "Failed to search users" },
      { status: 500 }
    );
  }
}