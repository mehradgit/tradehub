// src/app/api/requests/[id]/contact/route.js
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { getUserActivePlan, incrementUsage } from "@/lib/planService";
import {
  canViewRequestContactInfo,
  getAccessControlSettings,
} from "@/lib/accessControlService";

export async function POST(request, { params }) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json(
        { message: "Login required", reason: "login_required" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const userId = session.user.id;

    // ====== Fetch the request and the buyer info ======
    const buyingRequest = await prisma.buyingRequest.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        user: {
          select: {
            id: true,
            name: true,
            companyName: true,
            email: true,
            companyEmail: true,
            phone: true,
            website: true,
            country: true,
            countryCode: true,
            profileNumber: true,
            slug: true,
          },
        },
      },
    });

    if (!buyingRequest) {
      return NextResponse.json(
        { message: "Request not found" },
        { status: 404 }
      );
    }

    // ====== Check permission (includes owner/admin/plan/quota) ======
    const permission = await canViewRequestContactInfo(userId, buyingRequest);

    if (!permission.allowed) {
      return NextResponse.json(
        { message: "Permission denied", ...permission },
        { status: 403 }
      );
    }

    // ====== Should this request consume quota? ======
    const shouldConsumeQuota =
      permission.reason !== "owner" && permission.reason !== "admin";

    // ====== Read the settings to determine the quota type ======
    const settings = await getAccessControlSettings();
    const quotaType = settings.request.contactInfo.quotaType || "inquiry";

    // ====== Consume quota (if needed) ======
    if (shouldConsumeQuota) {
      const { subscription } = await getUserActivePlan(userId);
      await incrementUsage(userId, quotaType, subscription);
    }

    return NextResponse.json({
      contactInfo: buildContactInfo(buyingRequest.user),
      consumed: shouldConsumeQuota,
    });
  } catch (error) {
    console.error("Contact buyer error:", error);
    return NextResponse.json(
      { message: "Failed to fetch contact info" },
      { status: 500 }
    );
  }
}

// ====== Build the contact info ======
function buildContactInfo(user) {
  const profileUrl =
    user.profileNumber && user.slug
      ? `/profiles/${user.profileNumber}/${user.slug}`
      : `/profile/${user.id}`;

  return {
    id: user.id,
    name: user.name,
    companyName: user.companyName,
    email: user.companyEmail || user.email,
    phone: user.phone || null,
    website: user.website || null,
    country: user.country,
    countryCode: user.countryCode,
    profileUrl,
  };
}