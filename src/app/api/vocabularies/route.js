// src/app/api/vocabularies/route.js
// ============================================================
// واژگان کنترل‌شده برای فرم‌ها (عمومی، فقط خواندنی)
//
// فرم‌های ثبت محصول/درخواست/پروفایل از این استفاده می‌کنند تا
// به‌جای input متنی آزاد، dropdown داشته باشند. این کار باعث
// می‌شود فیلترها روی داده‌ی تمیز کار کنند.
// ============================================================
import { NextResponse } from "next/server";
import {
  getVocabularies,
  VOCABULARY_META,
  ensureVocabularies,
} from "@/lib/vocabularies";

export const revalidate = 60;

export async function GET() {
  try {
    // اگر تنظیمات وجود ندارد، مقادیر پیش‌فرض را یک‌بار بنویس
    await ensureVocabularies();

    const vocab = await getVocabularies();

    return NextResponse.json({
      vocabularies: vocab, // { incoterms: [{value,label}], ... }
      meta: VOCABULARY_META,
    });
  } catch (error) {
    console.error("Public vocabularies error:", error);
    return NextResponse.json(
      { message: "Failed to load vocabularies" },
      { status: 500 }
    );
  }
}
