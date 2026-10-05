export function getImageSrc(imageData) {
  if (!imageData) return null;
  // If it already has a prefix, return it as is
  if (imageData.startsWith('data:image')) {
    return imageData;
  }
  // If it starts with /9j/ (JPEG) or iVBOR (PNG), add the prefix
  if (imageData.startsWith('/9j/') || imageData.startsWith('iVBOR')) {
    return `data:image/jpeg;base64,${imageData}`;
  }
  // Otherwise, assume the data is complete
  return imageData;
}