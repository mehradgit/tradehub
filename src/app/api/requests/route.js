// src/app/api/requests/route.js
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const body = await request.json();

    const {
      title,
      category,
      subCategory,
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
      attachments,
      isUrgent,
      isVisible,
    } = body;

    // اعتبارسنجی اولیه
    if (!title || !category || !description || !quantity || !deliveryCountry) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
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
        attachments: attachments || [],
        isUrgent: isUrgent || false,
        isVisible: isVisible !== undefined ? isVisible : true,
        buyerCountry: user?.country || null,
        userId,
      },
    });

    return NextResponse.json(
      { message: "Buying request created successfully", id: buyingRequest.id },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating buying request:", error);
    return NextResponse.json(
      { message: "Failed to create buying request" },
      { status: 500 }
    );
  }
}