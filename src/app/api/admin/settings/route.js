import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const settings = await prisma.setting.findMany();
  const data = {};
  settings.forEach((s) => (data[s.key] = s.value));

  return NextResponse.json(data);
}

export async function PUT(request) {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json(); // { subscriptionDurations: [180, 360] }

  try {
    await prisma.setting.upsert({
      where: { key: "subscriptionDurations" },
      update: { value: body.subscriptionDurations },
      create: { key: "subscriptionDurations", value: body.subscriptionDurations },
    });

    return NextResponse.json({ message: "Settings updated successfully" });
  } catch (error) {
    return NextResponse.json({ message: "Failed to update settings" }, { status: 500 });
  }
}