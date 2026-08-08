export function getImageSrc(imageData) {
  if (!imageData) return null;
  // اگر پیشوند دارد، همان را برگردان
  if (imageData.startsWith('data:image')) {
    return imageData;
  }
  // اگر با /9j/ (JPEG) یا iVBOR (PNG) شروع می‌شود، پیشوند اضافه کن
  if (imageData.startsWith('/9j/') || imageData.startsWith('iVBOR')) {
    return `data:image/jpeg;base64,${imageData}`;
  }
  // در غیر این صورت، فرض کن داده کامل است
  return imageData;
}