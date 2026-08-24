import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const targetId = searchParams.get("targetId");

    if (targetId) {
      const saved = await prisma.savedProfile.findUnique({
        where: {
          userId_targetId: {
            userId: session.user.id,
            targetId,
          },
        },
      });
      return NextResponse.json({ isSaved: !!saved });
    }

    const savedProfiles = await prisma.savedProfile.findMany({
      where: { userId: session.user.id },
      include: { target: { select: { id: true, name: true, companyName: true, country: true } } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ savedProfiles });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Failed to fetch saved profiles" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const { targetId } = await request.json();
    if (!targetId) {
      return NextResponse.json({ message: "targetId is required" }, { status: 400 });
    }

    const existing = await prisma.savedProfile.findUnique({
      where: {
        userId_targetId: {
          userId: session.user.id,
          targetId,
        },
      },
    });

    if (existing) {
      await prisma.savedProfile.delete({
        where: {
          userId_targetId: {
            userId: session.user.id,
            targetId,
          },
        },
      });
      return NextResponse.json({ isSaved: false, message: "Profile removed from saved" });
    } else {
      await prisma.savedProfile.create({
        data: {
          userId: session.user.id,
          targetId,
        },
      });
      return NextResponse.json({ isSaved: true, message: "Profile saved successfully" });
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Failed to toggle saved profile" }, { status: 500 });
  }
}