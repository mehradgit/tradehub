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
      city,              // ← new
      postalCode,        // ← new
      website,
      companyEmail,
      employeeCount,
      logo,
      coverImage,
      primaryCategory,
      primarySubCategory,
      galleryImages, // array of paths (after merging existing and new images)
    } = body;

    // Basic validation
    if (!name || !companyName || !country) {
      return new Response(
        JSON.stringify({ message: "Required fields missing" }),
        { status: 400 },
      );
    }

    // ====== Fetch the user's active plan and check the image limit ======
    const { plan } = await getUserActivePlan(userId);

    if (galleryImages && Array.isArray(galleryImages)) {
      // A maxProfileImages value of -1 means unlimited
      if (plan.maxProfileImages !== -1 && galleryImages.length > plan.maxProfileImages) {
        return new Response(
          JSON.stringify({
            message: `You can have a maximum of ${plan.maxProfileImages} profile images.`,
          }),
          { status: 403 },
        );
      }
    }

    // ====== Prepare the data ======
    const updateData = {
      name,
      companyName,
      country,
      businessType: businessType || null,
      phone: phone || null,
      bio: bio || null,
      address: address || null,
      city: city || null,              // ← new
      postalCode: postalCode || null,  // ← new
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