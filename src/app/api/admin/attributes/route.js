// src/app/api/admin/attributes/route.js
// ============================================================
// اتریبیوت‌های محصول (EAV) — API پنل ادمین
//
// GET  : لیست تعاریف + انواع داده + scope ها + درخت دسته‌بندی
// POST : ساخت یک اتریبیوت جدید
//
// درخت دسته‌بندی برای انتخاب scope لازم است: scopeId همان slug
// سطح انتخاب‌شده است (category / subCategory / productType).
// ============================================================
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import {
  ATTRIBUTE_DATA_TYPES,
  ATTRIBUTE_SCOPES,
  createAttributeDefinition,
  listAttributeDefinitions,
} from "@/lib/attributesService";
import { getCategories } from "@/lib/categoriesService";
import { buildCategoryTree } from "@/lib/categoryTree";

// ============================================================
// سریال‌سازی: Date → ISO string تا پاسخ JSON امن باشد
// ============================================================
function serializeAttribute(attr) {
  if (!attr) return null;
  return {
    id: attr.id,
    key: attr.key,
    label: attr.label,
    labelFa: attr.labelFa ?? null,
    dataType: attr.dataType,
    unit: attr.unit ?? null,
    options: Array.isArray(attr.options) ? attr.options : null,
    scope: attr.scope,
    scopeId: attr.scopeId ?? null,
    isFilterable: attr.isFilterable !== false,
    isRequired: attr.isRequired === true,
    showInCard: attr.showInCard === true,
    sortOrder: attr.sortOrder ?? 0,
    isActive: attr.isActive !== false,
    createdAt: attr.createdAt ? new Date(attr.createdAt).toISOString() : null,
    updatedAt: attr.updatedAt ? new Date(attr.updatedAt).toISOString() : null,
  };
}

// ============================================================
// GET: همه‌ی تعاریف (شامل غیرفعال‌ها) + گزینه‌های فرم + درخت
// ============================================================
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const [attributes, categories] = await Promise.all([
      listAttributeDefinitions({ includeInactive: true }),
      getCategories(),
    ]);

    return NextResponse.json({
      attributes: attributes.map(serializeAttribute),
      dataTypes: ATTRIBUTE_DATA_TYPES,
      scopes: ATTRIBUTE_SCOPES,
      tree: buildCategoryTree(categories),
    });
  } catch (error) {
    console.error("Attributes fetch error:", error);
    return NextResponse.json(
      { message: "Failed to fetch attributes" },
      { status: 500 }
    );
  }
}

// ============================================================
// POST: ساخت اتریبیوت
// ============================================================
export async function POST(request) {
  try {
    const session = await auth();
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { message: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const result = await createAttributeDefinition(body);

    if (!result.ok) {
      // خطاهای اعتبارسنجی سرویس برای نمایش به ادمین امن هستند
      return NextResponse.json(
        {
          message: (result.errors || []).join("; ") || "Invalid attribute",
          errors: result.errors || [],
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: "Attribute created", attribute: serializeAttribute(result.attribute) },
      { status: 201 }
    );
  } catch (error) {
    console.error("Attribute create error:", error);
    return NextResponse.json(
      { message: "Failed to create attribute" },
      { status: 500 }
    );
  }
}
