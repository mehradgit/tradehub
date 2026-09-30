// src/app/api/auth/complete-registration/route.js
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { getUserActivePlan } from "@/lib/planService";
import { generateNumber, generateSlug } from "@/utils/generate";

export async function POST(request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();
    const {
      email,
      name,
      companyName,
      country,
      businessType,
      phone,
      bio,
      address,
      city,
      postalCode,
      website,
      companyEmail,
      employeeCount,
      role,
      logo,
      coverImage,
      galleryImages,
      primaryCategory,
      primarySubCategory,
    } = body;

    // بررسی وجود کاربر
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // اگر قبلاً کامل شده، خطا بده
    if (user.registrationComplete === true) {
      return NextResponse.json({ message: "Registration already completed" }, { status: 400 });
    }

    // ====== دریافت پلن فعال کاربر ======
    const { plan } = await getUserActivePlan(userId);

    // ====== بررسی محدودیت تعداد عکس‌های پروفایل ======
    if (galleryImages && Array.isArray(galleryImages)) {
      if (plan.maxProfileImages !== -1 && galleryImages.length > plan.maxProfileImages) {
        return NextResponse.json(
          { message: `You can have a maximum of ${plan.maxProfileImages} profile images.` },
          { status: 403 },
        );
      }
    }

    // ====== به‌روزرسانی کاربر ======
    const updateData = {
      name,
      companyName,
      country,
      businessType: businessType || null,
      phone: phone || null,
      bio: bio || null,
      address: address || null,
      city: city || null,              // ← جدید
      postalCode: postalCode || null,
      website: website || null,
      companyEmail: companyEmail || null,
      employeeCount: employeeCount || null,
      role: role || "BUYER",
      registrationComplete: true,
      emailVerified: user.emailVerified || new Date(),
      galleryImages: galleryImages || [],
      primaryCategory: primaryCategory || null,
      primarySubCategory: primarySubCategory || null,
    };

    // تولید profileNumber و slug (اگر وجود ندارند)
    if (!user.profileNumber) {
      let profileNumber;
      let isUnique = false;
      while (!isUnique) {
        profileNumber = generateNumber();
        const existing = await prisma.user.findUnique({ where: { profileNumber } });
        if (!existing) isUnique = true;
      }
      updateData.profileNumber = profileNumber;
    }
    if (!user.slug) {
      updateData.slug = generateSlug(companyName || name || "user");
    }

    if (logo) {
      updateData.image = logo;
      updateData.logo = logo;
    }
    if (coverImage) {
      updateData.coverImage = coverImage;
    }

    const updatedUser = await prisma.user.update({
      where: { email },
      data: updateData,
    });

    return NextResponse.json({ message: "Registration completed successfully", user: updatedUser });
  } catch (error) {
    console.error("Complete registration error:", error);
    return NextResponse.json({ message: "Failed to complete registration" }, { status: 500 });
  }
}