// scripts/strip-fa-fields.js
// ============================================================
// Remove every "name_fa" key from src/lib/categories.json
//
// The site is English-only, so this Persian category-name data is
// unused. Roughly a third of it was never even Persian — the first
// entries held English text in the _fa field, so the data was also
// inconsistent.
//
//   node scripts/strip-fa-fields.js --dry    # preview, writes nothing
//   node scripts/strip-fa-fields.js          # strips and rewrites
//
// A timestamped .bak backup is written before the file is replaced,
// and the file keeps its existing 2-space JSON formatting.
// ============================================================

const fs = require("fs");
const path = require("path");

const FILE = path.join(__dirname, "..", "src", "lib", "categories.json");
const DRY = process.argv.includes("--dry");

function main() {
  if (!fs.existsSync(FILE)) {
    console.error(`Not found: ${FILE}`);
    process.exitCode = 1;
    return;
  }

  let data;
  try {
    data = JSON.parse(fs.readFileSync(FILE, "utf8"));
  } catch (err) {
    console.error("Could not parse categories.json:", err.message);
    process.exitCode = 1;
    return;
  }

  // ---- strip name_fa from categories and subcategories ----
  let removed = 0;
  const details = [];

  for (const c of data.categories || []) {
    if (Object.prototype.hasOwnProperty.call(c, "name_fa")) {
      details.push(`  category  ${c.slug || c.id}`);
      delete c.name_fa;
      removed += 1;
    }
    for (const s of c.subcategories || []) {
      if (Object.prototype.hasOwnProperty.call(s, "name_fa")) {
        details.push(`  sub       ${s.slug || s.id}`);
        delete s.name_fa;
        removed += 1;
      }
    }
  }

  // ---- report anything else ending in _fa (safety net) ----
  const leftover = [];
  (function walk(node, where) {
    if (Array.isArray(node)) {
      node.forEach((n, i) => walk(n, `${where}[${i}]`));
      return;
    }
    if (node && typeof node === "object") {
      for (const [k, v] of Object.entries(node)) {
        if (/_fa$/.test(k)) leftover.push(`${where}.${k}`);
        walk(v, `${where}.${k}`);
      }
    }
  })(data, "categories.json");

  console.log(
    `\n${DRY ? "DRY RUN — nothing will be written" : "Stripping Persian fields"}\n`
  );
  console.log(`  "name_fa" keys found : ${removed}`);
  if (removed <= 12) {
    console.log(details.join("\n"));
  }
  console.log(`  other *_fa keys      : ${leftover.length}`);
  if (leftover.length) console.log("    " + leftover.slice(0, 20).join("\n    "));

  if (DRY) {
    console.log("\nRun again without --dry to apply.\n");
    return;
  }

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backup = `${FILE}.${stamp}.bak`;

  try {
    fs.copyFileSync(FILE, backup);
    fs.writeFileSync(FILE, JSON.stringify(data, null, 2) + "\n", "utf8");
  } catch (err) {
    console.error("Write failed:", err.message);
    process.exitCode = 1;
    return;
  }

  console.log(`\n✅ Wrote ${FILE}`);
  console.log(`   Backup: ${backup}\n`);
}

main();
