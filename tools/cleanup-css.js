const fs = require('fs');
const path = 'src/app/globals.css';
const backup = 'src/app/globals.css.pre-cleanup';
let css = fs.readFileSync(path, 'utf8');
fs.copyFileSync(path, backup);

// Fix the malformed file header only; no visual effect intended.
css = css.replace(/^\/\* \/\* src\/app\/globals\.css\s*$/m, '/* src/app/globals.css */');

// Remove only exact duplicate blocks. The first occurrence is preserved and
// all declarations/order outside the duplicate block remain untouched.
const duplicateBlocks = [
  '.btn-danger:hover {\n  background-color: #c0392b !important;\n  border-color: #c0392b !important;\n}',
  '.request-card.wanted {\n  border-left-color: var(--secondary);\n}',
  '.section-more:hover {\n  gap: 10px;\n}',
  '.spec-table {\n  width: 100%;\n  border-collapse: collapse;\n  border-radius: var(--radius);\n  overflow: hidden;\n}',
  '@MEDIA_FORM_ROW_PLACEHOLDER',
  '.empty-state {\n  text-align: center;\n  padding: 60px 20px;\n}',
  '.empty-state i {\n  font-size: 48px;\n  color: var(--gray-light);\n  margin-bottom: 16px;\n}',
  '.empty-state h3 {\n  color: var(--gray);\n  margin-bottom: 8px;\n}',
  '.empty-state p {\n  color: var(--gray);\n  margin-bottom: 20px;\n}',
  '.product-thumbnails {\n  display: flex;\n  flex-direction: column;\n  gap: 10px;\n}',
  '.product-thumbnail.active {\n  opacity: 1;\n  border-color: #ea6a18;\n  box-shadow: 0px 5.806px 11.612px rgba(234, 106, 24, 0.3);\n}',
  '.product-thumbnail:hover {\n  opacity: 0.8;\n  transform: scale(1.05);\n}'
];

function removeSecondExact(block) {
  const first = css.indexOf(block);
  if (first < 0) return false;
  const second = css.indexOf(block, first + block.length);
  if (second < 0) return false;
  css = css.slice(0, second) + css.slice(second + block.length);
  return true;
}

let removed = 0;
for (const block of duplicateBlocks) {
  if (block === '@MEDIA_FORM_ROW_PLACEHOLDER') continue;
  if (removeSecondExact(block)) removed++;
}

// The duplicate form-row rule is scoped to the same media query. Remove only
// the second exact declaration block, retaining the media wrapper.
const formRow = '  .form-row {\n    grid-template-columns: 1fr;\n  }';
const firstForm = css.indexOf(formRow);
if (firstForm >= 0) {
  const secondForm = css.indexOf(formRow, firstForm + formRow.length);
  if (secondForm >= 0) {
    css = css.slice(0, secondForm) + css.slice(secondForm + formRow.length);
    removed++;
  }
}

fs.writeFileSync(path, css, 'utf8');
console.log(`Backup: ${backup}`);
console.log(`Exact duplicate blocks removed: ${removed}`);
console.log(`Before bytes: ${fs.statSync(backup).size}`);
console.log(`After bytes: ${fs.statSync(path).size}`);
