import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function PUT(request, { params }) {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { planId } = await params;

  const body = await request.json();
  const {
    name,
    description,
    maxProducts,
    maxImagesPerProduct,
    maxRequestsPerMonth,
    maxImagesPerRequest,
    maxProfileImages,
    maxInquiriesPerMonth,
    maxQuotesPerMonth,
    isActive,
  } = body;

  // تبدیل مقادیر رشته‌ای به عدد (در صورت وجود)
  const toInt = (value) => {
    if (value === null || value === undefined || value === "") return undefined;
    const num = parseInt(value, 10);
    return isNaN(num) ? undefined : num;
  };

  try {
    const updated = await prisma.plan.update({
      where: { id: planId },
      data: {
        name,
        description,
        maxProducts: toInt(maxProducts),
        maxImagesPerProduct: toInt(maxImagesPerProduct),
        maxRequestsPerMonth: toInt(maxRequestsPerMonth),
        maxImagesPerRequest: toInt(maxImagesPerRequest),
        maxProfileImages: toInt(maxProfileImages),
        maxInquiriesPerMonth: toInt(maxInquiriesPerMonth),
        maxQuotesPerMonth: toInt(maxQuotesPerMonth),
        isActive: Boolean(isActive),
      },
    });
    return NextResponse.json(updated);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Failed to update plan" }, { status: 500 });
  }
}