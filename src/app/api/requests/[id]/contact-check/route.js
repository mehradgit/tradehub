// src/app/api/requests/[id]/contact-check/route.js
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import {
  canViewRequestContactInfo,
  getAccessControlSettings,
} from "@/lib/accessControlService";

export async function GET(request, { params }) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json(
        { allowed: false, reason: "login_required" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const userId = session.user.id;

    const buyingRequest = await prisma.buyingRequest.findUnique({
      where: { id },
      select: { id: true, userId: true },
    });

    if (!buyingRequest) {
      return NextResponse.json(
        { allowed: false, reason: "not_found" },
        { status: 404 }
      );
    }

    // بررسی مجوز
    const permission = await canViewRequestContactInfo(userId, buyingRequest);

    if (!permission.allowed) {
      return NextResponse.json({
        allowed: false,
        ...permission,
      });
    }

    // آیا این درخواست باید سهمیه مصرف کند؟
    const settings = await getAccessControlSettings();
    const shouldConsumeQuota =
      permission.reason !== "owner" &&
      permission.reason !== "admin" &&
      settings.request.contactInfo.consumeQuotaOnReveal;

    return NextResponse.json({
      allowed: true,
      consumeQuota: shouldConsumeQuota,
    });
  } catch (error) {
    console.error("Contact check error:", error);
    return NextResponse.json(
      { allowed: false, reason: "server_error" },
      { status: 500 }
    );
  }
}