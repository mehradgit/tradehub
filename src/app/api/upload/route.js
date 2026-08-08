// src/app/api/upload/route.js
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import sharp from "sharp";
import { auth } from "@/auth";

export async function POST(request) {
  try {
    const session = await auth();
    if (!session) {
      return new Response(JSON.stringify({ message: "Unauthorized" }), { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const type = formData.get("type") || "profiles";

    if (!file) {
      return new Response(JSON.stringify({ message: "No file uploaded" }), { status: 400 });
    }

    // ✅ اعتبارسنجی نوع فایل
    if (!file.type.startsWith("image/")) {
      return new Response(JSON.stringify({ message: "File must be an image" }), { status: 400 });
    }

    // ✅ محدودیت حجم: ۳ مگابایت (قبل از فشرده‌سازی)
    if (file.size > 3 * 1024 * 1024) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      return new Response(
        JSON.stringify({ message: `File size (${sizeMB}MB) exceeds the 3MB limit` }),
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // فشرده‌سازی با sharp
    const isProfile = type === "profiles";
    const maxWidth = isProfile ? 400 : 800;
    const maxHeight = isProfile ? 400 : 800;
    const quality = isProfile ? 80 : 75;

    let processedBuffer = await sharp(buffer)
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
        saved: ((1 - processedBuffer.length / buffer.length) * 100).toFixed(1) + "%",
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