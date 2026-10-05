// src/utils/generateNumber.js
export function generateNumber() {
  // A random number between 1,000,000 and 9,999,999
  return Math.floor(Math.random() * 9000000) + 1000000;
}