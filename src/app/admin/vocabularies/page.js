// src/app/admin/vocabularies/page.js
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import VocabularyManager from "@/components/admin/VocabularyManager";
import { VOCABULARY_META, getVocabularies } from "@/lib/vocabularies";

export const metadata = { title: "Vocabularies | Admin" };

export default async function AdminVocabulariesPage() {
  const session = await auth();
  if (!session?.user?.isAdmin) redirect("/dashboard");

  const all = await getVocabularies();

  // خروجی getVocabularies فقط رشته‌های ساده دارد، اما برای اطمینان
  // دقیقاً همان شکل قابل‌سریال‌سازی را به کلاینت می‌دهیم.
  const groups = VOCABULARY_META.map(({ key, label }) => ({
    key,
    label,
    items: (Array.isArray(all?.[key]) ? all[key] : []).map((i) => ({
      value: String(i.value),
      label: String(i.label || i.value),
    })),
  }));

  const totalItems = groups.reduce((sum, g) => sum + g.items.length, 0);

  return (
    <>
      <AdminPageHeader
        title="Controlled Vocabularies"
        subtitle={`${groups.length} lists · ${totalItems} values · these lists feed the search filters and the create forms`}
      />
      <VocabularyManager groups={groups} />
    </>
  );
}
