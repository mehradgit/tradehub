// src/utils/uploadHelpers.js

/**
 * Upload a file while reporting the progress percentage
 * @param {File} file - Image file
 * @param {string} type - File type (profiles, products, etc.)
 * @param {function} onProgress - Callback receiving the progress percentage (0 to 100)
 * @param {string|null} purpose - Upload purpose for the profiles type:
 *                                  "logo" | "cover" | "gallery" | null
 * @returns {Promise} - Upload result
 */
export function uploadFileWithProgress(file, type, onProgress, purpose = null) {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", type);

    // ✅ Only meaningful for type="profiles"
    if (purpose) {
      formData.append("purpose", purpose);
    }

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/upload");

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

export function getFileSizeMB(file) {
  return file.size / (1024 * 1024);
}

export function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}