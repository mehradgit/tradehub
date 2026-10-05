// src/utils/generateSlug.js
export function generateSlug(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '') // Remove disallowed characters
    .replace(/\s+/g, '_')         // Replace spaces with underscores
    .slice(0, 50);                // Length limit
}