// src/app/admin/attributes/page.js
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AttributeManager from "@/components/admin/AttributeManager";
import {
  ATTRIBUTE_DATA_TYPES,
  ATTRIBUTE_SCOPES,
  listAttributeDefinitions,
} from "@/lib/attributesService";
import { getCategories } from "@/lib/categoriesService";
import { buildCategoryTree } from "@/lib/categoryTree";

export const metadata = { title: "Product Attributes | Admin" };

export default async function AdminAttributesPage() {
  const session = await auth();
  if (!session?.user?.isAdmin) redirect("/dashboard");

  const [attributes, categories] = await Promise.all([
    listAttributeDefinitions({ includeInactive: true }),
    getCategories(),
  ]);

  const tree = buildCategoryTree(categories);

  // ===== سریال‌سازی: Date → ISO و ساخت شکل امن برای کلاینت =====
  const serialized = attributes.map((a) => ({
    id: a.id,
    key: a.key,
    label: a.label,
    labelFa: a.labelFa ?? null,
    dataType: a.dataType,
    unit: a.unit ?? null,
    options: Array.isArray(a.options)
      ? a.options
          .map((o) =>
            typeof o === "string"
              ? { value: o, label: o }
              : {
                  value: String(o?.value ?? ""),
                  label: String(o?.label ?? o?.value ?? ""),
                }
          )
          .filter((o) => o.value)
      : null,
    scope: a.scope,
    scopeId: a.scopeId ?? null,
    isFilterable: a.isFilterable !== false,
    isRequired: a.isRequired === true,
    showInCard: a.showInCard === true,
    sortOrder: a.sortOrder ?? 0,
    isActive: a.isActive !== false,
    createdAt: a.createdAt ? new Date(a.createdAt).toISOString() : null,
    updatedAt: a.updatedAt ? new Date(a.updatedAt).toISOString() : null,
  }));

  const activeCount = serialized.filter((a) => a.isActive).length;

  return (
    <>
      <AdminPageHeader
        title="Product Attributes"
        subtitle={`${serialized.length} definition(s) · ${activeCount} active · attributes defined here appear automatically in the storefront filters and product forms`}
      />
      <AttributeManager
        attributes={serialized}
        dataTypes={ATTRIBUTE_DATA_TYPES}
        scopes={ATTRIBUTE_SCOPES}
        tree={tree}
      />
    </>
  );
}
