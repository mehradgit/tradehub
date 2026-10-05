// src/app/api/vocabularies/route.js
// ============================================================
// Controlled vocabularies for forms (public, read-only)
//
// The product / request / profile forms use these to render
// dropdowns instead of free-text inputs. That keeps the
// filters working against clean data.
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
    // If the setting does not exist yet, write the defaults once
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
