// src/app/api/admin/settings/access-control/route.js
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import {
  getAccessControlSettings,
  saveAccessControlSettings,
} from "@/lib/accessControlService";

export async function GET() {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const settings = await getAccessControlSettings();
  return NextResponse.json(settings);
}

export async function PUT(request) {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    await saveAccessControlSettings(body);
    return NextResponse.json({ message: "Settings saved successfully" });
  } catch (error) {
    console.error("Save access control error:", error);
    return NextResponse.json(
      { message: "Failed to save settings" },
      { status: 500 }
    );
  }
}