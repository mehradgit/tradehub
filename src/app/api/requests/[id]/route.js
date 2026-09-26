// src/app/api/requests/[id]/route.js
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { NextResponse } from "next/server";

// ====== GET: دریافت یک درخواست (برای فرم ویرایش) ======
export async function GET(request, { params }) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const buyingRequest = await prisma.buyingRequest.findUnique({
      where: { id },
    });

    if (!buyingRequest) {
      return NextResponse.json(
        { message: "Request not found" },
        { status: 404 },
      );
    }

    // فقط مالک می‌تواند ببیند
    if (buyingRequest.userId !== session.user.id) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(buyingRequest);
  } catch (error) {
    console.error("Error fetching buying request:", error);
    return NextResponse.json(
      { message: "Failed to fetch request" },
      { status: 500 },
    );
  }
}

// ====== PUT: ویرایش کامل درخواست ======
export async function PUT(request, { params }) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
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
      // ✅ فیلدهای جدید
      paymentTerms,
      targetPrice,
      isPriceNegotiable,
      supplierCountries,
      // =================
      attachments,
      isUrgent,
      isVisible,
    } = body;

    const existing = await prisma.buyingRequest.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!existing) {
      return NextResponse.json(
        { message: "Request not found" },
        { status: 404 },
      );
    }

    if (existing.userId !== userId) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const updated = await prisma.buyingRequest.update({
      where: { id },
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
        // ✅ فیلدهای جدید
        paymentTerms: paymentTerms || null,
        targetPrice:
          isPriceNegotiable === false && targetPrice
            ? parseFloat(targetPrice)
            : null,
        isPriceNegotiable:
          isPriceNegotiable !== undefined ? isPriceNegotiable : true,
        supplierCountries: supplierCountries || ["WORLDWIDE"],
        // =================
        attachments: attachments || [],
        isUrgent: isUrgent !== undefined ? isUrgent : false,
        isVisible: isVisible !== undefined ? isVisible : true,
        // ✅ پس از ویرایش، وضعیت به PENDING برمیگردد تا ادمین دوباره تأیید کند
        status: "PENDING",
      },
    });

    return NextResponse.json(
      { message: "Request updated successfully", request: updated },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error updating buying request:", error);
    return NextResponse.json(
      { message: "Failed to update request", error: error.message },
      { status: 500 },
    );
  }
}

// ====== PATCH: به‌روزرسانی جزئی (فقط visibility) ======
export async function PATCH(request, { params }) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const userId = session.user.id;
    const body = await request.json();
    const { isVisible } = body;

    const existing = await prisma.buyingRequest.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!existing) {
      return NextResponse.json(
        { message: "Request not found" },
        { status: 404 },
      );
    }

    if (existing.userId !== userId) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const updated = await prisma.buyingRequest.update({
      where: { id },
      data: { isVisible },
    });

    return NextResponse.json(
      { message: "Request updated successfully", request: updated },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error updating request visibility:", error);
    return NextResponse.json(
      { message: "Failed to update request" },
      { status: 500 },
    );
  }
}

// ====== DELETE: حذف درخواست ======
export async function DELETE(request, { params }) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const userId = session.user.id;

    const existing = await prisma.buyingRequest.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!existing) {
      return NextResponse.json(
        { message: "Request not found" },
        { status: 404 },
      );
    }

    if (existing.userId !== userId) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    await prisma.buyingRequest.delete({ where: { id } });

    return NextResponse.json(
      { message: "Request deleted successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error deleting buying request:", error);
    return NextResponse.json(
      { message: "Failed to delete request" },
      { status: 500 },
    );
  }
}
