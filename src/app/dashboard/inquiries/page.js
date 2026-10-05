// src/app/dashboard/inquiries/page.js
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import InquiriesClient from "@/components/dashboard/InquiriesClient";

export const metadata = { title: "My Inquiries | Dashboard" };

export default async function InquiriesPage({ searchParams }) {
  const session = await auth();
  if (!session) redirect("/login");

  const userId = session.user.id;
  const params = await searchParams;
  const tab = params.tab || "buyer";
  const productId = params.productId || null;

  // ===== where =====
  const where = {
    [tab === "buyer" ? "userId" : "supplierId"]: userId,
  };
  if (productId) where.productId = productId;

  const [inquiries, buyerCount, supplierCount] = await Promise.all([
    prisma.productInquiry.findMany({
      where,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        message: true,
        quantity: true,
        requestedPrice: true,
        status: true,
        createdAt: true,
        read: true,
        product: {
          select: {
            id: true,
            name: true,
            images: true,
            price: true,
            unit: true,
            category: true,
            subCategory: true,
            productNumber: true,
            slug: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            companyName: true,
            phone: true,
            image: true,
            logo: true,
            country: true,
            countryCode: true,
          },
        },
        supplier: {
          select: {
            id: true,
            name: true,
            email: true,
            companyName: true,
            phone: true,
            image: true,
            logo: true,
            country: true,
            countryCode: true,
          },
        },
      },
    }),
    prisma.productInquiry.count({ where: { userId } }),
    prisma.productInquiry.count({ where: { supplierId: userId } }),
  ]);

  // ===== Serialize =====
  const serialized = inquiries.map((inq) => ({
    id: inq.id,
    message: inq.message,
    quantity: inq.quantity,
    requestedPrice: inq.requestedPrice,
    status: inq.status,
    createdAt: inq.createdAt.toISOString(),
    read: inq.read,
    product: {
      id: inq.product.id,
      name: inq.product.name,
      images: Array.isArray(inq.product.images) ? inq.product.images : [],
      price: inq.product.price,
      unit: inq.product.unit,
      category: inq.product.category,
      subCategory: inq.product.subCategory,
      productNumber: inq.product.productNumber,
      slug: inq.product.slug,
    },
    user: inq.user,
    supplier: inq.supplier,
  }));

  // ===== Product name (if the filter was on a single product) =====
  let productName = "";
  if (productId) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { name: true },
    });
    if (product) productName = product.name;
  }

  return (
    <InquiriesClient
      inquiries={serialized}
      tab={tab}
      productId={productId}
      productName={productName}
      counts={{ buyer: buyerCount, supplier: supplierCount }}
    />
  );
}