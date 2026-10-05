// src/app/api/tickets/route.js
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import {
  generateTicketNumber,
  TICKET_CATEGORIES,
  TICKET_PRIORITIES,
  getCategoryLabel,
} from "@/utils/ticketHelpers";
import {
  sendNewTicketEmailToAdmin,
  truncateMessage,
} from "@/lib/email";

// ====== GET: List the user's tickets ======
export async function GET(request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "";
    const search = searchParams.get("search") || "";

    const where = { userId: session.user.id };
    if (status && status !== "all") where.status = status;
    if (search) {
      const num = parseInt(search);
      where.OR = [
        { subject: { contains: search } },
        ...(isNaN(num) ? [] : [{ ticketNumber: num }]),
      ];
    }

    const tickets = await prisma.ticket.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      include: {
        _count: { select: { messages: true } },
        assignedTo: {
          select: { id: true, name: true },
        },
      },
    });

    return NextResponse.json({ tickets });
  } catch (error) {
    console.error("Error fetching tickets:", error);
    return NextResponse.json(
      { message: "Failed to fetch tickets" },
      { status: 500 }
    );
  }
}

// ====== POST: Create a new ticket ======
export async function POST(request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();
    const {
      subject,
      category,
      priority = "medium",
      message,
      relatedProductId,
      relatedRequestId,
      attachments = [],
    } = body;

    // ====== Validation ======
    if (!subject?.trim() || !category || !message?.trim()) {
      return NextResponse.json(
        { message: "Subject, category, and message are required" },
        { status: 400 }
      );
    }

    const validCategories = TICKET_CATEGORIES.map((c) => c.value);
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { message: "Invalid category" },
        { status: 400 }
      );
    }

    const validPriorities = TICKET_PRIORITIES.map((p) => p.value);
    const finalPriority = validPriorities.includes(priority)
      ? priority
      : "medium";

    // ====== Resolve relatedProductId (number → id) ======
    let resolvedProductId = null;
    if (relatedProductId?.trim()) {
      const num = parseInt(relatedProductId);
      if (!isNaN(num)) {
        const product = await prisma.product.findUnique({
          where: { productNumber: num },
          select: { id: true },
        });
        resolvedProductId = product?.id || null;
      }
    }

    // ====== Resolve relatedRequestId (number → id) ======
    let resolvedRequestId = null;
    if (relatedRequestId?.trim()) {
      const num = parseInt(relatedRequestId);
      if (!isNaN(num)) {
        const req = await prisma.buyingRequest.findUnique({
          where: { requestNumber: num },
          select: { id: true },
        });
        resolvedRequestId = req?.id || null;
      }
    }

    // ====== Generate the ticket number ======
    const ticketNumber = await generateTicketNumber(prisma);

    // ====== Create the ticket + first message ======
    const ticket = await prisma.ticket.create({
      data: {
        ticketNumber,
        subject: subject.trim(),
        category,
        priority: finalPriority,
        status: "open",
        userId,
        relatedProductId: resolvedProductId,
        relatedRequestId: resolvedRequestId,
        lastReplyAt: new Date(),
        lastReplyById: userId,
        unreadByAdmin: true,
        unreadByUser: false,
        messages: {
          create: {
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
        },
      },
      include: {
        messages: {
          include: { attachments: true },
        },
      },
    });

    // ====== Send email to admins (background) ======
    (async () => {
      try {
        const admins = await prisma.user.findMany({
          where: { isAdmin: true },
          select: { email: true },
        });

        const userName =
          session.user.name || session.user.email || "User";

        for (const admin of admins) {
          if (!admin.email) continue;
          await sendNewTicketEmailToAdmin({
            adminEmail: admin.email,
            ticketNumber: ticket.ticketNumber,
            ticketSubject: ticket.subject,
            category: getCategoryLabel(category),
            priority: finalPriority,
            userName,
            messagePreview: truncateMessage(message, 200),
          });
        }
      } catch (err) {
        console.error("Failed to send admin notification emails:", err);
      }
    })();

    return NextResponse.json(
      {
        message: "Ticket created successfully",
        ticket: {
          id: ticket.id,
          ticketNumber: ticket.ticketNumber,
          subject: ticket.subject,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating ticket:", error);
    return NextResponse.json(
      { message: "Failed to create ticket" },
      { status: 500 }
    );
  }
}