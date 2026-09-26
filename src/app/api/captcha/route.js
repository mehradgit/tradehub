// src/app/api/captcha/route.js
import { NextResponse } from "next/server";
import { generateCaptcha } from "@/lib/captcha";

export async function GET() {
  const challenge = generateCaptcha();
  return NextResponse.json(challenge, {
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}