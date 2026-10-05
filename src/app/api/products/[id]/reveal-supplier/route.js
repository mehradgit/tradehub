// src/app/api/products/[id]/reveal-supplier/route.js
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import {
  canViewSupplierInfo,
  getAccessControlSettings,
  hasRevealedSupplierInfo,
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

    const product = await prisma.product.findUnique({
      where: { id },
      select: { id: true, userId: true },
    });

    if (!product) {
      return NextResponse.json(
        { allowed: false, reason: "not_found" },
        { status: 404 }
      );
    }

    // Already revealed before → no quota consumed
    const alreadyRevealed = await hasRevealedSupplierInfo(userId, id);
    if (alreadyRevealed) {
      return NextResponse.json({
        allowed: true,
        consumed: false,
        alreadyRevealed: true,
      });
    }

    // Check permission
    const permission = await canViewSupplierInfo(userId, product);
    if (!permission.allowed) {
      return NextResponse.json(
        { allowed: false, ...permission },
        { status: 403 }
      );
    }

    // Check owner/admin
    const isOwnerOrAdmin =
      permission.reason === "owner" || permission.reason === "admin";

    if (!isOwnerOrAdmin) {
      const settings = await getAccessControlSettings();
      const quotaType = settings.product.supplierInfo.quotaType || "inquiry";

      if (settings.product.supplierInfo.consumeQuotaOnReveal) {
        const { subscription } = await getUserActivePlan(userId);
        await incrementUsage(userId, quotaType, subscription);
      }

      // Record the reveal
      try {
        await prisma.revealedSupplierInfo.create({
          data: { userId, productId: id },
        });
      } catch (err) {
        if (err.code !== "P2002") {
          console.error("Failed to save supplier reveal:", err);
        }
      }
    }

    return NextResponse.json({
      allowed: true,
      consumed: !isOwnerOrAdmin,
    });
  } catch (error) {
    console.error("Reveal supplier error:", error);
    return NextResponse.json(
      { allowed: false, reason: "server_error" },
      { status: 500 }
    );
  }
}