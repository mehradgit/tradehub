// src/app/api/user/profile/route.js
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        coverImage: true,
        logo: true,
        bio: true,
        employeeCount: true,
        address: true,
        phone: true,
        website: true,
        companyEmail: true,
        socialLinks: true,
        companyName: true,
        country: true,
        countryCode: true,
        businessType: true,
        plan: true,
        role: true,
        createdAt: true,
        registrationComplete: true,
        emailVerified: true,
        primaryCategory: true,      // ✅ اضافه شد
        primarySubCategory: true,   // ✅ اضافه شد
      },
    });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Profile API error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}