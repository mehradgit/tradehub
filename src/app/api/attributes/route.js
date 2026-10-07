// src/app/api/attributes/route.js
import { NextResponse } from "next/server";
import { resolveAttributesForPath } from "@/lib/attributesService";

// ============================================================
// این route به query string وابسته است، پس dynamic است
// Next.js نباید سعی کند آن را در build به صورت static بسازد
// ============================================================
export const dynamic = "force-dynamic";
// export const revalidate = 30;   ← این خط را حذف کن

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryPath = searchParams.get("categoryPath") || "";

    const attributes = await resolveAttributesForPath(categoryPath, {
      filterableOnly: false,
    });

    return NextResponse.json({
      attributes: attributes.map((a) => ({
        id: a.id,
        key: a.key,
        label: a.label,
        dataType: a.dataType,
        unit: a.unit,
        options: a.options || null,
        scope: a.scope,
        scopeId: a.scopeId,
        isFilterable: a.isFilterable,
        isRequired: a.isRequired,
        showInCard: a.showInCard,
        sortOrder: a.sortOrder,
      })),
      categoryPath,
    });
  } catch (error) {
    console.error("Public attributes error:", error);
    return NextResponse.json({ attributes: [], categoryPath: "" });
  }
}