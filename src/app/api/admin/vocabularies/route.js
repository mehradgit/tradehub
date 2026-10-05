// src/app/api/admin/vocabularies/route.js
// ============================================================
// Controlled vocabularies — admin panel API
//
// GET  : list of groups + display-order metadata
// PUT  : save one or more groups (values only)
//
// Important: saveVocabularies rewrites the whole Setting value and
// only puts the submitted keys inside it. So if "save a single card"
// sends just that one key, the other customized groups fall back to
// the defaults. That is why the current values are read here and
// merged with the admin input.
// ============================================================
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import {
  VOCABULARY_META,
  getVocabularies,
  saveVocabularies,
} from "@/lib/vocabularies";

const VALID_KEY_SET = new Set(VOCABULARY_META.map((v) => v.key));
const MAX_ITEMS = 200;
const MAX_ITEM_LENGTH = 120;

// ============================================================
// Build the output shape: [{ key, label, items: [{value,label}] }]
// ============================================================
function toGroups(all) {
  return VOCABULARY_META.map(({ key, label }) => ({
    key,
    label,
    items: Array.isArray(all?.[key]) ? all[key] : [],
  }));
}

async function readGroups() {
  const all = await getVocabularies();
  return toGroups(all);
}

// ============================================================
// Clean a list: trim, drop empties, cap length and count, remove duplicates
// A null return means the input was not an array.
// ============================================================
function cleanList(raw) {
  if (!Array.isArray(raw)) return null;

  const seen = new Set();
  const out = [];

  for (const item of raw) {
    let value = null;

    if (typeof item === "string") value = item;
    else if (item && typeof item === "object" && typeof item.value === "string")
      value = item.value;
    else continue;

    const trimmed = value.trim().slice(0, MAX_ITEM_LENGTH);
    if (!trimmed) continue;

    const dedupeKey = trimmed.toLowerCase();
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);

    out.push(trimmed);
    if (out.length >= MAX_ITEMS) break;
  }

  return out;
}

// ============================================================
// GET: read vocabularies
// ============================================================
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const groups = await readGroups();

    return NextResponse.json({ groups, meta: VOCABULARY_META });
  } catch (error) {
    console.error("Vocabularies fetch error:", error);
    return NextResponse.json(
      { message: "Failed to fetch vocabularies" },
      { status: 500 }
    );
  }
}

// ============================================================
// PUT: save group(s)
// body = { incoterms: ["FOB", ...], units: ["kg"], ... }
// ============================================================
export async function PUT(request) {
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

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        {
          message:
            "Body must be an object shaped like { vocabularyKey: string[] }",
        },
        { status: 400 }
      );
    }

    const keys = Object.keys(body);
    if (keys.length === 0) {
      return NextResponse.json(
        { message: "Nothing to save — send at least one vocabulary list" },
        { status: 400 }
      );
    }

    const unknown = keys.filter((k) => !VALID_KEY_SET.has(k));
    if (unknown.length > 0) {
      return NextResponse.json(
        { message: `Unknown vocabulary key(s): ${unknown.join(", ")}` },
        { status: 400 }
      );
    }

    const submitted = {};
    for (const key of keys) {
      const list = cleanList(body[key]);

      if (list === null) {
        return NextResponse.json(
          { message: `"${key}" must be an array of strings` },
          { status: 400 }
        );
      }

      // An empty list falls back to the built-in defaults in
      // saveVocabularies, so instead of silently restoring them we
      // return a clear error.
      if (list.length === 0) {
        return NextResponse.json(
          {
            message: `"${key}" cannot be saved empty — keep at least one item (an empty list falls back to the built-in defaults)`,
          },
          { status: 400 }
        );
      }

      submitted[key] = list;
    }

    // Merge with the current values so saving one card does not wipe the other groups
    const current = await getVocabularies();
    const merged = {};
    for (const { key } of VOCABULARY_META) {
      merged[key] = (current[key] || []).map((i) => i.value);
    }
    Object.assign(merged, submitted);

    await saveVocabularies(merged);

    const groups = await readGroups();

    const message =
      keys.length === 1
        ? `${
            VOCABULARY_META.find((v) => v.key === keys[0])?.label || keys[0]
          } saved`
        : `${keys.length} vocabulary lists saved`;

    return NextResponse.json({ message, groups });
  } catch (error) {
    console.error("Vocabularies save error:", error);
    return NextResponse.json(
      { message: "Failed to save vocabularies" },
      { status: 500 }
    );
  }
}
