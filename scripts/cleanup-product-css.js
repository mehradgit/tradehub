const fs = require("fs");
const path = "src/app/globals.css";
let css = fs.readFileSync(path, "utf8");

// لیست selectorهایی که باید حذف بشن (regex)
const selectorsToRemove = [
  // Product detail container & row
  /\.product-detail-container[\s\S]*?\{[\s\S]*?\n\}/g,
  /\.product-detail-row[\s\S]*?\{[\s\S]*?\n\}/g,
  /\.product-top-row[\s\S]*?\{[\s\S]*?\n\}/g,
  /\.product-detail\b[\s\S]*?\{[\s\S]*?\n\}/g,
  
  // Breadcrumb (product-specific)
  /\.product-breadcrumb[\s\S]*?\{[\s\S]*?\n\}/g,
  /\.breadcrumb-list[\s\S]*?\{[\s\S]*?\n\}/g,
  
  // Info wrapper
  /\.product-info-wrapper[\s\S]*?\{[\s\S]*?\n\}/g,
  /\.product-info-header[\s\S]*?\{[\s\S]*?\n\}/g,
  /\.product-info\b[\s\S]*?\{[\s\S]*?\n\}/g,
  /\.product-title[\s\S]*?\{[\s\S]*?\n\}/g,
  /\.product-meta[\s\S]*?\{[\s\S]*?\n\}/g,
  /\.product-date[\s\S]*?\{[\s\S]*?\n\}/g,
  /\.product-divider[\s\S]*?\{[\s\S]*?\n\}/g,
  /\.product-share-btn[\s\S]*?\{[\s\S]*?\n\}/g,
  /\.product-save-btn[\s\S]*?\{[\s\S]*?\n\}/g,
  /\.product-rating[\s\S]*?\{[\s\S]*?\n\}/g,
  /\.product-price-box[\s\S]*?\{[\s\S]*?\n\}/g,
  /\.product-price[\s\S]*?\{[\s\S]*?\n\}/g,
  /\.product-meta-grid[\s\S]*?\{[\s\S]*?\n\}/g,
  /\.product-description[\s\S]*?\{[\s\S]*?\n\}/g,
  /\.product-actions[\s\S]*?\{[\s\S]*?\n\}/g,
  /\.product-tabs\b[\s\S]*?\{[\s\S]*?\n\}/g,
  
  // Specs (product detail specific)
  /\.product-specs-grid[\s\S]*?\{[\s\S]*?\n\}/g,
  /\.product-specs-column[\s\S]*?\{[\s\S]*?\n\}/g,
  /\.product-specs-wrapper[\s\S]*?\{[\s\S]*?\n\}/g,
  /\.product-specs-row[\s\S]*?\{[\s\S]*?\n\}/g,
  /\.product-spec-item[\s\S]*?\{[\s\S]*?\n\}/g,
  /\.spec-label[\s\S]*?\{[\s\S]*?\n\}/g,
  /\.spec-value[\s\S]*?\{[\s\S]*?\n\}/g,
  /\.spec-currency[\s\S]*?\{[\s\S]*?\n\}/g,
  /\.spec-value-with-flag[\s\S]*?\{[\s\S]*?\n\}/g,
  /\.spec-flags[\s\S]*?\{[\s\S]*?\n\}/g,
  /\.spec-country-name[\s\S]*?\{[\s\S]*?\n\}/g,
  
  // Short description
  /\.product-description-short-content[\s\S]*?\{[\s\S]*?\n\}/g,
  /\.product-description-short[\s\S]*?\{[\s\S]*?\n\}/g,
  /\.show-full-description-link[\s\S]*?\{[\s\S]*?\n\}/g,
  
  // Bottom section
  /\.product-detail-bottom[\s\S]*?\{[\s\S]*?\n\}/g,
  /\.request-form-card[\s\S]*?\{[\s\S]*?\n\}/g,
  /\.request-form\b[\s\S]*?\{[\s\S]*?\n\}/g,
  /\.submit-btn[\s\S]*?\{[\s\S]*?\n\}/g,
  
  // Old supplier card (globals duplicate)
  /\.supplier-avatar[\s\S]*?\{[\s\S]*?\n\}/g,
  /\.supplier-details[\s\S]*?\{[\s\S]*?\n\}/g,
  /\.supplier-badge[\s\S]*?\{[\s\S]*?\n\}/g,
];

let removed = 0;
for (const regex of selectorsToRemove) {
  const before = css.length;
  css = css.replace(regex, "");
  if (css.length < before) removed++;
}

// حذف media queries خالی
css = css.replace(/@media[^{]+\{\s*\}/g, "");

// حذف خطوط خالی متوالی
css = css.replace(/\n{3,}/g, "\n\n");

fs.writeFileSync(path, css, "utf8");
console.log(`Removed ${removed} selector blocks`);
console.log(`Size: ${fs.statSync(path).size} bytes`);