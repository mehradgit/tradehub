// src/app/api/attributes/route.js
// ============================================================
// اتریبیوت‌های مرتبط با یک مسیر دسته‌بندی (عمومی، فقط خواندنی)
//
// فرم محصول با تغییر دسته، این را صدا می‌زند تا فیلدهای مشخصات
// مربوطه را رندر کند. پنل فیلتر هم از همان سرویس استفاده می‌کند.
// ============================================================
import { NextResponse } from "next/server";
import { resolveAttributesForPath } from "@/lib/attributesService";

export const revalidate = 30;

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryPath = searchParams.get("categoryPath") || "";

    // برای فرم، اتریبیوت‌های غیرقابل‌فیلتر هم لازم‌اند (مثلاً isRequired)
    const attributes = await resolveAttributesForPath(categoryPath, {
      filterableOnly: false,
    });

    return NextResponse.json({
      attributes: attributes.map((a) => ({
        id: a.id,
        key: a.key,
        label: a.label,
        labelFa: a.labelFa,
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
    // خطا در اتریبیوت‌ها نباید فرم را از کار بیندازد
    return NextResponse.json({ attributes: [], categoryPath: "" });
  }
}
