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
import { alertNewBuyingRequest } from "@/lib/adminAlerts";

export async function POST(request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // ✅ Define userId before using it
    const userId = session.user.id;

    const { plan, subscription } = await getUserActivePlan(userId);

    // Check the monthly request limit
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

    // Basic validation
    if (!title || !category || !description || !quantity || !deliveryCountry) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 },
      );
    }

    // Get the buyer country from the session, or fall back to the default
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, companyName: true, country: true },
    });

    // Create the buying request
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
        isVisible: false, // ✅ Do not display it until it is approved
        status: "PENDING",
        buyerCountry: user?.country || null,
        userId,
        requestNumber,
        slug,
      },
    });

    // Increment the usage counter
    await incrementUsage(userId, "request", subscription);

    // ====== اطلاع تلگرامی ادمین — درخواست خرید جدید ======
    // fire-and-forget — اگر تلگرام پایین باشد درخواست تأثیری نمی‌گیرد
    alertNewBuyingRequest(buyingRequest, user);

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
