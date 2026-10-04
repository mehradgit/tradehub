// src/lib/notificationService.js
import { prisma } from "@/lib/prisma";
import { sendWebPushToUser } from "./pushService";
// ====== انواع نوتیفیکیشن ======
export const NOTIFICATION_TYPES = {
  // Products
  PRODUCT_APPROVED: "product_approved",
  PRODUCT_REJECTED: "product_rejected",
  // Requests
  REQUEST_APPROVED: "request_approved",
  REQUEST_REJECTED: "request_rejected",
  // Tickets
  TICKET_REPLY: "ticket_reply",
  TICKET_STATUS: "ticket_status",
  TICKET_AUTO_CLOSED: "ticket_auto_closed",
  // Interactions
  NEW_INQUIRY: "new_inquiry",
  NEW_QUOTE: "new_quote",
  // Admin
  ADMIN_ANNOUNCEMENT: "admin_announcement",
  // Subscription
  SUBSCRIPTION_EXPIRING: "subscription_expiring",
  SUBSCRIPTION_ACTIVATED: "subscription_activated",
};

// ====== آیکون پیش‌فرض برای هر نوع ======
const TYPE_ICONS = {
  product_approved: "fa-check-circle",
  product_rejected: "fa-times-circle",
  request_approved: "fa-check-circle",
  request_rejected: "fa-times-circle",
  ticket_reply: "fa-headset",
  ticket_status: "fa-ticket-alt",
  ticket_auto_closed: "fa-clock",
  new_inquiry: "fa-envelope",
  new_quote: "fa-file-signature",
  admin_announcement: "fa-bullhorn",
  subscription_expiring: "fa-hourglass-end",
  subscription_activated: "fa-crown",
};

// ====== تابع اصلی: ساخت نوتیفیکیشن ======
// ⚠️ همیشه fire-and-forget (await نمی‌شود)
export async function createNotification({
  userId,
  type,
  title,
  body = null,
  link = null,
  icon = null,
  metadata = null,
  skipPush = false,
}) {
  try {
    if (!userId || !type || !title) {
      console.warn("createNotification: missing required fields", {
        userId,
        type,
        title,
      });
      return null;
    }

    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        body,
        link,
        icon: icon || TYPE_ICONS[type] || "fa-bell",
        metadata: metadata || undefined,
        read: false,
      },
    });

    // ✅ ارسال Web Push (fire-and-forget)
    // وقتی از eventService صدا زده می‌شویم، پوش همان‌جا و بر اساس
    // ترجیحات کاربر مدیریت می‌شود، پس skipPush=true می‌آید تا
    // نوتیفیکیشن تکراری ارسال نشود.
    if (!skipPush) {
      sendWebPushToUser(userId, {
        title: notification.title,
        body: notification.body || "",
        url: notification.link || "/dashboard/notifications",
        icon: "/favicon.ico",
        notificationId: notification.id,
      }).catch((err) => {
        console.error("[NotificationService] Web Push failed:", err);
      });
    }

    return notification;
  } catch (error) {
    console.error("createNotification error:", error);
    return null;
  }
}

// ====== تابع bulk: برای چند کاربر ======
export async function createBulkNotifications({
  userIds,
  type,
  title,
  body = null,
  link = null,
  icon = null,
  metadata = null,
}) {
  try {
    if (!userIds?.length) return;

    await prisma.notification.createMany({
      data: userIds.map((userId) => ({
        userId,
        type,
        title,
        body,
        link,
        icon: icon || TYPE_ICONS[type] || "fa-bell",
        metadata: metadata || undefined,
      })),
    });
  } catch (error) {
    console.error("createBulkNotifications error:", error);
  }
}

// ====== helper: ارسال به همه‌ی ادمین‌ها ======
export async function notifyAllAdmins({
  type,
  title,
  body = null,
  link = null,
  icon = null,
  metadata = null,
}) {
  try {
    const admins = await prisma.user.findMany({
      where: { isAdmin: true },
      select: { id: true },
    });

    if (admins.length === 0) return;

    await createBulkNotifications({
      userIds: admins.map((a) => a.id),
      type,
      title,
      body,
      link,
      icon,
      metadata,
    });
  } catch (error) {
    console.error("notifyAllAdmins error:", error);
  }
}
