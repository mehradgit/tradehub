// src/app/api/admin/analytics/google/route.js
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  getAnalyticsSummary,
  getAnalyticsDaily,
  getTopPages,
  getTrafficSources,
  getTopCountries,
  getDeviceBreakdown,
  getRealtimeUsers,
} from "@/lib/googleAnalytics";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const session = await auth();
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const days = Math.min(
      365,
      Math.max(1, parseInt(searchParams.get("days") || "28"))
    );

    const [
      summary,
      daily,
      topPages,
      trafficSources,
      countries,
      devices,
      realtime,
    ] = await Promise.all([
      getAnalyticsSummary({ days }),
      getAnalyticsDaily({ days }),
      getTopPages({ days, limit: 10 }),
      getTrafficSources({ days, limit: 8 }),
      getTopCountries({ days, limit: 8 }),
      getDeviceBreakdown({ days }),
      getRealtimeUsers(),
    ]);

    return NextResponse.json({
      summary,
      daily,
      topPages,
      trafficSources,
      countries,
      devices,
      realtime,
      days,
    });
  } catch (error) {
    console.error("Google Analytics error:", error);
    return NextResponse.json(
      {
        message:
          "Failed to fetch Google Analytics. Check GA_PROPERTY_ID and service account access.",
        error: error.message,
      },
      { status: 500 }
    );
  }
}