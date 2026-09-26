// src/app/api/requests/[id]/reveal-buyer/route.js
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import {
  canViewBuyerInfo,
  getAccessControlSettings,
  hasRevealedBuyerInfo,
} from "@/lib/accessControlService";
import { getUserActivePlan, incrementUsage } from "@/lib/planService";

export async function POST(request, { params }) {
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

    // ====== دریافت درخواست ======
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

    // ====== اگر قبلاً Reveal کرده → بدون سهمیه ======
    const alreadyRevealed = await hasRevealedBuyerInfo(userId, id);
    if (alreadyRevealed) {
      return NextResponse.json({
        allowed: true,
        consumed: false,
        alreadyRevealed: true,
      });
    }

    // ====== بررسی مجوز ======
    const permission = await canViewBuyerInfo(userId, buyingRequest);
    if (!permission.allowed) {
      return NextResponse.json(
        { allowed: false, ...permission },
        { status: 403 }
      );
    }

    // ====== آیا سهمیه مصرف می‌شود؟ ======
    const isOwnerOrAdmin =
      permission.reason === "owner" || permission.reason === "admin";

    if (!isOwnerOrAdmin) {
      // ====== مصرف سهمیه ======
      const settings = await getAccessControlSettings();
      const quotaType = settings.request.buyerInfo.quotaType || "inquiry";

      if (settings.request.buyerInfo.consumeQuotaOnReveal) {
        const { subscription } = await getUserActivePlan(userId);
        await incrementUsage(userId, quotaType, subscription);
      }

      // ====== ثبت Reveal در دیتابیس (فقط برای کاربران عادی) ======
      try {
        await prisma.revealedBuyerInfo.create({
          data: {
            userId,
            requestId: id,
          },
        });
      } catch (err) {
        // اگر قبلاً وجود دارد (race condition)، نادیده بگیر
        if (err.code !== "P2002") {
          console.error("Failed to save reveal record:", err);
        }
      }
    }

    return NextResponse.json({
      allowed: true,
      consumed: !isOwnerOrAdmin,
    });
  } catch (error) {
    console.error("Reveal buyer error:", error);
    return NextResponse.json(
      { allowed: false, reason: "server_error" },
      { status: 500 }
    );
  }
}