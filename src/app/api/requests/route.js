// src/app/api/requests/route.js
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { generateNumber, generateSlug } from "@/utils/generate";
import {
  canAddRequest,
  getUserActivePlan,
  incrementUsage,
} from "@/lib/planService";

export async function POST(request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // ✅ تعریف userId قبل از استفاده
    const userId = session.user.id;

    const { plan, subscription } = await getUserActivePlan(userId);

    // بررسی محدودیت ماهانه درخواست‌ها
    if (!(await canAddRequest(userId, plan, subscription))) {
      return NextResponse.json(
        {
          message:
            "You have reached your monthly request limit. Please upgrade.",
        },
        { status: 403 },
      );
    }

    const body = await request.json();
    const {
      title,
      category,
      subCategory,
       productType,
      description,
      quantity,
      unit,
      budgetRange,
      currency,
      deadline,
      shippingTerms,
      deliveryCountry,
      packagingReq,
      certifications,
      paymentTerms,
      targetPrice,
      isPriceNegotiable,
      supplierCountries,
      attachments,
      isUrgent,
      isVisible,
    } = body;

    const requestNumber = generateNumber();
    const slug = generateSlug(title);

    // اعتبارسنجی اولیه
    if (!title || !category || !description || !quantity || !deliveryCountry) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 },
      );
    }

    // دریافت کشور خریدار از session یا پیش‌فرض
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { country: true },
    });

    // ایجاد درخواست خرید
    const buyingRequest = await prisma.buyingRequest.create({
      data: {
        title,
        category,
        subCategory: subCategory || null,
        productType: productType || null,   
        description,
        quantity: parseInt(quantity),
        unit,
        budgetRange: budgetRange || null,
        currency: currency || "USD",
        deadline: deadline ? new Date(deadline) : null,
        shippingTerms: shippingTerms || null,
        deliveryCountry,
        packagingReq: packagingReq || null,
        certifications: certifications || null,
        paymentTerms: paymentTerms || null,
        targetPrice: targetPrice ? parseFloat(targetPrice) : null,
        isPriceNegotiable:
        isPriceNegotiable !== undefined ? isPriceNegotiable : true,
        supplierCountries: supplierCountries || ["WORLDWIDE"],
        attachments: attachments || [],
        isUrgent: isUrgent || false,
        isVisible: false, // ✅ تا تأیید نشده نمایش داده نشود
        status: "PENDING",
        buyerCountry: user?.country || null,
        userId,
        requestNumber,
        slug,
      },
    });

    // افزایش شمارنده مصرف
    await incrementUsage(userId, "request", subscription);

    return NextResponse.json(
      {
        message: "Buying request created successfully",
        id: buyingRequest.id,
        requestNumber: buyingRequest.requestNumber,
        slug: buyingRequest.slug,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating buying request:", error);
    return NextResponse.json(
      { message: "Failed to create buying request" },
      { status: 500 },
    );
  }
}
