// src/utils/imageCompress.js

/**
 * Compress an image using Canvas
 * @param {File} file - The image file
 * @param {number} maxWidth - Maximum width (default: 800)
 * @param {number} maxHeight - Maximum height (default: 600)
 * @param {number} quality - Output quality (0 to 1, default: 0.7)
 * @returns {Promise<string>} - Compressed Base64 data
 */
export function compressImage(file, maxWidth = 800, maxHeight = 600, quality = 0.7) {
  return new Promise((resolve, reject) => {
    // Check the file type
    if (!file || !file.type.startsWith("image/")) {
      reject(new Error("Invalid file type. Please select an image."));
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        // Create a Canvas for compression
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        // Calculate the new dimensions while keeping the aspect ratio
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to Base64 with the specified quality
        const dataUrl = canvas.toDataURL("image/jpeg", quality);
        resolve(dataUrl);
      };
      img.onerror = (err) => {
        reject(new Error("Failed to load image: " + err.message));
      };
    };
    reader.onerror = (err) => {
      reject(new Error("Failed to read file: " + err.message));
    };
  });
}

/**
 * Check the Base64 size (for client-side validation)
 * @param {string} base64String - Base64 data
 * @param {number} maxSizeKB - Maximum size in kilobytes
 * @returns {boolean} - Whether the size exceeds the allowed limit
 */
export function isBase64TooLarge(base64String, maxSizeKB = 500) {
  if (!base64String) return false;
  // Base64 length * 0.75 ≈ byte size
  const approxBytes = base64String.length * 0.75;
  const approxKB = approxBytes / 1024;
  return approxKB > maxSizeKB;
}