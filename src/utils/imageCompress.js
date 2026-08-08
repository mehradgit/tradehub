// src/utils/imageCompress.js

/**
 * فشرده‌سازی تصویر با استفاده از Canvas
 * @param {File} file - فایل تصویر
 * @param {number} maxWidth - حداکثر عرض (پیش‌فرض: 800)
 * @param {number} maxHeight - حداکثر ارتفاع (پیش‌فرض: 600)
 * @param {number} quality - کیفیت خروجی (۰ تا ۱، پیش‌فرض: ۰.۷)
 * @returns {Promise<string>} - داده Base64 فشرده‌شده
 */
export function compressImage(file, maxWidth = 800, maxHeight = 600, quality = 0.7) {
  return new Promise((resolve, reject) => {
    // بررسی نوع فایل
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
        // ایجاد Canvas برای فشرده‌سازی
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        // محاسبه ابعاد جدید با حفظ نسبت
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

        // تبدیل به Base64 با کیفیت مشخص
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
 * بررسی حجم Base64 (برای اعتبارسنجی در سمت کلاینت)
 * @param {string} base64String - داده Base64
 * @param {number} maxSizeKB - حداکثر حجم به کیلوبایت
 * @returns {boolean} - آیا حجم بیش از حد مجاز است؟
 */
export function isBase64TooLarge(base64String, maxSizeKB = 500) {
  if (!base64String) return false;
  // Base64 length * 0.75 ≈ byte size
  const approxBytes = base64String.length * 0.75;
  const approxKB = approxBytes / 1024;
  return approxKB > maxSizeKB;
}