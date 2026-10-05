// src/app/api/admin/maintenance/normalize-vocabularies/route.js
// ============================================================
// Normalise legacy vocabulary values in existing rows
//
// The old forms stored a "display string":
//     shippingTerms = "FOB (Free On Board)"
//     paymentTerms  = "T/T"
// while the new forms store the canonical vocabulary value:
//     "FOB", "T/T in advance"
//
// The storefront filters use contains, so some filters do not
// find the old rows ("T/T in advance" ≠ "T/T").
// This endpoint converts the old values to the canonical value.
//
// Input (optional, JSON):
//   { dryRun: true|false, only: "both" | "requests" | "products" }
//   Defaults: dryRun = true  and  only = "both"
//   so even a careless call does not change any data.
//
// Output:
//   { message, dryRun, durationMs, vocabularies: { incoterms: 12, ... },
//     requests: { scanned, changed, unmatched, samples },
//     products: { scanned, changed, unmatched, samples } }
//
//   scanned   → number of rows read
//   changed   → number of rows where (at least) one field is/was changed
//   unmatched → number of values that did not match (left untouched)
//   samples   → at most 50 samples; after === null means unmatched and
//               the previous value was kept
//
// No value is deleted or emptied; unknown values stay exactly as they
// are and are only reported.
// ============================================================
export const maxDuration = 300;

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import {
  VOCABULARY_ALIASES,
  ensureVocabularies,
  getVocabularies,
  normalizeCsvValue,
  normalizeVocabularyValue,
} from "@/lib/vocabularies";

// Size of each batch — keeps memory and the event loop free
const BATCH_SIZE = 200;

// Maximum number of samples reported per model
const MAX_SAMPLES = 50;

// ============================================================
// Fields to inspect
// ============================================================
const REQUEST_FIELDS = [
  { field: "shippingTerms", vocabulary: "incoterms", multi: false },
  { field: "paymentTerms", vocabulary: "paymentTerms", multi: false },
  { field: "certifications", vocabulary: "certifications", multi: true },
  { field: "packagingReq", vocabulary: "packagingTypes", multi: true },
];

const PRODUCT_FIELDS = [
  { field: "shippingTerms", vocabulary: "incoterms", multi: false },
  { field: "paymentTerms", vocabulary: "paymentTerms", multi: false },
  { field: "certifications", vocabulary: "certifications", multi: true },
  { field: "packaging", vocabulary: "packagingTypes", multi: true },
];

// ============================================================
// Parse the input
// ============================================================

// Only an explicit false enables a real run; anything else is a dry run
function parseDryRun(raw) {
  const explicitApply =
    raw === false || raw === 0 || raw === "false" || raw === "0";

  return !explicitApply;
}

function parseOnly(raw) {
  const value = typeof raw === "string" ? raw.trim() : "";

  if (value === "requests" || value === "products" || value === "both") {
    return value;
  }

  return "both";
}

// ============================================================
// Internal helpers
// ============================================================

// Does the string contain a top-level comma (outside parentheses)?
// "CIF (Cost, Insurance, Freight)" → no
// "FOB (Free On Board), CIF"       → yes (several values in a single-value field)
function hasTopLevelComma(text) {
  let depth = 0;

  for (const ch of text) {
    if (ch === "(") depth += 1;
    else if (ch === ")") {
      if (depth > 0) depth -= 1;
    } else if (ch === "," && depth === 0) {
      return true;
    }
  }

  return false;
}

// Reconciles the alias table against the live vocabularies: any alias whose
// target is no longer in the vocabularies is dropped, so an invalid value is
// never written.
function buildLiveAliases(vocabularies) {
  const live = {};

  for (const [key, table] of Object.entries(VOCABULARY_ALIASES)) {
    const options = Array.isArray(vocabularies?.[key]) ? vocabularies[key] : [];
    const byValue = new Map();

    for (const opt of options) {
      const value =
        opt && typeof opt === "object" ? opt.value : opt;
      const text = String(value ?? "").trim();
      if (text) byValue.set(text.toLowerCase(), text);
    }

    const kept = {};
    for (const [alias, target] of Object.entries(table || {})) {
      const canonical = byValue.get(String(target ?? "").trim().toLowerCase());
      if (canonical) kept[alias] = canonical;
    }

    live[key] = kept;
  }

  return live;
}

function addSample(summary, sample) {
  if (summary.samples.length >= MAX_SAMPLES) return;
  summary.samples.push(sample);
}

// ============================================================
// Walk one model in batches of 200
//
// The loop is driven by a stable cursor: orderBy: { id: "asc" } and skip.
// Because no row is deleted or added (only updates, and those happen after
// the walk), the order stays stable and the loop is guaranteed to finish:
// as soon as a batch is smaller than BATCH_SIZE, we are done.
// ============================================================
async function normalizeModel({ model, fields, vocabularies, aliases, dryRun }) {
  const summary = { scanned: 0, changed: 0, unmatched: 0, samples: [] };
  const pending = []; // rows that need to be updated

  const select = { id: true };
  for (const def of fields) select[def.field] = true;

  let skip = 0;

  while (true) {
    let batch;

    try {
      batch = await prisma[model].findMany({
        select,
        orderBy: { id: "asc" },
        skip,
        take: BATCH_SIZE,
      });
    } catch (err) {
      console.error(
        `[normalize-vocabularies] ${model} batch read failed:`,
        err?.message || err
      );
      break;
    }

    if (!batch || batch.length === 0) break;

    for (const row of batch) {
      summary.scanned += 1;

      const data = {};

      for (const def of fields) {
        const raw = row[def.field];

        // Empty/missing field → skip
        if (raw === null || raw === undefined) continue;
        const stored = String(raw);
        if (!stored.trim()) continue;

        const options = vocabularies[def.vocabulary] || [];
        const table = aliases[def.vocabulary] || null;

        // ===== Multi-value field (CSV) =====
        if (def.multi) {
          const outcome = normalizeCsvValue(stored, options, table);

          for (const item of outcome.unmatched) {
            summary.unmatched += 1;
            addSample(summary, {
              id: row.id,
              field: def.field,
              before: item,
              after: null, // left untouched
            });
          }

          // A "change" only counts when the normalised string differs from the stored value
          if (!outcome.value || outcome.value === stored) continue;

          data[def.field] = outcome.value;
          addSample(summary, {
            id: row.id,
            field: def.field,
            before: stored,
            after: outcome.value,
          });
          continue;
        }

        // ===== Single-value field =====
        // If several values are separated by commas we do not guess and we
        // leave it alone, so nothing is lost (for example "FOB (Free On Board), CIF").
        if (hasTopLevelComma(stored)) {
          summary.unmatched += 1;
          addSample(summary, {
            id: row.id,
            field: def.field,
            before: stored,
            after: null,
          });
          continue;
        }

        const normalized = normalizeVocabularyValue(stored, options, table);

        if (!normalized) {
          summary.unmatched += 1;
          addSample(summary, {
            id: row.id,
            field: def.field,
            before: stored,
            after: null,
          });
          continue;
        }

        if (normalized === stored) continue;

        data[def.field] = normalized;
        addSample(summary, {
          id: row.id,
          field: def.field,
          before: stored,
          after: normalized,
        });
      }

      if (Object.keys(data).length > 0) {
        summary.changed += 1;
        pending.push({ id: row.id, data });
      }
    }

    // Done: a partial batch means this was the last page
    if (batch.length < BATCH_SIZE) break;

    skip += batch.length;
  }

  // ===== Write (only when this is not a dry run) =====
  // Row by row, so one broken row does not stop the whole run.
  let failed = 0;

  if (!dryRun) {
    for (const item of pending) {
      try {
        await prisma[model].update({
          where: { id: item.id },
          data: item.data,
        });
      } catch (err) {
        failed += 1;
        console.error(
          `[normalize-vocabularies] ${model} update failed (${item.id}):`,
          err?.message || err
        );
      }
    }
  }

  return { summary, failed };
}

// ============================================================
// POST — preview (default) or a real run
// ============================================================
export async function POST(request) {
  const startedAt = Date.now();

  try {
    // ====== Admin access ======
    const session = await auth();
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // ====== Input (the body is optional) ======
    let body = null;
    try {
      body = await request.json();
    } catch {
      // Empty or invalid body → use the defaults
      body = null;
    }

    const dryRun = parseDryRun(body?.dryRun);
    const only = parseOnly(body?.only);
    const doRequests = only === "both" || only === "requests";
    const doProducts = only === "both" || only === "products";

    // ====== Read the vocabularies once ======
    await ensureVocabularies();
    const vocabularies = await getVocabularies();

    const vocabularyCounts = {};
    for (const [key, options] of Object.entries(vocabularies || {})) {
      vocabularyCounts[key] = Array.isArray(options) ? options.length : 0;
    }

    // Only the aliases whose target exists in the live vocabularies
    const aliases = buildLiveAliases(vocabularies);

    const requests = { scanned: 0, changed: 0, unmatched: 0, samples: [] };
    const products = { scanned: 0, changed: 0, unmatched: 0, samples: [] };
    let failed = 0;

    if (doRequests) {
      const out = await normalizeModel({
        model: "buyingRequest",
        fields: REQUEST_FIELDS,
        vocabularies,
        aliases,
        dryRun,
      });
      requests.scanned = out.summary.scanned;
      requests.changed = out.summary.changed;
      requests.unmatched = out.summary.unmatched;
      requests.samples = out.summary.samples;
      failed += out.failed;
    }

    if (doProducts) {
      const out = await normalizeModel({
        model: "product",
        fields: PRODUCT_FIELDS,
        vocabularies,
        aliases,
        dryRun,
      });
      products.scanned = out.summary.scanned;
      products.changed = out.summary.changed;
      products.unmatched = out.summary.unmatched;
      products.samples = out.summary.samples;
      failed += out.failed;
    }

    const totalChanged = requests.changed + products.changed;
    const totalUnmatched = requests.unmatched + products.unmatched;

    let message = dryRun
      ? `Preview finished (dry run — nothing was written). ${totalChanged} row(s) can be normalised · ${totalUnmatched} unmatched value(s).`
      : `Normalisation applied. ${totalChanged} row(s) updated · ${totalUnmatched} unmatched value(s) left untouched.`;

    if (!dryRun && failed > 0) {
      message += ` ${failed} row(s) failed — check the server logs.`;
    }

    // ============================================================
    // Result
    // ============================================================
    return NextResponse.json({
      message,
      dryRun,
      durationMs: Date.now() - startedAt,
      vocabularies: vocabularyCounts,
      requests,
      products,
    });
  } catch (error) {
    // The internal message is not leaked in the response
    console.error("Normalize vocabularies error:", error);
    return NextResponse.json(
      { message: "Normalisation failed. Check server logs for details." },
      { status: 500 }
    );
  }
}
