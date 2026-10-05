// src/app/api/tickets/[id]/messages/route.js
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { NextResponse, after } from "next/server";
import { dispatchEvent } from "@/lib/eventService";

export async function POST(request, { params }) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const userId = session.user.id;
    const body = await request.json();
    const { message, attachments = [] } = body;

    if (!message?.trim()) {
      return NextResponse.json(
        { message: "Message is required" },
        { status: 400 },
      );
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        status: true,
        ticketNumber: true,
        subject: true,
      },
    });

    if (!ticket) {
      return NextResponse.json(
        { message: "Ticket not found" },
        { status: 404 },
      );
    }

    if (ticket.userId !== userId) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    if (ticket.status === "closed") {
      return NextResponse.json(
        { message: "Cannot reply to a closed ticket" },
        { status: 400 },
      );
    }

    const newMessage = await prisma.ticketMessage.create({
      data: {
        ticketId: id,
        senderId: userId,
        message: message.trim(),
        isInternal: false,
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

    await prisma.ticket.update({
      where: { id },
      data: {
        lastReplyAt: new Date(),
        lastReplyById: userId,
        unreadByAdmin: true,
        unreadByUser: false,
        status: ticket.status === "resolved" ? "open" : ticket.status,
      },
    });
    // ✅ Notification + Web Push + email for all admins
    //    through the central event pipeline (previously a detached email
    //    loop with no retry lived here and could be left half-finished).
    after(async () => {
      const result = await dispatchEvent("ticket.replied", {
        ticketId: ticket.id,
        messageId: newMessage.id,
        byAdmin: false,
      });
      if (result?.error) {
        console.error("[ticket.replied] dispatch error:", result.error);
      }
    });

    return NextResponse.json(
      { message: "Reply sent successfully", data: newMessage },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error posting message:", error);
    return NextResponse.json(
      { message: "Failed to post message" },
      { status: 500 },
    );
  }
}
