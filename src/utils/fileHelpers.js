import { unlink } from "fs/promises";
import path from "path";

export async function deleteFile(filePath) {
  if (!filePath || !filePath.startsWith("/uploads/")) return;
  const fullPath = path.join(process.cwd(), "public", filePath);
  try {
    await unlink(fullPath);
  } catch (err) {
    console.error("Failed to delete file:", err);
  }
}