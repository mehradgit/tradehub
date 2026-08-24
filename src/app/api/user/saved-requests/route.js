import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { NextResponse } from "next/server";

// ====== GET: بررسی وضعیت ذخیره یا لیست درخواست‌های ذخیره‌شده ======
export async function GET(request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const requestId = searchParams.get("requestId");

    if (requestId) {
      // بررسی وضعیت ذخیره برای یک درخواست خاص
      const saved = await prisma.savedRequest.findUnique({
        where: {
          userId_requestId: {
            userId: session.user.id,
            requestId: requestId,
          },
        },
      });
      return NextResponse.json({ isSaved: !!saved });
    }

    // دریافت تمام درخواست‌های ذخیره‌شده کاربر
    const savedRequests = await prisma.savedRequest.findMany({
      where: { userId: session.user.id },
      include: {
        request: {
          select: {
            id: true,
            title: true,
            description: true,
            isUrgent: true,
            deliveryCountry: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ savedRequests });
  } catch (error) {
    console.error("Error fetching saved requests:", error);
    return NextResponse.json(
      { message: "Failed to fetch saved requests" },
      { status: 500 }
    );
  }
}

// ====== POST: Toggle ذخیره/حذف درخواست ======
export async function POST(request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { requestId } = await request.json();

    if (!requestId) {
      return NextResponse.json(
        { message: "Request ID is required" },
        { status: 400 }
      );
    }

    // بررسی وجود درخواست
    const req = await prisma.buyingRequest.findUnique({
      where: { id: requestId },
      select: { id: true },
    });

    if (!req) {
      return NextResponse.json(
        { message: "Request not found" },
        { status: 404 }
      );
    }

    // بررسی وجود رکورد ذخیره‌شده
    const existing = await prisma.savedRequest.findUnique({
      where: {
        userId_requestId: {
          userId: session.user.id,
          requestId: requestId,
        },
      },
    });

    let action, message;

    if (existing) {
      // حذف از ذخیره‌شده‌ها
      await prisma.savedRequest.delete({
        where: {
          userId_requestId: {
            userId: session.user.id,
            requestId: requestId,
          },
        },
      });
      action = "unsaved";
      message = "Request removed from saved";
    } else {
      // ذخیره درخواست
      await prisma.savedRequest.create({
        data: {
          userId: session.user.id,
          requestId: requestId,
        },
      });
      action = "saved";
      message = "Request saved successfully";
    }

    return NextResponse.json(
      {
        message,
        action,
        isSaved: action === "saved",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error managing saved request:", error);
    return NextResponse.json(
      { message: "Failed to manage saved request" },
      { status: 500 }
    );
  }
}