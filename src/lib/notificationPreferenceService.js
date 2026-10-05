// src/lib/notificationPreferenceService.js
import { prisma } from "@/lib/prisma";

// ============================================================
// Default categories
// ============================================================
export const NOTIFICATION_CATEGORIES = [
  {
    key: "inquiry",
    label: "Product Inquiries",
    description: "When buyers send inquiries to your products",
    defaultEmail: true,
    defaultPush: true,
  },
  {
    key: "quote",
    label: "Quotes",
    description: "When suppliers submit quotes on your requests",
    defaultEmail: true,
    defaultPush: true,
  },
  {
    key: "message",
    label: "Messages",
    description: "Direct messages from other users",
    defaultEmail: false,
    defaultPush: true,
  },
  {
    key: "ticket",
    label: "Support Tickets",
    description: "Replies and updates on your support tickets",
    defaultEmail: true,
    defaultPush: true,
  },
  {
    key: "listing",
    label: "Listing Reviews",
    description:
      "When your products or buying requests are approved or rejected",
    defaultEmail: true,
    defaultPush: true,
  },
  {
    key: "subscription",
    label: "Subscription",
    description: "Renewal reminders and account changes",
    defaultEmail: true,
    defaultPush: false,
  },
  {
    key: "digest",
    label: "Weekly Digest",
    description: "Weekly summary of new products and requests",
    defaultEmail: true,
    defaultPush: false,
  },
  {
    key: "marketing",
    label: "Marketing & News",
    description: "Product updates, promotions, and news",
    defaultEmail: false,
    defaultPush: false,
  },
];

// ============================================================
// Get user preferences (creating defaults if none exist)
// ============================================================
export async function getOrCreatePreferences(userId, category) {
  const existing = await prisma.notificationPreference.findUnique({
    where: { userId_category: { userId, category } },
  });

  if (existing) return existing;

  const catMeta = NOTIFICATION_CATEGORIES.find((c) => c.key === category);
  const defaults = catMeta || {
    defaultEmail: true,
    defaultPush: true,
  };

  try {
    return await prisma.notificationPreference.create({
      data: {
        userId,
        category,
        emailEnabled: defaults.defaultEmail,
        pushEnabled: defaults.defaultPush,
        inAppEnabled: true,
        frequency: "instant",
      },
    });
  } catch (err) {
    // ✅ Concurrency race: between findUnique and create the record was
    //    created by another request. If we do not handle this error, the
    //    whole action in eventService is suppressed and the notification is lost.
    if (err.code === "P2002") {
      return prisma.notificationPreference.findUnique({
        where: { userId_category: { userId, category } },
      });
    }
    throw err;
  }
}

// ============================================================
// Get all user preferences
// ============================================================
export async function getAllPreferences(userId) {
  const existing = await prisma.notificationPreference.findMany({
    where: { userId },
  });

  const map = new Map(existing.map((p) => [p.category, p]));
  const result = [];

  for (const cat of NOTIFICATION_CATEGORIES) {
    if (map.has(cat.key)) {
      result.push(map.get(cat.key));
    } else {
      result.push({
        id: null,
        userId,
        category: cat.key,
        emailEnabled: cat.defaultEmail,
        pushEnabled: cat.defaultPush,
        inAppEnabled: true,
        frequency: "instant",
        _isDefault: true,
      });
    }
  }

  return result;
}

// ============================================================
// Update a single category
// ============================================================
export async function updatePreference(userId, category, updates) {
  return prisma.notificationPreference.upsert({
    where: { userId_category: { userId, category } },
    update: {
      emailEnabled: updates.emailEnabled,
      pushEnabled: updates.pushEnabled,
      inAppEnabled: updates.inAppEnabled,
      frequency: updates.frequency,
    },
    create: {
      userId,
      category,
      emailEnabled: updates.emailEnabled ?? true,
      pushEnabled: updates.pushEnabled ?? true,
      inAppEnabled: updates.inAppEnabled ?? true,
      frequency: updates.frequency || "instant",
    },
  });
}