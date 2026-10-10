// src/app/(public)/products/[productNumber]/[slug]/page.js
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import ProductDetail from "@/components/product/ProductDetail";
import { auth } from "@/auth";
import {
  getSectionSettings,
  canViewSupplierInfo,
  hasRevealedSupplierInfo,
} from "@/lib/accessControlService";
import { getProductAttributes } from "@/lib/attributesService";
import {
  PRODUCT_PLACEHOLDER,
  AVATAR_PLACEHOLDER,
  COVER_PLACEHOLDER,
} from "@/lib/imageHelpers";

const BASE_URL = "https://foodtradelink.com";

// ============================================================
// getProductData
// ============================================================
async function getProductData(productNumber) {
  const product = await prisma.product.findUnique({
    where: { productNumber, status: "APPROVED" },
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
          profileNumber: true,
          slug: true,
          website: true,
          createdAt: true,
        },
      },
    },
  });

  if (!product) {
    notFound();
  }
 
  // ====== Dynamic specifications (EAV) ======
  // If the attribute table/service is unavailable, the page must not break.
  let attributes = [];
  try {
    attributes = await getProductAttributes(product.id);
  } catch (err) {
    console.error("[product-detail] getProductAttributes failed:", err);
    attributes = [];
  }

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
    shippingTerms: product.shippingTerms || null,
    packaging: product.packaging || null,
    certifications: product.certifications || null,
    leadTime: product.leadTime || null,
    unit: product.unit || null,
    ratingAverage: product.ratingAverage  || 0,
    ratingCount: product.ratingCount  || 0,
    // ====== Dynamic specifications (EAV) — an array of plain objects ======
    // { attributeId, key, label, dataType, unit, options, values, value }
    attributes,
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
        : [PRODUCT_PLACEHOLDER],
  };

  const supplierData = {
    id: product.user.id,
    name: product.user.companyName || product.user.name || "Unknown Supplier",
    website: product.user.website || "No website",
    foundingYear: new Date(product.user.createdAt).getFullYear(),
    country: product.user.country || "Unknown",
    countryCode: product.user.countryCode || null,
    logo:
      product.user.logo || product.user.image || AVATAR_PLACEHOLDER,
    coverImage: product.user.coverImage || COVER_PLACEHOLDER,
    profileNumber: product.user.profileNumber,
    slug: product.user.slug,
  };

  return { productData, supplierData, rawProduct: product };
}
// ============================================================
// محصولات مشابه — اولویت با categoryPath، fallback به category
// ============================================================
async function getSimilarProducts(product, limit = 6) {
  const where = {
    id: { not: product.id },
    userId: { not: product.userId },   // محصولات خود همان فروشنده را نشان نده
    isVisible: true,
    status: "APPROVED",
  };

  // اگر categoryPath پر است، دقیق‌ترش کن؛ وگرنه به category تکیه کن
  if (product.categoryPath) {
    where.categoryPath = { startsWith: product.categoryPath };
  } else if (product.category) {
    where.category = product.category;
  }

  let items = await prisma.product.findMany({
    where,
    take: limit,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      price: true,
      unit: true,
      images: true,
      badge: true,
      country: true,
      countryCode: true,
      slug: true,
      productNumber: true,
      category: true,
      user: { select: { companyName: true } },
    },
  });

  // اگر با categoryPath نتیجه نداد (مثلاً محصولات قدیمی هنوز rebuild نشدن)
  if (items.length === 0 && product.categoryPath) {
    items = await prisma.product.findMany({
      where: {
        ...where,
        categoryPath: undefined,
        category: product.category,
      },
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        price: true,
        unit: true,
        images: true,
        badge: true,
        country: true,
        countryCode: true,
        slug: true,
        productNumber: true,
        category: true,
        user: { select: { companyName: true } },
      },
    });
  }

  return items;
}

// ============================================================
// generateMetadata — advanced SEO
// ============================================================
export async function generateMetadata({ params }) {
  const { productNumber, slug } = await params;
  const num = parseInt(productNumber);
  if (isNaN(num)) return { title: "Product Not Found" };

  const product = await prisma.product.findUnique({
    where: { productNumber: num },
    select: {
      name: true,
      shortDesc: true,
      fullDesc: true,
      images: true,
      category: true,
      subCategory: true,
      country: true,
      countryCode: true,
      price: true,
      currency: true,
      unit: true,
      slug: true,
      status: true,
      user: {
        select: { companyName: true, name: true },
      },
    },
  });

  if (!product) {
    return {
      title: "Product Not Found",
      description: "The product you're looking for does not exist.",
      robots: { index: false, follow: false },
    };
  }

  const productUrl = `${BASE_URL}/products/${productNumber}/${product.slug}`;

  // Main image
  const firstImage = Array.isArray(product.images) ? product.images[0] : null;
  const imageUrl = firstImage
    ? firstImage.startsWith("http")
      ? firstImage
      : `${BASE_URL}${firstImage}`
    : `${BASE_URL}/og-default.png`;

  // Description
  const rawDesc =
    product.shortDesc ||
    product.fullDesc?.replace(/<[^>]*>/g, "").trim() ||
    `${product.name} - Buy wholesale from verified suppliers on FoodTradeLink.`;
  const description = rawDesc.slice(0, 158);

  // Keywords
  const keywords = [
    product.name,
    product.category,
    product.subCategory,
    product.country,
    "wholesale",
    "buy in bulk",
    "B2B supplier",
    "export",
    `${product.name} price`,
    `${product.name} supplier`,
  ].filter(Boolean);

  // If the product is not APPROVED, use noindex
  const isIndexable = product.status === "APPROVED";

  return {
    title: product.name,
    description,
    keywords,
    alternates: {
      canonical: productUrl,
    },
    openGraph: {
      type: "website",
      url: productUrl,
      title: product.name,
      description,
      siteName: "FoodTradeLink",
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: product.name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: product.name,
      description,
      images: [imageUrl],
    },
    robots: isIndexable
      ? {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          "max-image-preview": "large",
          "max-snippet": -1,
        },
      }
      : { index: false, follow: false },
  };
}

// ============================================================
// ProductPage
// ============================================================
export default async function ProductPage({ params }) {
  const { productNumber, slug } = await params;
  const productNum = parseInt(productNumber);
  const { productData, supplierData, rawProduct } =
    await getProductData(productNum);

  const similarProducts = await getSimilarProducts(rawProduct, 6);
  // ====== Access check ======
  const session = await auth();
  const productSettings = await getSectionSettings("product");
  const supplierInfoPermission = await canViewSupplierInfo(
    session?.user?.id,
    { id: productData.id, userId: productData.userId }
  );

  const alreadyRevealed =
    session?.user?.id && productData.userId !== session.user.id
      ? await hasRevealedSupplierInfo(session.user.id, productData.id)
      : false;

  const shouldAutoReveal =
    supplierInfoPermission.allowed &&
    (supplierInfoPermission.reason === "owner" ||
      supplierInfoPermission.reason === "admin" ||
      supplierInfoPermission.reason === "already_revealed" ||
      supplierInfoPermission.reason === "guest_allowed" ||
      supplierInfoPermission.reason === "everyone" ||
      supplierInfoPermission.reason === "loggedIn" ||
      productSettings?.supplierInfo?.consumeQuotaOnReveal === false);

  // ============================================================
  // JSON-LD (Structured Data)
  // ============================================================
  const productUrl = `${BASE_URL}/products/${productNumber}/${slug}`;
  const firstImage = Array.isArray(productData.images)
    ? productData.images[0]
    : null;
  const jsonLdImage = firstImage
    ? firstImage.startsWith("http")
      ? firstImage
      : `${BASE_URL}${firstImage}`
    : `${BASE_URL}/og-default.png`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: productData.name,
    description: productData.shortDesc,
    image: [jsonLdImage],
    sku: String(productNumber),
    category: productData.category,
    ...(productData.subCategory && { additionalType: productData.subCategory }),
    ...(productData.country && {
      countryOfOrigin: {
        "@type": "Country",
        name: productData.country,
      },
    }),
    brand: {
      "@type": "Brand",
      name: supplierData.name,
    },
    offers: {
      "@type": "Offer",
      url: productUrl,
      priceCurrency: productData.currency || "USD",
      price: productData.price,
      priceValidUntil: new Date(
        Date.now() + 365 * 24 * 60 * 60 * 1000
      ).toISOString().split("T")[0],
      availability: "https://schema.org/InStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: {
        "@type": "Organization",
        name: supplierData.name,
        ...(supplierData.country && {
          address: {
            "@type": "PostalAddress",
            addressCountry: supplierData.country,
          },
        }),
      },
    },
    ...(productData.certifications && {
      hasCertification: productData.certifications,
    }),
  };

  return (
    <>
      {/* ✅ Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="container py-4">
        <ProductDetail
          product={productData}
          supplier={supplierData}
          supplierInfoPermission={supplierInfoPermission}
          alreadyRevealed={alreadyRevealed}
          shouldAutoReveal={shouldAutoReveal}
          similarProducts={similarProducts}     
        />
      </div>
    </>
  );
}