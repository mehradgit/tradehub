// src/app/api/user/update-profile/route.js
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { getUserActivePlan } from "@/lib/planService";

export async function PUT(request) {
  try {
    const session = await auth();
    if (!session) {
      return new Response(JSON.stringify({ message: "Unauthorized" }), {
        status: 401,
      });
    }

    const userId = session.user.id;
    const body = await request.json();

    const {
      name,
      companyName,
      country,
      businessType,
      phone,
      bio,
      address,
      city,              // ← جدید
      postalCode,        // ← جدید
      website,
      companyEmail,
      employeeCount,
      logo,
      coverImage,
      primaryCategory,
      primarySubCategory,
      galleryImages, // آرایه‌ای از مسیرها (بعد از ترکیب عکس‌های موجود و جدید)
    } = body;

    // اعتبارسنجی اولیه
    if (!name || !companyName || !country) {
      return new Response(
        JSON.stringify({ message: "Required fields missing" }),
        { status: 400 },
      );
    }

    // ====== دریافت پلن فعال کاربر و بررسی محدودیت عکس‌ها ======
    const { plan } = await getUserActivePlan(userId);

    if (galleryImages && Array.isArray(galleryImages)) {
      // اگر maxProfileImages برابر -1 باشد یعنی نامحدود
      if (plan.maxProfileImages !== -1 && galleryImages.length > plan.maxProfileImages) {
        return new Response(
          JSON.stringify({
            message: `You can have a maximum of ${plan.maxProfileImages} profile images.`,
          }),
          { status: 403 },
        );
      }
    }

    // ====== آماده‌سازی داده‌ها ======
    const updateData = {
      name,
      companyName,
      country,
      businessType: businessType || null,
      phone: phone || null,
      bio: bio || null,
      address: address || null,
      city: city || null,              // ← جدید
      postalCode: postalCode || null,  // ← جدید
      website: website || null,
      companyEmail: companyEmail || null,
      employeeCount: employeeCount || null,
      primaryCategory: primaryCategory || null,
      primarySubCategory: primarySubCategory || null,
      galleryImages: galleryImages || [],
    };

    if (logo) {
      updateData.image = logo;
      updateData.logo = logo;
    }
    if (coverImage) {
      updateData.coverImage = coverImage;
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    return new Response(
      JSON.stringify({
        message: "Profile updated successfully",
        user: updatedUser,
      }),
      { status: 200 },
    );
  } catch (error) {
    console.error("Update profile error:", error);
    return new Response(
      JSON.stringify({ message: "Failed to update profile" }),
      { status: 500 },
    );
  }
}