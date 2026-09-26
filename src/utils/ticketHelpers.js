// src/utils/ticketHelpers.js

// ====== تولید شماره تیکت یکتا (۱۰۰۰ به بالا) ======
export async function generateTicketNumber(prisma) {
  const lastTicket = await prisma.ticket.findFirst({
    orderBy: { ticketNumber: "desc" },
    select: { ticketNumber: true },
  });

  if (!lastTicket) return 1001;
  return lastTicket.ticketNumber + 1;
}

// ====== دسته‌های مجاز ======
export const TICKET_CATEGORIES = [
  { value: "technical", label: "Technical Issue" },
  { value: "billing", label: "Billing & Subscription" },
  { value: "account", label: "Account & Profile" },
  { value: "product", label: "Product or Listing" },
  { value: "dispute", label: "Dispute with Counterparty" },
  { value: "abuse", label: "Report Abuse" },
  { value: "feature", label: "Feature Request" },
  { value: "other", label: "Other" },
];

// ====== اولویت‌ها ======
export const TICKET_PRIORITIES = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

// ====== وضعیت‌ها ======
export const TICKET_STATUSES = [
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In Progress" },
  { value: "waiting_user", label: "Waiting for User" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
];

// ====== رنگ اولویت ======
export function getPriorityColor(priority) {
  const map = {
    low: { bg: "#e8f1ff", color: "#3b82f6" },
    medium: { bg: "#fff4dd", color: "#d97706" },
    high: { bg: "#ffe5e0", color: "#ea580c" },
    urgent: { bg: "#fde8e5", color: "#dc2626" },
  };
  return map[priority] || map.medium;
}

// ====== رنگ وضعیت ======
export function getStatusColor(status) {
  const map = {
    open: { bg: "#e8f1ff", color: "#3b82f6", label: "Open" },
    in_progress: { bg: "#fff4dd", color: "#d97706", label: "In Progress" },
    waiting_user: { bg: "#f3efff", color: "#8b5cf6", label: "Waiting for You" },
    resolved: { bg: "#e6f7ef", color: "#13795b", label: "Resolved" },
    closed: { bg: "#eef1f0", color: "#71807b", label: "Closed" },
  };
  return map[status] || map.open;
}

// ====== برچسب دسته ======
export function getCategoryLabel(category) {
  const found = TICKET_CATEGORIES.find((c) => c.value === category);
  return found?.label || category;
}