// src/app/api/admin/tickets/[id]/messages/route.js
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { NextResponse, after } from "next/server";
import { dispatchEvent } from "@/lib/eventService";
export async function POST(request, { params }) {
  try {
    const session = await auth();
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const adminId = session.user.id;
    const body = await request.json();
    const { message, isInternal = false, attachments = [] } = body;

    if (!message?.trim()) {
      return NextResponse.json(
        { message: "Message is required" },
        { status: 400 },
      );
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, email: true, name: true, companyName: true },
        },
      },
    });

    if (!ticket) {
      return NextResponse.json(
        { message: "Ticket not found" },
        { status: 404 },
      );
    }

    // ایجاد پیام
    const newMessage = await prisma.ticketMessage.create({
      data: {
        ticketId: id,
        senderId: adminId,
        message: message.trim(),
        isInternal,
        attachments:
          attachments.length > 0
            ? {
                create: attachments.map((att) => ({
                  fileName: att.fileName,
                  filePath: att.filePath,
                  fileSize: att.fileSize || 0,
                  fileType: att.fileType || "unknown",
                })),
              }
            : undefined,
      },
    });

    // اگر پیام public است، وضعیت و unread را به‌روز کن
    if (!isInternal) {
      const updateData = {
        lastReplyAt: new Date(),
        lastReplyById: adminId,
        unreadByUser: true,
        unreadByAdmin: false,
      };

      // اگر open بود، برو به in_progress
      if (ticket.status === "open") {
        updateData.status = "in_progress";
      }

      await prisma.ticket.update({
        where: { id },
        data: updateData,
      });
      // ✅ نوتیفیکیشن + Web Push + ایمیل برای صاحب تیکت.
      //    این بلوک داخل گاردِ !isInternal است، پس یادداشت داخلی
      //    هرگز به کاربر اطلاع داده نمی‌شود.
      after(async () => {
        const result = await dispatchEvent("ticket.replied", {
          ticketId: ticket.id,
          messageId: newMessage.id,
          byAdmin: true,
        });
        if (result?.error) {
          console.error("[ticket.replied] dispatch error:", result.error);
        }
      });
    }

    return NextResponse.json(
      { message: "Reply posted successfully", data: newMessage },
      { status: 201 },
    );
  } catch (error) {
    console.error("Admin reply error:", error);
    return NextResponse.json(
      { message: "Failed to post reply" },
      { status: 500 },
    );
  }
}
