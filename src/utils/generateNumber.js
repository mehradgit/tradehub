// src/utils/generateNumber.js
export function generateNumber() {
  // عددی تصادفی بین 1,000,000 و 9,999,999
  return Math.floor(Math.random() * 9000000) + 1000000;
}