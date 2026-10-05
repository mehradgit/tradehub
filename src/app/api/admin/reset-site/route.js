// src/app/api/admin/reset-site/route.js
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

// ============================================================
// GET: stats for what is about to be deleted
// ============================================================
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const [
      users,
      products,
      requests,
      inquiries,
      messages,
      quotes,
      savedProducts,
      savedRequests,
      savedProfiles,
      tickets,
      ticketMessages,
      notifications,
      subscriptions,
      payments,
      coupons,
      couponUsages,
      pushSubscriptions,
      accounts,
      sessions,
      verificationTokens,
      revealedBuyerInfos,
      revealedSupplierInfos,
      usageCounters,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.product.count(),
      prisma.buyingRequest.count(),
      prisma.productInquiry.count(),
      prisma.message.count(),
      prisma.quote.count(),
      prisma.savedProduct.count(),
      prisma.savedRequest.count(),
      prisma.savedProfile.count(),
      prisma.ticket.count(),
      prisma.ticketMessage.count(),
      prisma.notification.count(),
      prisma.userSubscription.count(),
      prisma.payment.count(),
      prisma.coupon.count(),
      prisma.couponUsage.count(),
      prisma.pushSubscription.count(),
      prisma.account.count(),
      prisma.session.count(),
      prisma.verificationToken.count(),
      prisma.revealedBuyerInfo.count(),
      prisma.revealedSupplierInfo.count(),
      prisma.usageCounter.count(),
    ]);

    // Stats for the uploaded files
    let uploadStats = { requests: 0, products: 0, profiles: 0, tickets: 0 };
    const uploadRoot = path.join(process.cwd(), "public", "uploads");
    try {
      const dirs = ["requests", "products", "profiles", "tickets"];
      for (const dir of dirs) {
        const dirPath = path.join(uploadRoot, dir);
        try {
          const files = await fs.readdir(dirPath);
          uploadStats[dir] = files.length;
        } catch {
          uploadStats[dir] = 0;
        }
      }
    } catch {
      // ignore
    }

    const totalUploads = Object.values(uploadStats).reduce((a, b) => a + b, 0);

    return NextResponse.json({
      database: {
        users,
        products,
        requests,
        inquiries,
        messages,
        quotes,
        savedProducts,
        savedRequests,
        savedProfiles,
        tickets,
        ticketMessages,
        notifications,
        subscriptions,
        payments,
        coupons,
        couponUsages,
        pushSubscriptions,
        accounts,
        sessions,
        verificationTokens,
        revealedBuyerInfos,
        revealedSupplierInfos,
        usageCounters,
      },
      uploads: {
        ...uploadStats,
        total: totalUploads,
      },
    });
  } catch (error) {
    console.error("Reset site stats error:", error);
    return NextResponse.json(
      { message: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}

// ============================================================
// POST: perform the reset
// ============================================================
export async function POST(request) {
  try {
    const session = await auth();
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const currentAdminId = session.user.id;
    const body = await request.json();
    const { confirmation } = body;

    // Strong confirmation check
    if (confirmation !== "RESET") {
      return NextResponse.json(
        {
          message:
            'To confirm this action, please type "RESET" exactly in the confirmation field.',
        },
        { status: 400 }
      );
    }

    // ============================================================
    // Step 1: clear the database (ordered to respect foreign keys)
    // ============================================================
    const results = await prisma.$transaction(async (tx) => {
      const counts = {};

      // Coupon dependencies
      counts.couponUsages = (await tx.couponUsage.deleteMany({})).count;

      // Payments
      counts.payments = (await tx.payment.deleteMany({})).count;

      // Coupons (after payments)
      counts.coupons = (await tx.coupon.deleteMany({})).count;

      // Push
      counts.pushSubscriptions = (
        await tx.pushSubscription.deleteMany({})
      ).count;

      // Notification
      counts.notifications = (await tx.notification.deleteMany({})).count;

      // Ticket chain
      counts.ticketAttachments = (
        await tx.ticketAttachment.deleteMany({})
      ).count;
      counts.ticketMessages = (await tx.ticketMessage.deleteMany({})).count;
      counts.tickets = (await tx.ticket.deleteMany({})).count;

      // Revealed infos
      counts.revealedBuyerInfos = (
        await tx.revealedBuyerInfo.deleteMany({})
      ).count;
      counts.revealedSupplierInfos = (
        await tx.revealedSupplierInfo.deleteMany({})
      ).count;

      // Usage + Subscription
      counts.usageCounters = (await tx.usageCounter.deleteMany({})).count;
      counts.subscriptions = (
        await tx.userSubscription.deleteMany({})
      ).count;

      // Quotes
      counts.quotes = (await tx.quote.deleteMany({})).count;

      // Messages
      counts.messages = (await tx.message.deleteMany({})).count;

      // Saved items
      counts.savedProfiles = (await tx.savedProfile.deleteMany({})).count;
      counts.savedRequests = (await tx.savedRequest.deleteMany({})).count;
      counts.savedProducts = (await tx.savedProduct.deleteMany({})).count;

      // Product inquiries
      counts.inquiries = (await tx.productInquiry.deleteMany({})).count;

      // Buying requests (after quotes, messages and inquiries)
      counts.requests = (await tx.buyingRequest.deleteMany({})).count;

      // Products
      counts.products = (await tx.product.deleteMany({})).count;

      // Account + Session + VerificationToken for everyone except the current admin
      counts.accounts = (
        await tx.account.deleteMany({
          where: { userId: { not: currentAdminId } },
        })
      ).count;

      counts.sessions = (
        await tx.session.deleteMany({
          where: { userId: { not: currentAdminId } },
        })
      ).count;

      counts.verificationTokens = (
        await tx.verificationToken.deleteMany({})
      ).count;

      // Users (except the current admin)
      counts.users = (
        await tx.user.deleteMany({
          where: { id: { not: currentAdminId } },
        })
      ).count;

      return counts;
    });

    // ============================================================
    // Step 2: delete the uploaded files
    // ============================================================
    const uploadResult = {
      deletedFiles: 0,
      deletedFolders: [],
      errors: [],
    };

    const uploadRoot = path.join(process.cwd(), "public", "uploads");
    const foldersToClear = ["requests", "products", "profiles", "tickets"];

    for (const folder of foldersToClear) {
      const folderPath = path.join(uploadRoot, folder);
      try {
        await fs.access(folderPath);

        const files = await fs.readdir(folderPath);
        let deleted = 0;

        for (const file of files) {
          const filePath = path.join(folderPath, file);
          try {
            const stat = await fs.stat(filePath);
            if (stat.isFile()) {
              await fs.unlink(filePath);
              deleted++;
            }
          } catch (err) {
            uploadResult.errors.push(`Failed to delete ${file}: ${err.message}`);
          }
        }

        uploadResult.deletedFiles += deleted;
        uploadResult.deletedFolders.push({ folder, deleted });
      } catch {
        // The folder does not exist - that is fine
      }
    }

    // ============================================================
    // Result
    // ============================================================
    return NextResponse.json({
      message: "Site data has been reset successfully.",
      database: results,
      uploads: uploadResult,
    });
  } catch (error) {
    console.error("Reset site error:", error);
    return NextResponse.json(
      { message: "Failed to reset site: " + error.message },
      { status: 500 }
    );
  }
}
