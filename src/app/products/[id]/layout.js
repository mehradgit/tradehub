// src/app/products/[id]/layout.js
export async function generateMetadata({ params }) {
  const { id } = await params;
  const { prisma } = require("@/lib/prisma");
  
  const product = await prisma.product.findUnique({
    where: { id },
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