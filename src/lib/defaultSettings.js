// src/lib/defaultSettings.js

export const ACCESS_CONTROL_DEFAULT = {
  // ====== صفحه درخواست ======
  request: {
    showTitle: true,
    showDescription: true,
    showSpecs: true,

    buyerInfo: {
      visibility: "paidPlans",
      allowedPlans: ["Bronze", "Silver", "Gold"],
      consumeQuotaOnReveal: true,
      quotaType: "quote",
      freeForOwner: true,
      freeForAdmin: true,
    },

    contactInfo: {
      visibility: "paidPlans",
      allowedPlans: ["Bronze", "Silver", "Gold"],
      consumeQuotaOnReveal: false,
      quotaType: "quote",
      freeForOwner: true,
      freeForAdmin: true,
    },
  },

  // ====== صفحه محصول ======
  product: {
    showTitle: true,
    showDescription: true,
    showPrice: true,
    showSpecs: true,
    showImages: true,

    // ✅ ادغام اطلاعات تأمین‌کننده + فرم Send Request
    supplierInfo: {
      visibility: "paidPlans",
      allowedPlans: ["Bronze", "Silver", "Gold"],
      consumeQuotaOnReveal: true,
      quotaType: "inquiry",
      freeForOwner: true,
      freeForAdmin: true,
    },
  },

  // ====== صفحه پروفایل ======
  profile: {
    showBio: true,
    showStats: true,
    showProducts: true,
    showBuyingRequests: true,

    contactInfo: {
      visibility: "paidPlans",
      allowedPlans: ["Bronze", "Silver", "Gold"],
      consumeQuotaOnReveal: true,
      quotaType: "inquiry",
      freeForOwner: true,
      freeForAdmin: true,
    },
  },

  // ====== لیست پروفایل‌ها ======
  profilesList: {
    requiresLogin: false,
    showName: true,
    showCountry: true,
    showRole: true,
    showPlan: false,
    showContactInfo: false,
  },
};