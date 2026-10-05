// src/utils/generate.js
export function generateNumber() {
  // Random number between 1,000,000 and 9,999,999
  return Math.floor(Math.random() * 9000000) + 1000000;
}

export function generateSlug(text) {
  if (!text) return 'user';
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '_')
    .slice(0, 50);
}