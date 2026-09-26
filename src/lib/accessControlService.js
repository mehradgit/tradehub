// src/lib/accessControlService.js
import { prisma } from "@/lib/prisma";
import { getUserActivePlan, getUsageCount } from "@/lib/planService";
import { ACCESS_CONTROL_DEFAULT } from "@/lib/defaultSettings";

const SETTING_KEY = "accessControl";

// ====== دریافت تنظیمات ======
export async function getAccessControlSettings() {
  const setting = await prisma.setting.findUnique({
    where: { key: SETTING_KEY },
  });
  if (!setting?.value) return ACCESS_CONTROL_DEFAULT;
  return deepMerge(ACCESS_CONTROL_DEFAULT, setting.value);
}

// ====== ذخیره تنظیمات ======
export async function saveAccessControlSettings(value) {
  return prisma.setting.upsert({
    where: { key: SETTING_KEY },
    update: { value },
    create: { key: SETTING_KEY, value },
  });
}

// ====== ادغام عمیق ======
function deepMerge(target, source) {
  const result = { ...target };
  for (const key in source) {
    if (
      source[key] &&
      typeof source[key] === "object" &&
      !Array.isArray(source[key])
    ) {
      result[key] = deepMerge(target[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }
  return result;
}

// ====== بررسی Reveal قبلی (درخواست) ======
export async function hasRevealedBuyerInfo(userId, requestId) {
  if (!userId || !requestId) return false;
  try {
    const record = await prisma.revealedBuyerInfo.findUnique({
      where: { userId_requestId: { userId, requestId } },
    });
    return !!record;
  } catch (error) {
    console.error("hasRevealedBuyerInfo error:", error);
    return false;
  }
}

// ====== ✅ بررسی Reveal قبلی (محصول) ======
export async function hasRevealedSupplierInfo(userId, productId) {
  if (!userId || !productId) return false;
  try {
    const record = await prisma.revealedSupplierInfo.findUnique({
      where: { userId_productId: { userId, productId } },
    });
    return !!record;
  } catch (error) {
    console.error("hasRevealedSupplierInfo error:", error);
    return false;
  }
}

// ====== بررسی مجوز پایه ======
async function checkAccess(section, userId, options = {}) {
  const { isOwner = false } = options;

  if (isOwner && section.freeForOwner !== false) {
    return { allowed: true, reason: "owner" };
  }

  if (!userId) {
    if (section.visibility === "everyone") {
      return { allowed: true, reason: "guest_allowed" };
    }
    return { allowed: false, reason: "login_required" };
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { isAdmin: true, plan: true },
  });

  if (dbUser?.isAdmin && section.freeForAdmin !== false) {
    return { allowed: true, reason: "admin" };
  }

  if (section.visibility === "everyone") {
    return { allowed: true, reason: "everyone" };
  }
  if (section.visibility === "loggedIn") {
    return { allowed: true, reason: "loggedIn" };
  }

  if (section.visibility === "paidPlans") {
    const { plan, subscription } = await getUserActivePlan(userId);
    const planName = subscription?.plan?.name || dbUser?.plan || "Basic";
    const allowedNormalized = (section.allowedPlans || []).map((p) =>
      String(p).toUpperCase()
    );
    const currentNormalized = String(planName).toUpperCase();

    if (!allowedNormalized.includes(currentNormalized)) {
      return {
        allowed: false,
        reason: "upgrade_required",
        currentPlan: planName,
        allowedPlans: section.allowedPlans,
      };
    }

    if (section.consumeQuotaOnReveal && subscription) {
      const monthIndex = Math.floor(
        (Date.now() - new Date(subscription.startDate).getTime()) /
          (30 * 24 * 60 * 60 * 1000)
      );
      const used = await getUsageCount(
        userId,
        section.quotaType || "inquiry",
        monthIndex
      );

      const limitKey =
        {
          inquiry: "maxInquiriesPerMonth",
          quote: "maxQuotesPerMonth",
          request: "maxRequestsPerMonth",
        }[section.quotaType || "inquiry"] || "maxInquiriesPerMonth";

      const limit = plan?.[limitKey] ?? 0;

      if (limit !== -1 && used >= limit) {
        return {
          allowed: false,
          reason: "quota_exhausted",
          currentPlan: planName,
          used,
          limit,
        };
      }
    }

    return { allowed: true, reason: "paid_plan", plan: planName };
  }

  return { allowed: false, reason: "unknown_visibility" };
}

// ====== اطلاعات خریدار درخواست ======
export async function canViewBuyerInfo(userId, request) {
  const settings = await getAccessControlSettings();
  const isOwner = request.userId === userId;

  if (!isOwner && userId) {
    const alreadyRevealed = await hasRevealedBuyerInfo(userId, request.id);
    if (alreadyRevealed) {
      return { allowed: true, reason: "already_revealed" };
    }
  }

  return checkAccess(settings.request.buyerInfo, userId, { isOwner });
}

// ====== اطلاعات تماس خریدار درخواست ======
export async function canViewRequestContactInfo(userId, request) {
  const settings = await getAccessControlSettings();
  return checkAccess(
    { ...settings.request.contactInfo, consumeQuotaOnReveal: false },
    userId,
    { isOwner: request.userId === userId }
  );
}

// ====== ✅ اطلاعات تأمین‌کننده محصول ======
export async function canViewSupplierInfo(userId, product) {
  const settings = await getAccessControlSettings();
  const isOwner = product.userId === userId;

  if (!isOwner && userId) {
    const alreadyRevealed = await hasRevealedSupplierInfo(userId, product.id);
    if (alreadyRevealed) {
      return { allowed: true, reason: "already_revealed" };
    }
  }

  return checkAccess(settings.product.supplierInfo, userId, { isOwner });
}

// ====== اطلاعات تماس پروفایل ======
export async function canViewProfileContactInfo(userId, targetUserId) {
  const settings = await getAccessControlSettings();
  return checkAccess(settings.profile.contactInfo, userId, {
    isOwner: targetUserId === userId,
  });
}

// ====== helper ======
export async function getSectionSettings(section) {
  const settings = await getAccessControlSettings();
  return settings[section];
}