// src/app/api/tickets/[id]/route.js
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { NextResponse } from "next/server";

// ====== GET: جزئیات تیکت + پیام‌ها ======
export async function GET(request, { params }) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const userId = session.user.id;

    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            companyName: true,
            image: true,
          },
        },
        assignedTo: {
          select: { id: true, name: true, email: true },
        },
        messages: {
          where: {
            // کاربر عادی پیام‌های internal را نمی‌بیند
            OR: [{ isInternal: false }],
          },
          orderBy: { createdAt: "asc" },
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                companyName: true,
                image: true,
                isAdmin: true,
              },
            },
            attachments: true,
          },
        },
      },
    });

    if (!ticket) {
      return NextResponse.json(
        { message: "Ticket not found" },
        { status: 404 }
      );
    }

    // بررسی دسترسی: فقط صاحب تیکت یا ادمین
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { isAdmin: true },
    });

    if (ticket.userId !== userId && !currentUser?.isAdmin) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    // اگر کاربر عادی دید، unreadByUser = false
    if (ticket.userId === userId && ticket.unreadByUser) {
      await prisma.ticket.update({
        where: { id },
        data: { unreadByUser: false },
      });
    }

    // اطلاعات مربوط به product/request
    let relatedProduct = null;
    let relatedRequest = null;
    if (ticket.relatedProductId) {
      relatedProduct = await prisma.product.findUnique({
        where: { id: ticket.relatedProductId },
        select: { id: true, name: true, productNumber: true, slug: true },
      });
    }
    if (ticket.relatedRequestId) {
      relatedRequest = await prisma.buyingRequest.findUnique({
        where: { id: ticket.relatedRequestId },
        select: { id: true, title: true, requestNumber: true, slug: true },
      });
    }

    return NextResponse.json({
      ticket,
      relatedProduct,
      relatedRequest,
    });
  } catch (error) {
    console.error("Error fetching ticket:", error);
    return NextResponse.json(
      { message: "Failed to fetch ticket" },
      { status: 500 }
    );
  }
}

// ====== PATCH: تغییر وضعیت (بستن/بازکردن توسط کاربر) ======
export async function PATCH(request, { params }) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const userId = session.user.id;
    const body = await request.json();
    const { status } = body;

    const ticket = await prisma.ticket.findUnique({
      where: { id },
      select: { userId: true, status: true },
    });

    if (!ticket) {
      return NextResponse.json(
        { message: "Ticket not found" },
        { status: 404 }
      );
    }

    // فقط صاحب تیکت می‌تواند ببندد/باز کند
    if (ticket.userId !== userId) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    // کاربر فقط می‌تواند به closed یا open برگرداند
    if (!["closed", "open"].includes(status)) {
      return NextResponse.json(
        { message: "Invalid status for user action" },
        { status: 400 }
      );
    }

    const updated = await prisma.ticket.update({
      where: { id },
      data: {
        status,
        closedAt: status === "closed" ? new Date() : null,
      },
    });

    return NextResponse.json({
      message: `Ticket ${status === "closed" ? "closed" : "reopened"} successfully`,
      ticket: updated,
    });
  } catch (error) {
    console.error("Error updating ticket:", error);
    return NextResponse.json(
      { message: "Failed to update ticket" },
      { status: 500 }
    );
  }
}