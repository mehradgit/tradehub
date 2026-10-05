// src/app/api/attributes/route.js
// ============================================================
// Attributes related to one category path (public, read-only)
//
// The product form calls this when the category changes so it can render
// the matching specification fields. The filter panel uses the same service.
// ============================================================
import { NextResponse } from "next/server";
import { resolveAttributesForPath } from "@/lib/attributesService";

export const revalidate = 30;

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryPath = searchParams.get("categoryPath") || "";

    // The form also needs non-filterable attributes (for example isRequired)
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
    // A failure in attributes must not break the form
    return NextResponse.json({ attributes: [], categoryPath: "" });
  }
}
