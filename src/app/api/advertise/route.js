// src/app/api/advertise/route.js
import { NextResponse } from "next/server";
import { sendContactEmail } from "@/lib/email";
import { alertAdvertiseInquiry } from "@/lib/adminAlerts";

const ALLOWED_PLACEMENTS = [
  "Homepage — Hero banner",
  "Homepage — Sponsored cards",
  "Homepage — Service strip",
  "Product pages",
  "Buying request pages",
  "Supplier profile pages",
];

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      name,
      company,
      email,
      phone,
      country,
      placements,
      budget,
      message,
    } = body;

    if (
      !name?.trim() ||
      !company?.trim() ||
      !email?.trim() ||
      !message?.trim()
    ) {
      return NextResponse.json(
        { message: "Name, company, email and message are required" },
        { status: 400 }
      );
    }

    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { message: "Invalid email address" },
        { status: 400 }
      );
    }

    const validPlacements = Array.isArray(placements)
      ? placements.filter((p) => ALLOWED_PLACEMENTS.includes(p))
      : [];

    if (validPlacements.length === 0) {
      return NextResponse.json(
        { message: "Please select at least one advertising placement" },
        { status: 400 }
      );
    }

    const subject = `Advertising enquiry — ${company}`;
    const details = [
      `Name: ${name}`,
      `Company: ${company}`,
      `Email: ${email}`,
      phone?.trim() ? `Phone: ${phone}` : null,
      country?.trim() ? `Country: ${country}` : null,
      `Placements: ${validPlacements.join(", ")}`,
      budget?.trim() ? `Budget: ${budget}` : null,
      "",
      "Message:",
      message,
    ]
      .filter(Boolean)
      .join("\n");

    // Email to the admin (best effort — a failure never blocks the response)
    try {
      await sendContactEmail({ name, email, subject, message: details });
    } catch (emailError) {
      console.error("Advertise email failed:", emailError);
    }

    // Telegram alert (fire-and-forget)
    alertAdvertiseInquiry({
      name,
      company,
      email,
      phone: phone?.trim() || undefined,
      country: country?.trim() || undefined,
      placements: validPlacements,
      budget: budget || undefined,
      message: message?.slice(0, 200),
    });

    console.log("[Advertise]", { name, company, email });

    return NextResponse.json({
      message: "Thank you! Our advertising team will contact you shortly.",
    });
  } catch (error) {
    console.error("Advertise form error:", error);
    return NextResponse.json(
      { message: "Failed to send request" },
      { status: 500 }
    );
  }
}
