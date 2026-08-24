// src/app/api/user/update-profile/route.js
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { NextResponse } from "next/server";

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
      countryCode,
      businessType,
      phone,
      bio,
      address,
      website,
      companyEmail,
      employeeCount,
      logo,
      coverImage,
      primaryCategory,      // ✅ اضافه شد
      primarySubCategory,   // ✅ اضافه شد
    } = body;

    // اعتبارسنجی
    if (!name || !companyName || !country) {
      return new Response(
        JSON.stringify({ message: "Required fields missing" }),
        { status: 400 },
      );
    }

    const updateData = {
      name,
      companyName,
      country,
      countryCode,
      businessType: businessType || null,
      phone: phone || null,
      bio: bio || null,
      address: address || null,
      website: website || null,
      companyEmail: companyEmail || null,
      employeeCount: employeeCount || null,
      primaryCategory: primaryCategory || null,      // ✅ ذخیره
      primarySubCategory: primarySubCategory || null, // ✅ ذخیره
    };

    // تصاویر
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