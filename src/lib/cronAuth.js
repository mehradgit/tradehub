// src/lib/cronAuth.js
import { timingSafeEqual } from "crypto";

// ============================================================
// Authorizes calls to the cron endpoints
//
// Security rules (fail-closed):
//   1. If CRON_SECRET is not set, no request is authorized.
//      (Previously the check was skipped entirely and the endpoint became public.)
//   2. The secret is read only from headers, never from the query string,
//      because ?secret= is recorded in Nginx/Cloudflare access logs.
//   3. The comparison is performed in a timing-safe way.
//
// Accepted headers:
//   x-cron-secret: <secret>
//   Authorization: Bearer <secret>     <- for Vercel Cron and cloud services
// ============================================================
export function isAuthorizedCron(request) {
  const secret = process.env.CRON_SECRET;

  // ✅ fail-closed
  if (!secret) return false;

  const headers = request.headers;
  const provided =
    headers.get("x-cron-secret") ||
    (headers.get("authorization") || "").replace(/^Bearer\s+/i, "");

  if (!provided) return false;

  const a = Buffer.from(provided);
  const b = Buffer.from(secret);

  // timingSafeEqual throws when the lengths differ
  if (a.length !== b.length) return false;

  return timingSafeEqual(a, b);
}
