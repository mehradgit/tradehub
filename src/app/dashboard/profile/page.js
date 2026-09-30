// src/app/dashboard/profile/page.js
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import ProfileClient from "@/components/dashboard/ProfileClient";

export const metadata = { title: "Company Profile | Dashboard" };

export default async function ProfilePage() {
  const session = await auth();
  if (!session) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      emailVerified: true,
      image: true,
      logo: true,
      coverImage: true,
      galleryImages: true,
      companyName: true,
      companyEmail: true,
      country: true,
      countryCode: true,
      city: true,
      postalCode: true,
      address: true,
      businessType: true,
      phone: true,
      website: true,
      employeeCount: true,
      bio: true,
      socialLinks: true,
      role: true,
      plan: true,
      primaryCategory: true,
      primarySubCategory: true,
      profileNumber: true,
      slug: true,
      registrationComplete: true,
      createdAt: true,
    },
  });

  if (!user) redirect("/dashboard");

  // ===== Serialize =====
  const serialized = {
    id: user.id,
    name: user.name,
    email: user.email,
    emailVerified: !!user.emailVerified,
    image: user.image,
    logo: user.logo,
    coverImage: user.coverImage,
    galleryImages: Array.isArray(user.galleryImages) ? user.galleryImages : [],
    companyName: user.companyName,
    companyEmail: user.companyEmail,
    country: user.country,
    countryCode: user.countryCode,
    city: user.city,
    postalCode: user.postalCode,
    address: user.address,
    businessType: user.businessType,
    phone: user.phone,
    website: user.website,
    employeeCount: user.employeeCount,
    bio: user.bio,
    socialLinks:
      user.socialLinks && typeof user.socialLinks === "object"
        ? user.socialLinks
        : {},
    role: user.role,
    plan: user.plan,
    primaryCategory: user.primaryCategory,
    primarySubCategory: user.primarySubCategory,
    profileNumber: user.profileNumber,
    slug: user.slug,
    registrationComplete: user.registrationComplete,
    createdAt: user.createdAt.toISOString(),
  };

  return <ProfileClient user={serialized} />;
}