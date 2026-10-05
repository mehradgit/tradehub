// src/utils/invoiceHelpers.js

// ====== Generate a unique invoice number ======
// Format: INV-YYYY-NNNNN
export async function generateInvoiceNumber(prisma) {
  const year = new Date().getFullYear();

  const lastPayment = await prisma.payment.findFirst({
    where: {
      invoiceNumber: { startsWith: `INV-${year}-` },
    },
    orderBy: { invoiceNumber: "desc" },
    select: { invoiceNumber: true },
  });

  let nextNumber = 1;
  if (lastPayment) {
    const parts = lastPayment.invoiceNumber.split("-");
    nextNumber = parseInt(parts[2]) + 1;
  }

  return `INV-${year}-${String(nextNumber).padStart(5, "0")}`;
}

// ====== Generate a reference number ======
export function generateReferenceNumber() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `REF-${timestamp}-${random}`;
}

// ====== Currency formatting ======
export function formatCurrency(amount, currency = "USD") {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 2,
  }).format(num || 0);
}

// ====== Date formatting ======
export function formatDate(date, options = {}) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    ...options,
  });
}

export function formatDateTime(date) {
  if (!date) return "—";
  return new Date(date).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ====== Status color ======
export function getPaymentStatusBadge(status) {
  const map = {
    paid: { label: "Paid", bg: "#e6faf1", color: "#0a7d55", icon: "fa-check-circle" },
    pending: { label: "Pending", bg: "#fff8e8", color: "#b45309", icon: "fa-clock" },
    failed: { label: "Failed", bg: "#fef2f2", color: "#dc2626", icon: "fa-times-circle" },
    refunded: { label: "Refunded", bg: "#eef0ff", color: "#4f46e5", icon: "fa-rotate-left" },
    cancelled: { label: "Cancelled", bg: "#f1f5f9", color: "#475569", icon: "fa-ban" },
  };
  return map[status] || map.pending;
}

// ====== Method color ======
export function getPaymentMethodLabel(method) {
  const map = {
    simulated: "Simulated",
    manual: "Manual Entry",
    coupon_free: "Free (Coupon)",
    gateway: "Online Gateway",
    zarinpal: "Zarinpal",
    stripe: "Stripe",
  };
  return map[method] || method;
}