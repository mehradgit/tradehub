// src/app/(public)/products/[productNumber]/[slug]/layout.js
import { prisma } from "@/lib/prisma";

export async function generateMetadata({ params }) {
  const { productNumber } = await params;
  const product = await prisma.product.findUnique({
    where: { productNumber: parseInt(productNumber) },
    select: { name: true, shortDesc: true },
  });

  if (!product) {
    return {
      title: "Product Not Found",
      description: "The product you're looking for does not exist.",
    };
  }

  return {
    title: `${product.name} · B2B Food Hub`,
    description: product.shortDesc,
  };
}

export default function ProductLayout({ children }) {
  return children;
}