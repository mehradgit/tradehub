// src/app/api/admin/tickets/[id]/route.js
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { NextResponse } from "next/server";

// ====== GET: Full ticket details (with internal notes) ======
export async function GET(request, { params }) {
  try {
    const session = await auth();
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            companyName: true,
            country: true,
            countryCode: true,
            image: true,
            plan: true,
          },
        },
        assignedTo: {
          select: { id: true, name: true, email: true },
        },
        messages: {
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

    // Mark unread by admin = false
    if (ticket.unreadByAdmin) {
      await prisma.ticket.update({
        where: { id },
        data: { unreadByAdmin: false },
      });
    }

    // Related product/request
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

    // Admins list (for assignment)
    const admins = await prisma.user.findMany({
      where: { isAdmin: true },
      select: { id: true, name: true, email: true },
    });

    return NextResponse.json({
      ticket,
      relatedProduct,
      relatedRequest,
      admins,
    });
  } catch (error) {
    console.error("Admin ticket detail error:", error);
    return NextResponse.json(
      { message: "Failed to fetch ticket" },
      { status: 500 }
    );
  }
}

// ====== PATCH: Change status, priority, assignment ======
export async function PATCH(request, { params }) {
  try {
    const session = await auth();
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status, priority, assignedToId } = body;

    const ticket = await prisma.ticket.findUnique({
      where: { id },
      select: { id: true, status: true },
    });

    if (!ticket) {
      return NextResponse.json(
        { message: "Ticket not found" },
        { status: 404 }
      );
    }

    const updateData = {};
    if (status) {
      updateData.status = status;
      if (status === "closed") {
        updateData.closedAt = new Date();
      } else if (ticket.status === "closed") {
        updateData.closedAt = null;
      }
    }
    if (priority) updateData.priority = priority;
    if (assignedToId !== undefined) {
      updateData.assignedToId = assignedToId || null;
    }

    const updated = await prisma.ticket.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      message: "Ticket updated successfully",
      ticket: updated,
    });
  } catch (error) {
    console.error("Admin ticket update error:", error);
    return NextResponse.json(
      { message: "Failed to update ticket" },
      { status: 500 }
    );
  }
}