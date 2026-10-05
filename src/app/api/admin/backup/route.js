// src/app/api/admin/backup/route.js
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { NextResponse } from "next/server";

const BACKUP_VERSION = "1.0";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // ============================================================
    // Fetch all of the database data
    // ============================================================
    const [
      users,
      accounts,
      sessions,
      verificationTokens,
      products,
      buyingRequests,
      productInquiries,
      messages,
      quotes,
      savedProducts,
      savedRequests,
      savedProfiles,
      revealedBuyerInfos,
      revealedSupplierInfos,
      tickets,
      ticketMessages,
      ticketAttachments,
      notifications,
      pushSubscriptions,
      plans,
      planPrices,
      userSubscriptions,
      usageCounters,
      payments,
      coupons,
      couponUsages,
      settings,
    ] = await Promise.all([
      prisma.user.findMany(),
      prisma.account.findMany(),
      prisma.session.findMany(),
      prisma.verificationToken.findMany(),
      prisma.product.findMany(),
      prisma.buyingRequest.findMany(),
      prisma.productInquiry.findMany(),
      prisma.message.findMany(),
      prisma.quote.findMany(),
      prisma.savedProduct.findMany(),
      prisma.savedRequest.findMany(),
      prisma.savedProfile.findMany(),
      prisma.revealedBuyerInfo.findMany(),
      prisma.revealedSupplierInfo.findMany(),
      prisma.ticket.findMany(),
      prisma.ticketMessage.findMany(),
      prisma.ticketAttachment.findMany(),
      prisma.notification.findMany(),
      prisma.pushSubscription.findMany(),
      prisma.plan.findMany(),
      prisma.planPrice.findMany(),
      prisma.userSubscription.findMany(),
      prisma.usageCounter.findMany(),
      prisma.payment.findMany(),
      prisma.coupon.findMany(),
      prisma.couponUsage.findMany(),
      prisma.setting.findMany(),
    ]);

    const backup = {
      meta: {
        version: BACKUP_VERSION,
        createdAt: new Date().toISOString(),
        createdBy: session.user.email,
        appName: "FoodTradeHub",
      },
      data: {
        users,
        accounts,
        sessions,
        verificationTokens,
        products,
        buyingRequests,
        productInquiries,
        messages,
        quotes,
        savedProducts,
        savedRequests,
        savedProfiles,
        revealedBuyerInfos,
        revealedSupplierInfos,
        tickets,
        ticketMessages,
        ticketAttachments,
        notifications,
        pushSubscriptions,
        plans,
        planPrices,
        userSubscriptions,
        usageCounters,
        payments,
        coupons,
        couponUsages,
        settings,
      },
      counts: {
        users: users.length,
        products: products.length,
        buyingRequests: buyingRequests.length,
        productInquiries: productInquiries.length,
        messages: messages.length,
        quotes: quotes.length,
        tickets: tickets.length,
        notifications: notifications.length,
        userSubscriptions: userSubscriptions.length,
        payments: payments.length,
        coupons: coupons.length,
      },
    };

    const filename = `foodtradehub-backup-${new Date()
      .toISOString()
      .replace(/[:.]/g, "-")
      .slice(0, 19)}.json`;

    return new NextResponse(JSON.stringify(backup, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Backup error:", error);
    return NextResponse.json(
      { message: "Failed to create backup: " + error.message },
      { status: 500 }
    );
  }
}