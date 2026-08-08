// src/app/api/user/profile/route.js
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const session = await auth();
    if (!session) {
      return new Response(JSON.stringify({ message: "Unauthorized" }), {
        status: 401,
      });
    }

    const userId = session.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
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
      },
    });
    console.log("User image fields:", {
      image: user.image?.slice(0, 50),
      logo: user.logo?.slice(0, 50),
      coverImage: user.coverImage?.slice(0, 50),
    });
    if (!user) {
      return new Response(JSON.stringify({ message: "User not found" }), {
        status: 404,
      });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error fetching profile:", error);
    return new Response(
      JSON.stringify({ message: "Failed to fetch profile" }),
      { status: 500 },
    );
  }
}
