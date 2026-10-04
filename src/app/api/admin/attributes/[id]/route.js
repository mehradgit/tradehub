// src/app/api/admin/attributes/[id]/route.js
// ============================================================
// ویرایش / حذف یک اتریبیوت محصول
//
// PATCH  : به‌روزرسانی تعریف
// DELETE : حذف تعریف — مقادیر وابسته روی محصولات با
//          onDelete: Cascade پاک می‌شوند.
// ============================================================
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import {
  deleteAttributeDefinition,
  updateAttributeDefinition,
} from "@/lib/attributesService";

// ============================================================
// سریال‌سازی: Date → ISO string
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
// PATCH: ویرایش اتریبیوت
// ============================================================
export async function PATCH(request, { params }) {
  try {
    const session = await auth();
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { message: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const result = await updateAttributeDefinition(id, body);

    if (result.notFound) {
      return NextResponse.json(
        { message: "Attribute not found" },
        { status: 404 }
      );
    }

    if (!result.ok) {
      return NextResponse.json(
        {
          message: (result.errors || []).join("; ") || "Invalid attribute",
          errors: result.errors || [],
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: "Attribute updated",
      attribute: serializeAttribute(result.attribute),
    });
  } catch (error) {
    console.error("Attribute update error:", error);
    return NextResponse.json(
      { message: "Failed to update attribute" },
      { status: 500 }
    );
  }
}

// ============================================================
// DELETE: حذف اتریبیوت
// ============================================================
export async function DELETE(request, { params }) {
  try {
    const session = await auth();
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const result = await deleteAttributeDefinition(id);

    if (result.notFound) {
      return NextResponse.json(
        { message: "Attribute not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Attribute deleted (product values removed)",
    });
  } catch (error) {
    console.error("Attribute delete error:", error);
    return NextResponse.json(
      { message: "Failed to delete attribute" },
      { status: 500 }
    );
  }
}
