// src/utils/uploadHelpers.js

/**
 * آپلود فایل با نمایش درصد پیشرفت
 * @param {File} file - فایل تصویر
 * @param {string} type - نوع فایل (profiles, products, etc.)
 * @param {function} onProgress - تابع برای دریافت درصد پیشرفت (۰ تا ۱۰۰)
 * @returns {Promise} - نتیجه آپلود
 */
export function uploadFileWithProgress(file, type, onProgress) {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", type);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/upload");

    // رویداد پیشرفت آپلود
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100);
        onProgress(percent);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          resolve(response);
        } catch (e) {
          reject(new Error("Invalid response from server"));
        }
      } else {
        try {
          const error = JSON.parse(xhr.responseText);
          reject(new Error(error.message || "Upload failed"));
        } catch (e) {
          reject(new Error(`Upload failed with status: ${xhr.status}`));
        }
      }
    };

    xhr.onerror = () => {
      reject(new Error("Network error occurred. Please check your connection."));
    };

    xhr.send(formData);
  });
}

/**
 * بررسی حجم فایل (به مگابایت)
 */
export function getFileSizeMB(file) {
  return file.size / (1024 * 1024);
}

/**
 * فرمت کردن حجم فایل برای نمایش
 */
export function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}