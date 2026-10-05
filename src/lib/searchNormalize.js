// src/lib/searchNormalize.js
// ============================================================
// Text normalization + scoring for search — PURE
//
// The site is English-only, so this is deliberately simple:
// lowercase, turn punctuation into spaces, collapse whitespace.
//
// Why it matters: a first-time user should not have to guess the
// exact stored spelling. This makes "Grains & Cereals" match
// "grains cereals", "grains-cereals" and "GRAINS  CEREALS".
// ============================================================

export function normalizeForSearch(input) {
  if (input === null || input === undefined) return "";

  let out;
  try {
    out = String(input);
  } catch {
    return "";
  }

  return out
    // Anything that is not a letter or a digit becomes a space, so
    // "&", "-", "," and quotes can never block a match. Unicode-aware,
    // so accented letters (é, ü) survive instead of being stripped.
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    // collapse runs of whitespace (including tabs/newlines) into one space
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/**
 * Score how well an option matches the search query.
 * Higher = more relevant. Zero = no match.
 *
 * Both the query and the option text are expected to be already
 * normalized by normalizeForSearch().
 *
 * Priority:
 *   1000  exact name match
 *    600  name starts with the query
 *    350  name contains the query
 *    150  the full path contains the query
 *     90  every query word appears somewhere (order independent)
 */
export function scoreMatch({ name, path, query, words }) {
  if (!query) return 0;

  const n = normalizeForSearch(name);
  const p = normalizeForSearch(path);

  if (n === query) return 1000;
  if (n.startsWith(query)) return 600;
  if (n.includes(query)) return 350;
  if (p.includes(query)) return 150;

  // Multi-word queries: every word must appear, but not necessarily
  // in order ("organic honey" should still find "Honey, Organic").
  const hay = `${n} ${p}`;
  if (words.length > 1 && words.every((w) => hay.includes(w))) return 90;

  return 0;
}
