// src/app/products/[id]/page.js
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Layout from "@/components/layout/Layout";
import ProductDetail from "@/components/product/ProductDetail";

// ====== دریافت داده‌های محصول و تامین‌کننده ======
async function getProductData(id) {
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          companyName: true,
          country: true,
          countryCode: true,
          image: true,
          coverImage: true,
          logo: true,
          website: true,
          createdAt: true,
        },
      },
    },
  });

  if (!product) {
    notFound();
  }

  // ✅ ساختار داده‌های مورد نیاز ProductDetail
  const productData = {
    id: product.id,
    name: product.name,
    userId: product.userId, 
    category: product.category,
    subCategory: product.subCategory,
    createdAt: new Date(product.createdAt).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
    honeyType: product.subCategory || product.category,
    moq: `${product.moq} ${product.unit || ""}`,
    countryOfOrigin: product.country || product.origin || "Unknown",
    countryCode: product.countryCode || null,
    country: product.country || null,
    price: product.price,
    currency: product.currency || "USD",
    annualSupply: product.stock
      ? `${product.stock} units`
      : "Contact for details",
    // ====== فیلدهای جدید ======
    shippingTerms: product.shippingTerms || null,
    packaging: product.packaging || null,
    certifications: product.certifications || null,
    leadTime: product.leadTime || null,
    unit: product.unit || null,
    // ====== پایان فیلدهای جدید ======
    shippingCountries: ["Worldwide"],
    features: product.certifications?.split(",").map((s) => s.trim()) || [
      "Premium",
      "Organic",
    ],
    shortDesc: product.shortDesc || "",
    fullDesc: product.fullDesc || "",
    description:
      product.fullDesc || product.shortDesc || "No description available.",
    images: Array.isArray(product.images)
      ? product.images
      : product.images?.main
        ? [product.images.main, ...(product.images.thumbnails || [])]
        : ["https://placehold.co/360x360"],
  };

  // ساختار داده‌های تامین‌کننده
  const supplierData = {
    id: product.user.id, 
    name: product.user.companyName || product.user.name || "Unknown Supplier",
    website: product.user.website || "No website",
    foundingYear: new Date(product.user.createdAt).getFullYear(),
    country: product.user.country || "Unknown",
    countryCode: product.user.countryCode || null,
    logo:
      product.user.logo || product.user.image || "https://placehold.co/55x50",
    coverImage: product.user.coverImage || "https://placehold.co/303x80",
  };

  return { productData, supplierData };
}

// ====== متادیتا ======
export async function generateMetadata({ params }) {
  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id },
    select: { name: true, shortDesc: true },
  });
  if (!product) {
    return { title: "Product Not Found" };
  }
  return {
    title: `${product.name} | B2B Food Hub`,
    description: product.shortDesc || `View details of ${product.name}`,
  };
}

// ====== صفحه اصلی ======
export default async function ProductPage({ params }) {
  const { id } = await params;
  const { productData, supplierData } = await getProductData(id);

  return (
    <Layout>
      <div className="container py-4">
        <ProductDetail product={productData} supplier={supplierData} />
      </div>
    </Layout>
  );
}
