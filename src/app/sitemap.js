// src/app/sitemap.js
import { prisma } from "@/lib/prisma";

export default async function sitemap() {
  const baseUrl = "https://foodtradelink.com";

  // صفحات ثابت
  const staticPages = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${baseUrl}/products`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/requests`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/profiles`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/contact`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
  ];

  // محصولات تأییدشده
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

  // درخواست‌های خرید تأییدشده
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

  // پروفایل‌های تکمیل‌شده
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

  return [...staticPages, ...productUrls, ...requestUrls, ...profileUrls];
}