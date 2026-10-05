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

    // ====== Fetch the request ======
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

    // ====== Already revealed → no quota ======
    const alreadyRevealed = await hasRevealedBuyerInfo(userId, id);
    if (alreadyRevealed) {
      return NextResponse.json({
        allowed: true,
        consumed: false,
        alreadyRevealed: true,
      });
    }

    // ====== Check permission ======
    const permission = await canViewBuyerInfo(userId, buyingRequest);
    if (!permission.allowed) {
      return NextResponse.json(
        { allowed: false, ...permission },
        { status: 403 }
      );
    }

    // ====== Should quota be consumed? ======
    const isOwnerOrAdmin =
      permission.reason === "owner" || permission.reason === "admin";

    if (!isOwnerOrAdmin) {
      // ====== Consume quota ======
      const settings = await getAccessControlSettings();
      const quotaType = settings.request.buyerInfo.quotaType || "inquiry";

      if (settings.request.buyerInfo.consumeQuotaOnReveal) {
        const { subscription } = await getUserActivePlan(userId);
        await incrementUsage(userId, quotaType, subscription);
      }

      // ====== Save the reveal in the database (regular users only) ======
      try {
        await prisma.revealedBuyerInfo.create({
          data: {
            userId,
            requestId: id,
          },
        });
      } catch (err) {
        // If it already exists (race condition), ignore it
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