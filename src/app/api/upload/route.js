// src/app/api/upload/route.js
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import sharp from "sharp";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  getUserActivePlan,
  canAddProductImage,
  canAddRequestImage,
} from "@/lib/planService";

export async function POST(request) {
  try {
    const session = await auth();
    if (!session) {
      return new Response(
        JSON.stringify({ message: "Unauthorized" }),
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const type = formData.get("type") || "profiles";
    const purpose = formData.get("purpose"); // "logo" | "cover" | "gallery" | null
    const targetId = formData.get("targetId");

    if (!file) {
      return new Response(
        JSON.stringify({ message: "No file uploaded" }),
        { status: 400 }
      );
    }

    // ===== انواع مجاز =====
    const allowedTypes = ["profiles", "products", "requests", "tickets"];
    if (!allowedTypes.includes(type)) {
      return new Response(
        JSON.stringify({ message: "Invalid upload type" }),
        { status: 400 }
      );
    }

    // ===== اعتبارسنجی نوع فایل =====
    if (!file.type.startsWith("image/")) {
      return new Response(
        JSON.stringify({ message: "File must be an image" }),
        { status: 400 }
      );
    }

    // ===== محدودیت حجم بر اساس نوع =====
    const maxSize = type === "tickets" ? 5 * 1024 * 1024 : 3 * 1024 * 1024;
    if (file.size > maxSize) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      const limitMB = (maxSize / (1024 * 1024)).toFixed(0);
      return new Response(
        JSON.stringify({
          message: `File size (${sizeMB}MB) exceeds the ${limitMB}MB limit`,
        }),
        { status: 400 }
      );
    }

    // ============================================================
    // ✅ بررسی محدودیت‌های پلن (فقط برای products و requests)
    // ============================================================
    const { plan } = await getUserActivePlan(session.user.id);

    if (type === "products" && targetId) {
      const canAdd = await canAddProductImage(targetId, plan);
      if (!canAdd) {
        return new Response(
          JSON.stringify({
            message: `You have reached the image limit per product (${plan.maxImagesPerProduct}).`,
          }),
          { status: 403 }
        );
      }
    } else if (type === "requests" && targetId) {
      const canAdd = await canAddRequestImage(targetId, plan);
      if (!canAdd) {
        return new Response(
          JSON.stringify({
            message: `You have reached the image limit per request (${plan.maxImagesPerRequest}).`,
          }),
          { status: 403 }
        );
      }
    }
    // ⚠️ برای type === "profiles" هیچ چکی اینجا نمی‌کنیم.
    //    چرا؟ چون کاربر ممکنه عکسی رو حذف کرده باشه ولی هنوز Save نکرده باشه.
    //    چک نهایی در PUT /api/user/update-profile انجام می‌شه.

    // ============================================================
    // پردازش تصویر
    // ============================================================
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    let maxWidth = 800;
    let maxHeight = 800;
    let quality = 75;

    if (type === "profiles") {
      maxWidth = 400;
      maxHeight = 400;
      quality = 80;
    } else if (type === "tickets") {
      maxWidth = 1200;
      maxHeight = 1200;
      quality = 80;
    }

    const processedBuffer = await sharp(buffer)
      .resize(maxWidth, maxHeight, { fit: "inside", withoutEnlargement: true })
      .jpeg({ quality, progressive: true })
      .toBuffer();

    const ext = "jpg";
    const filename = `${randomUUID()}.${ext}`;

    const uploadDir = path.join(process.cwd(), "public", "uploads", type);
    const filePath = path.join(uploadDir, filename);

    await mkdir(uploadDir, { recursive: true });
    await writeFile(filePath, processedBuffer);

    const relativePath = `/uploads/${type}/${filename}`;

    return new Response(
      JSON.stringify({
        message: "File uploaded successfully",
        path: relativePath,
        originalSize: buffer.length,
        compressedSize: processedBuffer.length,
        saved:
          ((1 - processedBuffer.length / buffer.length) * 100).toFixed(1) +
          "%",
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Upload error:", error);
    return new Response(
      JSON.stringify({ message: "Failed to upload file" }),
      { status: 500 }
    );
  }
}