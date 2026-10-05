// src/lib/captcha.js
import crypto from "crypto";

const SECRET = process.env.AUTH_SECRET || "captcha-fallback-secret";
const EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

function sign(payload) {
  return crypto.createHmac("sha256", SECRET).update(payload).digest("hex");
}

// Build a new challenge
export function generateCaptcha() {
  const a = Math.floor(Math.random() * 20) + 1;
  const b = Math.floor(Math.random() * 20) + 1;
  const sum = a + b;
  const expires = Date.now() + EXPIRY_MS;
  const payload = `${sum}.${expires}`;
  const signature = sign(payload);
  const token = `${payload}.${signature}`;

  return {
    question: `What is ${a} + ${b}?`,
    token,
  };
}

// Verify the user's answer
export function verifyCaptcha(answer, token) {
  if (!answer || !token) return false;

  const parts = String(token).split(".");
  if (parts.length !== 3) return false;

  const [sumStr, expiresStr, signature] = parts;
  const expectedSignature = sign(`${sumStr}.${expiresStr}`);

  if (signature !== expectedSignature) return false;

  const expires = parseInt(expiresStr, 10);
  if (!expires || Date.now() > expires) return false;

  return parseInt(answer, 10) === parseInt(sumStr, 10);
}