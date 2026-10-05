// src/app/api/admin/restore/route.js
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { NextResponse } from "next/server";

// Convert date strings back to Date objects
function parseDates(obj) {
  if (obj === null || obj === undefined) return obj;

  if (Array.isArray(obj)) {
    return obj.map(parseDates);
  }

  if (typeof obj === "object") {
    // If it is not a Date object, check every key
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
      if (
        typeof value === "string" &&
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)
      ) {
        const d = new Date(value);
        result[key] = isNaN(d.getTime()) ? value : d;
      } else {
        result[key] = parseDates(value);
      }
    }
    return result;
  }

  return obj;
}

export async function POST(request) {
  try {
    const session = await auth();
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const currentAdminId = session.user.id;
    const body = await request.json();
    const { backup, mode = "replace" } = body;

    // ====== Structure validation ======
    if (!backup?.data || !backup?.meta) {
      return NextResponse.json(
        { message: "Invalid backup file structure" },
        { status: 400 }
      );
    }

    if (backup.meta.appName !== "FoodTradeHub") {
      return NextResponse.json(
        { message: "This backup file is not from FoodTradeHub" },
        { status: 400 }
      );
    }

    const d = parseDates(backup.data);

    // ====== Run the whole operation in a single transaction ======
    const result = await prisma.$transaction(
      async (tx) => {
        const counts = {};

        // -------- Step 1: Delete (when mode === "replace") --------
        if (mode === "replace") {
          // Coupon dependencies
          await tx.couponUsage.deleteMany({});
          await tx.payment.deleteMany({});
          await tx.coupon.deleteMany({});

          // Push and Notifications
          await tx.pushSubscription.deleteMany({});
          await tx.notification.deleteMany({});

          // Ticket chain
          await tx.ticketAttachment.deleteMany({});
          await tx.ticketMessage.deleteMany({});
          await tx.ticket.deleteMany({});

          // Revealed
          await tx.revealedBuyerInfo.deleteMany({});
          await tx.revealedSupplierInfo.deleteMany({});

          // Usage + Subscription
          await tx.usageCounter.deleteMany({});
          await tx.userSubscription.deleteMany({});

          // Quote / Message
          await tx.quote.deleteMany({});
          await tx.message.deleteMany({});

          // Saved
          await tx.savedProfile.deleteMany({});
          await tx.savedRequest.deleteMany({});
          await tx.savedProduct.deleteMany({});

          // Inquiry
          await tx.productInquiry.deleteMany({});

          // Request / Product
          await tx.buyingRequest.deleteMany({});
          await tx.product.deleteMany({});

          // Auth
          await tx.account.deleteMany({
            where: { userId: { not: currentAdminId } },
          });
          await tx.session.deleteMany({
            where: { userId: { not: currentAdminId } },
          });
          await tx.verificationToken.deleteMany({});

          // Users (except the current admin)
          await tx.user.deleteMany({
            where: { id: { not: currentAdminId } },
          });
        }

        // -------- Step 2: Insert plans and prices (upsert by name) --------
        const planIdMap = new Map(); // oldId -> newId

        for (const plan of d.plans || []) {
          const existing = await tx.plan.findUnique({
            where: { name: plan.name },
          });

          if (existing) {
            planIdMap.set(plan.id, existing.id);
          } else {
            const created = await tx.plan.create({
              data: {
                id: plan.id,
                name: plan.name,
                description: plan.description,
                isActive: plan.isActive,
                maxProducts: plan.maxProducts,
                maxImagesPerProduct: plan.maxImagesPerProduct,
                maxRequestsPerMonth: plan.maxRequestsPerMonth,
                maxImagesPerRequest: plan.maxImagesPerRequest,
                maxProfileImages: plan.maxProfileImages,
                maxInquiriesPerMonth: plan.maxInquiriesPerMonth,
                maxQuotesPerMonth: plan.maxQuotesPerMonth,
                createdAt: plan.createdAt,
                updatedAt: plan.updatedAt,
              },
            });
            planIdMap.set(plan.id, created.id);
          }
        }

        // PlanPrice
        for (const pp of d.planPrices || []) {
          const newPlanId = planIdMap.get(pp.planId);
          if (!newPlanId) continue;

          try {
            await tx.planPrice.upsert({
              where: {
                planId_duration: {
                  planId: newPlanId,
                  duration: pp.duration,
                },
              },
              update: { price: pp.price },
              create: {
                id: pp.id,
                planId: newPlanId,
                duration: pp.duration,
                price: pp.price,
              },
            });
          } catch (e) {
            // If the price already existed, skip it
          }
        }

        // -------- Step 3: Insert users --------
        counts.users = 0;
        for (const user of d.users || []) {
          // Do not touch the current admin
          if (user.id === currentAdminId) continue;

          try {
            await tx.user.create({
              data: {
                ...user,
                // JSON fields are inserted directly
                socialLinks: user.socialLinks || undefined,
                galleryImages: user.galleryImages || undefined,
              },
            });
            counts.users++;
          } catch (e) {
            console.error(`Failed to create user ${user.email}:`, e.message);
          }
        }

        // -------- Step 4: Account and Session --------
        counts.accounts = 0;
        for (const account of d.accounts || []) {
          if (account.userId === currentAdminId) continue;
          try {
            await tx.account.create({ data: account });
            counts.accounts++;
          } catch (e) {}
        }

        counts.sessions = 0;
        for (const sess of d.sessions || []) {
          if (sess.userId === currentAdminId) continue;
          try {
            await tx.session.create({ data: sess });
            counts.sessions++;
          } catch (e) {}
        }

        // -------- Step 5: Products --------
        counts.products = 0;
        for (const product of d.products || []) {
          try {
            await tx.product.create({
              data: {
                ...product,
                images: product.images || [],
              },
            });
            counts.products++;
          } catch (e) {
            console.error(`Failed to create product ${product.id}:`, e.message);
          }
        }

        // -------- Step 6: Buying Requests --------
        counts.buyingRequests = 0;
        for (const req of d.buyingRequests || []) {
          try {
            await tx.buyingRequest.create({
              data: {
                ...req,
                attachments: req.attachments || [],
                supplierCountries: req.supplierCountries || undefined,
              },
            });
            counts.buyingRequests++;
          } catch (e) {
            console.error(`Failed to create request ${req.id}:`, e.message);
          }
        }

        // -------- Step 7: Product Inquiries --------
        counts.productInquiries = 0;
        for (const inq of d.productInquiries || []) {
          try {
            await tx.productInquiry.create({ data: inq });
            counts.productInquiries++;
          } catch (e) {}
        }

        // -------- Step 8: Messages --------
        counts.messages = 0;
        for (const msg of d.messages || []) {
          try {
            await tx.message.create({ data: msg });
            counts.messages++;
          } catch (e) {}
        }

        // -------- Step 9: Quotes --------
        counts.quotes = 0;
        for (const q of d.quotes || []) {
          try {
            await tx.quote.create({ data: q });
            counts.quotes++;
          } catch (e) {}
        }

        // -------- Step 10: Saved items --------
        for (const s of d.savedProducts || []) {
          try {
            await tx.savedProduct.create({ data: s });
          } catch (e) {}
        }
        for (const s of d.savedRequests || []) {
          try {
            await tx.savedRequest.create({ data: s });
          } catch (e) {}
        }
        for (const s of d.savedProfiles || []) {
          try {
            await tx.savedProfile.create({ data: s });
          } catch (e) {}
        }

        // -------- Step 11: Revealed infos --------
        for (const r of d.revealedBuyerInfos || []) {
          try {
            await tx.revealedBuyerInfo.create({ data: r });
          } catch (e) {}
        }
        for (const r of d.revealedSupplierInfos || []) {
          try {
            await tx.revealedSupplierInfo.create({ data: r });
          } catch (e) {}
        }

        // -------- Step 12: Tickets --------
        counts.tickets = 0;
        for (const t of d.tickets || []) {
          try {
            await tx.ticket.create({ data: t });
            counts.tickets++;
          } catch (e) {}
        }
        for (const tm of d.ticketMessages || []) {
          try {
            await tx.ticketMessage.create({ data: tm });
          } catch (e) {}
        }
        for (const ta of d.ticketAttachments || []) {
          try {
            await tx.ticketAttachment.create({ data: ta });
          } catch (e) {}
        }

        // -------- Step 13: Notifications --------
        counts.notifications = 0;
        for (const n of d.notifications || []) {
          try {
            await tx.notification.create({ data: n });
            counts.notifications++;
          } catch (e) {}
        }

        // -------- Step 14: Push Subscriptions --------
        for (const p of d.pushSubscriptions || []) {
          try {
            await tx.pushSubscription.create({ data: p });
          } catch (e) {}
        }

        // -------- Step 15: Usage Counters + User Subscriptions --------
        for (const uc of d.usageCounters || []) {
          try {
            await tx.usageCounter.create({ data: uc });
          } catch (e) {}
        }

        counts.userSubscriptions = 0;
        for (const us of d.userSubscriptions || []) {
          try {
            const newPlanId = planIdMap.get(us.planId) || us.planId;
            await tx.userSubscription.create({
              data: { ...us, planId: newPlanId },
            });
            counts.userSubscriptions++;
          } catch (e) {}
        }

        // -------- Step 16: Coupons --------
        counts.coupons = 0;
        for (const c of d.coupons || []) {
          try {
            await tx.coupon.create({ data: c });
            counts.coupons++;
          } catch (e) {}
        }

        // -------- Step 17: Payments --------
        counts.payments = 0;
        for (const p of d.payments || []) {
          try {
            const newPlanId = planIdMap.get(p.planId) || p.planId;
            await tx.payment.create({
              data: { ...p, planId: newPlanId },
            });
            counts.payments++;
          } catch (e) {}
        }

        // -------- Step 18: Coupon Usages --------
        for (const cu of d.couponUsages || []) {
          try {
            await tx.couponUsage.create({ data: cu });
          } catch (e) {}
        }

        // -------- Step 19: Settings (upsert) --------
        for (const s of d.settings || []) {
          try {
            await tx.setting.upsert({
              where: { key: s.key },
              update: { value: s.value },
              create: { id: s.id, key: s.key, value: s.value },
            });
          } catch (e) {}
        }

        // -------- Step 20: Verification Tokens (after users) --------
        for (const v of d.verificationTokens || []) {
          try {
            await tx.verificationToken.create({ data: v });
          } catch (e) {}
        }

        return counts;
      },
      {
        timeout: 120000, // 2 minutes
        maxWait: 15000,
      }
    );

    return NextResponse.json({
      message: "Backup restored successfully.",
      counts: result,
    });
  } catch (error) {
    console.error("Restore error:", error);
    return NextResponse.json(
      { message: "Failed to restore backup: " + error.message },
      { status: 500 }
    );
  }
}
