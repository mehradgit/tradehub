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

    // ===== Allowed types =====
    const allowedTypes = ["profiles", "products", "requests", "tickets"];
    if (!allowedTypes.includes(type)) {
      return new Response(
        JSON.stringify({ message: "Invalid upload type" }),
        { status: 400 }
      );
    }

    // ===== File type validation =====
    if (!file.type.startsWith("image/")) {
      return new Response(
        JSON.stringify({ message: "File must be an image" }),
        { status: 400 }
      );
    }

    // ===== Size limit based on the type =====
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
    // ✅ Check plan limits (only for products and requests)
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
    // ⚠️ For type === "profiles" we do not check anything here.
    //    Why? Because the user may have deleted an image but not saved yet.
    //    The final check happens in PUT /api/user/update-profile.

    // ============================================================
    // Image processing — WebP
    // (WebP is ~25-35% smaller than JPEG at the same quality;
    //  every upload is resized, then encoded with a quality
    //  ladder so the result stays near the size target.)
    // ============================================================
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Per-type dimensions and output-size targets
    const presets = {
      profiles: { max: 400, targetKB: 80 }, // logo / cover
      products: { max: 800, targetKB: 80 }, // gallery
      requests: { max: 800, targetKB: 80 },
      tickets: { max: 1200, targetKB: 150 }, // attachments
    };
    const preset = presets[type] || presets.products;

    const resizeOptions = { fit: "inside", withoutEnlargement: true };

    // Encode at q80; if still over the target, retry at q70 then q60
    let processedBuffer;
    for (const quality of [80, 70, 60]) {
      processedBuffer = await sharp(buffer)
        .resize(preset.max, preset.max, resizeOptions)
        .webp({ quality })
        .toBuffer();
      if (processedBuffer.length <= preset.targetKB * 1024) break;
    }

    const ext = "webp";
    const filename = `${randomUUID}.${ext}`;

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