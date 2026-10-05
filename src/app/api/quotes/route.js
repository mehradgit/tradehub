// src/app/api/quotes/route.js
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { NextResponse, after } from "next/server";
import { dispatchEvent } from "@/lib/eventService";

export async function POST(request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();
    const { requestId, quantity, offeredPrice, message } = body;

    if (!requestId || !message) {
      return NextResponse.json(
        { message: "Request ID and message are required" },
        { status: 400 },
      );
    }

    // Check that the request exists
    const buyingRequest = await prisma.buyingRequest.findUnique({
      where: { id: requestId },
      select: {
        id: true,
        title: true,
        userId: true,
        requestNumber: true,
        slug: true,
      },
    });

    if (!buyingRequest) {
      return NextResponse.json(
        { message: "Request not found" },
        { status: 404 },
      );
    }

    if (buyingRequest.userId === userId) {
      return NextResponse.json(
        { message: "You cannot quote your own request" },
        { status: 400 },
      );
    }

    // ✅ The buyer is the owner of the request — not the value the client sent in the body.
    //    Previously any user could pass an arbitrary buyerId and create
    //    notifications/messages for a third party and forge the deal record.
    const buyerId = buyingRequest.userId;

    // ✅ Check RevealedBuyerInfo (the quota is consumed at the Reveal step)
    const revealed = await prisma.revealedBuyerInfo.findUnique({
      where: {
        userId_requestId: { userId, requestId },
      },
    });

    if (!revealed) {
      // Admins are allowed (no Reveal required)
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { isAdmin: true },
      });

      if (!user?.isAdmin) {
        return NextResponse.json(
          {
            message: "Please reveal buyer info first",
            reason: "reveal_required",
          },
          { status: 403 },
        );
      }
    }

    // Create the Quote (without consuming quota)
    const quote = await prisma.quote.create({
      data: {
        requestId,
        supplierId: userId,
        buyerId,
        quantity: quantity ? parseInt(quantity) : null,
        offeredPrice: offeredPrice ? parseFloat(offeredPrice) : null,
        message,
      },
    });
    // ✅ Create a chat message for the buyer
    const baseUrl = (
      process.env.NEXTAUTH_URL || "http://localhost:3000"
    ).replace(/\/+$/, "");
    const requestLink = `${baseUrl}/requests/${buyingRequest.requestNumber}/${buyingRequest.slug}`;
    const messageContent = `📦 **New Quote for Request:** ${buyingRequest.title}\n🔗 ${requestLink}\n\n📝 **Message:** ${message}`;

    await prisma.message.create({
      data: {
        senderId: userId,
        receiverId: buyerId,
        requestId: requestId,
        content: messageContent,
      },
    });

    // ✅ Notification + Web Push + email through the central event dispatcher
    after(async () => {
      const result = await dispatchEvent("quote.submitted", {
        quoteId: quote.id,
      });
      if (result?.error) {
        console.error("[quote.submitted] dispatch error:", result.error);
      }
    });

    return NextResponse.json(
      { message: "Quote sent successfully", quote },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating quote:", error);
    return NextResponse.json(
      { message: "Failed to send quote", error: error.message },
      { status: 500 },
    );
  }
}
