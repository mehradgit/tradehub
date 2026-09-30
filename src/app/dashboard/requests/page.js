// src/app/dashboard/requests/page.js
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import RequestsClient from "@/components/dashboard/RequestsClient";

export const metadata = { title: "My Buying Requests | Dashboard" };

export default async function DashboardRequestsPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const userId = session.user.id;

  const requests = await prisma.buyingRequest.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      category: true,
      subCategory: true,
      quantity: true,
      unit: true,
      isUrgent: true,
      isVisible: true,
      status: true,
      rejectionNote: true,
      deliveryCountry: true,
      createdAt: true,
      views: true,
      requestNumber: true,
      slug: true,
      _count: { select: { quotes: true } },
    },
  });

  // Serialize dates
  const serialized = requests.map((r) => ({
    id: r.id,
    title: r.title,
    category: r.category,
    subCategory: r.subCategory,
    quantity: r.quantity,
    unit: r.unit,
    isUrgent: r.isUrgent,
    isVisible: r.isVisible,
    status: r.status,
    rejectionNote: r.rejectionNote,
    deliveryCountry: r.deliveryCountry,
    createdAt: r.createdAt.toISOString(),
    views: r.views,
    requestNumber: r.requestNumber,
    slug: r.slug,
    _count: r._count,
  }));

  const stats = {
    total: requests.length,
    pending: requests.filter((r) => r.status === "PENDING").length,
    approved: requests.filter((r) => r.status === "APPROVED").length,
    rejected: requests.filter((r) => r.status === "REJECTED").length,
  };

  return <RequestsClient requests={serialized} stats={stats} />;
}