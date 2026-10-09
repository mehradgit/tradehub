// src/app/api/track-view/route.js
import { prisma } from "@/lib/prisma";
import { NextResponse, after } from "next/server";
import { getViewerCountry } from "@/lib/geoIp";
import { alertNewView } from "@/lib/adminAlerts";

// ====== base URL ======
function getBaseUrl() {
  return (
    process.env.NEXTAUTH_URL ||
    process.env.AUTH_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000"
  ).replace(/\/+$/, "");
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { type, id } = body;

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    // ====== افزایش بازدید + خواندن اطلاعات نمایشی ======
    let item = null;
    let relativeUrl = null;

    if (type === "product") {
      await prisma.product.update({
        where: { id },
        data: { views: { increment: 1 } },
      });
      item = await prisma.product.findUnique({
        where: { id },
        select: {
          name: true,
          productNumber: true,
          slug: true,
          views: true,
        },
      });
      if (item) {
        relativeUrl = `/products/${item.productNumber}/${item.slug}`;
      }
    } else if (type === "request") {
      await prisma.buyingRequest.update({
        where: { id },
        data: { views: { increment: 1 } },
      });
      item = await prisma.buyingRequest.findUnique({
        where: { id },
        select: {
          title: true,
          requestNumber: true,
          slug: true,
          views: true,
        },
      });
      if (item) {
        relativeUrl = `/requests/${item.requestNumber}/${item.slug}`;
      }
    } else if (type === "profile") {
      await prisma.user.update({
        where: { id },
        data: { views: { increment: 1 } },
      });
      item = await prisma.user.findUnique({
        where: { id },
        select: {
          name: true,
          companyName: true,
          profileNumber: true,
          slug: true,
          views: true,
        },
      });
      if (item) {
        relativeUrl = `/profiles/${item.profileNumber}/${item.slug}`;
      }
    } else {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    // ====== اطلاع تلگرامی ادمین ======
    // با after() بعد از ارسال پاسخ اجرا می‌شود تا
    // سرعت بارگذاری صفحه تحت تأثیر قرار نگیرد
    // (lookup کشور تا ۴ ثانیه طول می‌کشد)
    if (item) {
      const title = item.name || item.title || item.companyName || "—";
      const pageUrl = `${getBaseUrl()}${relativeUrl}`;
      const viewCount = item.views;

      after(async () => {
        try {
          const countryCode = await getViewerCountry(request);
          alertNewView({
            kind: type,
            title,
            url: pageUrl,
            countryCode,
            views: viewCount,
          });
        } catch (err) {
          console.error("[track-view] telegram alert failed:", err);
        }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error tracking view:", error);
    return NextResponse.json({ error: "Failed to track view" }, { status: 500 });
  }
}
