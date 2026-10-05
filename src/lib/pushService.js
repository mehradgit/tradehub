// src/lib/pushService.js
import webpush from "web-push";
import { prisma } from "@/lib/prisma";

// ====== Configure VAPID (once) ======
let vapidConfigured = false;

function configureVapid() {
  if (vapidConfigured) return true;

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:noreply@foodhub.com";

  if (!publicKey || !privateKey) {
    console.warn(
      "[PushService] VAPID keys not set. Web Push is disabled."
    );
    return false;
  }

  try {
    webpush.setVapidDetails(subject, publicKey, privateKey);
    vapidConfigured = true;
    return true;
  } catch (error) {
    console.error("[PushService] Failed to configure VAPID:", error);
    return false;
  }
}

// ====== Send Web Push to a single user ======
export async function sendWebPushToUser(userId, payload) {
  if (!configureVapid()) return { sent: 0, failed: 0 };

  try {
    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId },
    });

    if (subscriptions.length === 0) {
      return { sent: 0, failed: 0 };
    }

    const pushPayload = JSON.stringify({
      title: payload.title || "FoodHub",
      body: payload.body || "",
      url: payload.url || "/dashboard/notifications",
      icon: payload.icon || "/favicon.ico",
      notificationId: payload.notificationId || null,
    });

    let sent = 0;
    let failed = 0;

    for (const sub of subscriptions) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          },
          pushPayload
        );
        sent++;
      } catch (error) {
        failed++;
        // subscription is no longer valid → delete it
        if (error.statusCode === 410 || error.statusCode === 404) {
          await prisma.pushSubscription
            .delete({ where: { id: sub.id } })
            .catch(() => {});
        } else {
          console.error(
            `[PushService] Failed to send to ${sub.endpoint}:`,
            error.message
          );
        }
      }
    }

    return { sent, failed };
  } catch (error) {
    console.error("[PushService] sendWebPushToUser error:", error);
    return { sent: 0, failed: 0 };
  }
}

// ====== Send to multiple users ======
export async function sendWebPushToUsers(userIds, payload) {
  if (!userIds?.length) return { sent: 0, failed: 0 };

  let totalSent = 0;
  let totalFailed = 0;

  for (const userId of userIds) {
    const result = await sendWebPushToUser(userId, payload);
    totalSent += result.sent;
    totalFailed += result.failed;
  }

  return { sent: totalSent, failed: totalFailed };
}

// ====== Send to all admins ======
export async function sendWebPushToAllAdmins(payload) {
  try {
    const admins = await prisma.user.findMany({
      where: { isAdmin: true },
      select: { id: true },
    });

    return sendWebPushToUsers(
      admins.map((a) => a.id),
      payload
    );
  } catch (error) {
    console.error("[PushService] sendWebPushToAllAdmins error:", error);
    return { sent: 0, failed: 0 };
  }
}