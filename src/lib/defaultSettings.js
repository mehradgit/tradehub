// src/lib/defaultSettings.js

export const ACCESS_CONTROL_DEFAULT = {
  // ====== Request page ======
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

  // ====== Product page ======
  product: {
    showTitle: true,
    showDescription: true,
    showPrice: true,
    showSpecs: true,
    showImages: true,

    // ✅ Merged supplier info + Send Request form
    supplierInfo: {
      visibility: "paidPlans",
      allowedPlans: ["Bronze", "Silver", "Gold"],
      consumeQuotaOnReveal: true,
      quotaType: "inquiry",
      freeForOwner: true,
      freeForAdmin: true,
    },
  },

  // ====== Profile page ======
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

  // ====== Profiles list ======
  profilesList: {
    requiresLogin: false,
    showName: true,
    showCountry: true,
    showRole: true,
    showPlan: false,
    showContactInfo: false,
  },
};