// src/app/sitemap.js
import { prisma } from "@/lib/prisma";
import { getCategories } from "@/lib/categoriesService";
import { buildCategoryTree, buildCategoryIndex } from "@/lib/categoryTree";

// Without this, the sitemap is only built once at build time and
// new products/categories are never added to it.
export const revalidate = 3600;

export default async function sitemap() {
  const baseUrl = "https://foodtradelink.com";

  // Static pages
  const staticPages = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${baseUrl}/products`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/requests`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/profiles`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/contact`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
  ];

  // Approved products
  const products = await prisma.product.findMany({
    where: { isVisible: true, status: "APPROVED" },
    select: { productNumber: true, slug: true, updatedAt: true },
  });

  const productUrls = products.map((p) => ({
    url: `${baseUrl}/products/${p.productNumber}/${p.slug}`,
    lastModified: p.updatedAt,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  // Approved buying requests
  const requests = await prisma.buyingRequest.findMany({
    where: { isVisible: true, status: "APPROVED" },
    select: { requestNumber: true, slug: true, updatedAt: true },
  });

  const requestUrls = requests.map((r) => ({
    url: `${baseUrl}/requests/${r.requestNumber}/${r.slug}`,
    lastModified: r.updatedAt,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  // Completed profiles
  const profiles = await prisma.user.findMany({
    where: { registrationComplete: true },
    select: { profileNumber: true, slug: true, updatedAt: true },
  });

  const profileUrls = profiles.map((u) => ({
    url: `${baseUrl}/profiles/${u.profileNumber}/${u.slug}`,
    lastModified: u.updatedAt,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  // ===== Category landing pages (three levels) =====
  // These pages are the main source of organic traffic, so they are included in the sitemap.
  let categoryUrls = [];
  try {
    const flat = await getCategories();
    const tree = buildCategoryTree(flat).filter((n) => n.isActive !== false);
    const index = buildCategoryIndex(tree);
    const now = new Date();

    categoryUrls = index.flat
      .filter((n) => n.isActive !== false)
      .map((n) => ({
        url: `${baseUrl}/categories/${n.path}`,
        lastModified: now,
        changeFrequency: "weekly",
        priority: n.level === 1 ? 0.8 : n.level === 2 ? 0.7 : 0.6,
      }));
  } catch (err) {
    console.error("[sitemap] category URLs failed:", err.message);
  }

  return [
    ...staticPages,
    ...categoryUrls,
    ...productUrls,
    ...requestUrls,
    ...profileUrls,
  ];
}