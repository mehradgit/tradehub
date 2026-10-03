// src/lib/eventService.js
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notificationService";
import { sendWebPushToUser } from "@/lib/pushService";
import { queueEmail } from "@/lib/emailQueueService";
import { getOrCreatePreferences } from "@/lib/notificationPreferenceService";
import { HANDLERS } from "@/lib/eventHandlers";

// ============================================================
// dispatchEvent — تابع مرکزی
//
// eventName: "inquiry.created" | "user.registered" | ...
// payload:   داده‌های مربوط به رویداد
//
// همیشه fire-and-forget است. هرگز throw نمی‌کند.
// ============================================================
export async function dispatchEvent(eventName, payload = {}) {
  try {
    const handler = HANDLERS[eventName];
    if (!handler) {
      console.warn(`[EventService] No handler for event: ${eventName}`);
      return { dispatched: 0 };
    }

    // handler یک یا چند action برمی‌گرداند
    const actions = await handler(payload);
    if (!Array.isArray(actions) || actions.length === 0) {
      return { dispatched: 0 };
    }

    let dispatched = 0;
    for (const action of actions) {
      try {
        await dispatchAction(action);
        dispatched++;
      } catch (err) {
        console.error(`[EventService] action failed:`, err.message);
      }
    }

    return { dispatched };
  } catch (error) {
    console.error(`[EventService] dispatchEvent error (${eventName}):`, error);
    return { dispatched: 0, error: error.message };
  }
}

// ============================================================
// dispatchAction — ارسال به یک کاربر در چند کانال
//
// action = {
//   userId,
//   category,           // "inquiry" | "quote" | ...
//   templateKey,        // "new_inquiry"
//   variables,          // متغیرهای قالب
//   channels,           // ["email", "push", "inApp"]
//   inAppData,          // { title, body, link, icon, metadata }
//   pushData,           // { title, body, url, icon }
//   metadata,           // برای EmailLog
//   bypassPreferences,  // اگر true، Preferences نادیده گرفته می‌شود
// }
// ============================================================
async function dispatchAction(action) {
  const {
    userId,
    category,
    templateKey = null,
    variables = {},
    channels = ["email", "push", "inApp"],
    inAppData = null,
    pushData = null,
    metadata = null,
    bypassPreferences = false,
  } = action;

  if (!userId) {
    console.warn("[EventService] action without userId");
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, companyName: true },
  });

  if (!user) {
    console.warn(`[EventService] user not found: ${userId}`);
    return;
  }

  // بررسی Preferences (مگر اینکه bypassPreferences = true)
  let prefs = {
    emailEnabled: true,
    pushEnabled: true,
    inAppEnabled: true,
    frequency: "instant",
  };

  if (!bypassPreferences && category) {
    const p = await getOrCreatePreferences(userId, category);
    prefs = p;
  }

  // ====== 1. In-App ======
  if (channels.includes("inApp") && prefs.inAppEnabled && inAppData) {
    await createNotification({
      userId,
      type: inAppData.type || category || "general",
      title: inAppData.title,
      body: inAppData.body || null,
      link: inAppData.link || null,
      icon: inAppData.icon || null,
      metadata: inAppData.metadata || null,
    });
  }

  // ====== 2. Push ======
  if (channels.includes("push") && prefs.pushEnabled && pushData) {
    await sendWebPushToUser(userId, {
      title: pushData.title,
      body: pushData.body || "",
      url: pushData.url || "/dashboard",
      icon: pushData.icon || "/favicon.ico",
    });
  }

  // ====== 3. Email ======
  if (
    channels.includes("email") &&
    (prefs.emailEnabled || bypassPreferences) &&
    templateKey &&
    user.email
  ) {
    // در فاز ۱ فقط instant ارسال می‌شود؛ daily/weekly در فاز ۲
    if (prefs.frequency === "instant" || bypassPreferences) {
      await queueEmail({
        userId,
        toEmail: user.email,
        templateKey,
        variables: {
          userName: user.name || "",
          companyName: user.companyName || "",
          ...variables,
        },
        metadata,
      });
    }
    // اگر frequency != instant بود، در فاز ۲ به digest اضافه می‌شود
  }
}