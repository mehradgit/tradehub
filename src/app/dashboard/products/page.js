// src/app/dashboard/products/page.js
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import ProductsClient from "@/components/dashboard/ProductsClient";

export const metadata = { title: "My Products | Dashboard" };

export default async function DashboardProductsPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const userId = session.user.id;

  const products = await prisma.product.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      category: true,
      subCategory: true,
      price: true,
      currency: true,
      unit: true,
      images: true,
      badge: true,
      stock: true,
      isVisible: true,
      status: true,
      rejectionNote: true,
      views: true,
      moq: true,
      createdAt: true,
      productNumber: true,
      slug: true,
      _count: { select: { inquiries: true } },
    },
  });

  // Serialize dates + normalize images
  const serialized = products.map((p) => ({
    id: p.id,
    name: p.name,
    category: p.category,
    subCategory: p.subCategory,
    price: p.price,
    currency: p.currency,
    unit: p.unit,
    images: Array.isArray(p.images) ? p.images : [],
    badge: p.badge,
    stock: p.stock,
    isVisible: p.isVisible,
    status: p.status,
    rejectionNote: p.rejectionNote,
    views: p.views,
    moq: p.moq,
    createdAt: p.createdAt.toISOString(),
    productNumber: p.productNumber,
    slug: p.slug,
    _count: p._count,
  }));

  // ===== Stats =====
  const stats = {
    total: products.length,
    pending: products.filter((p) => p.status === "PENDING").length,
    approved: products.filter((p) => p.status === "APPROVED").length,
    rejected: products.filter((p) => p.status === "REJECTED").length,
  };

  return <ProductsClient products={serialized} stats={stats} />;
}