// src/app/api/auth/complete-registration/route.js
import { prisma } from "@/lib/prisma";
import { generateNumber, generateSlug } from "@/utils/generate";

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      email,
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
      role,
      logo,
      coverImage,
      galleryImages,
    } = body;

    // ====== اعتبارسنجی فیلدهای اجباری ======
    if (!email || !name || !companyName || !country) {
      return new Response(
        JSON.stringify({ message: "Required fields missing" }),
        { status: 400 },
      );
    }

    // ====== پیدا کردن کاربر ======
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return new Response(JSON.stringify({ message: "User not found" }), {
        status: 404,
      });
    }

    // ====== اگر کاربر قبلاً ثبت‌نام کامل کرده ======
    if (user.registrationComplete === true) {
      return new Response(
        JSON.stringify({ message: "Registration already completed" }),
        { status: 400 },
      );
    }

    // ====== آماده‌سازی داده‌های به‌روزرسانی ======
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
      role: role || "BUYER",
      registrationComplete: true,
      emailVerified: user.emailVerified || new Date(),
      galleryImages: galleryImages || [], 
    };

    // ====== تولید profileNumber در صورت عدم وجود ======
    if (!user.profileNumber) {
      let profileNumber;
      let isUnique = false;
      while (!isUnique) {
        profileNumber = generateNumber();
        const existing = await prisma.user.findUnique({
          where: { profileNumber },
        });
        if (!existing) isUnique = true;
      }
      updateData.profileNumber = profileNumber;
    }

    // ====== به‌روزرسانی اسلاگ به نام شرکت (همیشه) ======
    updateData.slug = generateSlug(companyName || name || "user");

    // ====== ذخیره مسیر تصاویر (در صورت وجود) ======
    if (logo) {
      updateData.image = logo;
      updateData.logo = logo;
    }
    if (coverImage) {
      updateData.coverImage = coverImage;
    }

    // ====== به‌روزرسانی کاربر ======
    const updatedUser = await prisma.user.update({
      where: { email },
      data: updateData,
    });

    // ====== حذف رمز عبور از پاسخ ======
    const { password, ...userWithoutPassword } = updatedUser;

    return new Response(
      JSON.stringify({
        message: "Registration completed successfully",
        user: userWithoutPassword,
      }),
      { status: 200 },
    );
  } catch (error) {
    console.error("Complete registration error:", error);
    return new Response(
      JSON.stringify({
        message: "Failed to complete registration",
        error: error.message,
      }),
      { status: 500 },
    );
  }
}