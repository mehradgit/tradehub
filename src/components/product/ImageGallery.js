// src/components/product/ImageGallery.js
"use client";

import { useState, useEffect } from "react";

export default function ImageGallery({ images, productName }) {
  // ====== نرمال‌سازی تصاویر ======
  const normalizeImages = (imgData) => {
    if (!imgData) return [];
    if (Array.isArray(imgData)) return imgData;
    if (typeof imgData === "object") {
      // اگر شیء با main و thumbnails است
      const result = [];
      if (imgData.main) result.push(imgData.main);
      if (Array.isArray(imgData.thumbnails)) {
        result.push(...imgData.thumbnails);
      }
      return result;
    }
    return [];
  };

  const allImages = normalizeImages(images);
  const [mainImage, setMainImage] = useState(allImages[0] || "https://placehold.co/360x360");
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const displayThumbnails = allImages.slice(0, 4);
  const hasMoreImages = allImages.length > 4;

  // وقتی تصویر اصلی تغییر می‌کند، ایندکس را به‌روز می‌کنیم
  useEffect(() => {
    const idx = allImages.indexOf(mainImage);
    if (idx !== -1) setCurrentIndex(idx);
  }, [mainImage, allImages]);

  // ====== باز کردن Lightbox ======
  const openLightbox = (index) => {
    if (allImages.length === 0) return;
    setCurrentIndex(Math.min(index, allImages.length - 1));
    setIsLightboxOpen(true);
    document.body.style.overflow = "hidden";
  };

  const closeLightbox = () => {
    setIsLightboxOpen(false);
    document.body.style.overflow = "auto";
  };

  // ====== رفتن به تصویر قبلی/بعدی ======
  const goToPrevious = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : allImages.length - 1));
  };

  const goToNext = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev < allImages.length - 1 ? prev + 1 : 0));
  };

  // ====== کیبورد ======
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isLightboxOpen) return;
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") goToPrevious(e);
      if (e.key === "ArrowRight") goToNext(e);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isLightboxOpen]);

  // ====== تابع تغییر تصویر اصلی ======
  const handleThumbnailClick = (img, index) => {
    setMainImage(img);
    setCurrentIndex(index);
  };

  // ====== کلیک روی تصویر اصلی ======
  const handleMainImageClick = () => {
    if (allImages.length > 0) openLightbox(currentIndex);
  };

  // ====== کلیک روی دکمه + بیشتر ======
  const handleMoreClick = () => {
    openLightbox(5);
  };

  if (allImages.length === 0) {
    return (
      <div className="product-gallery-wrapper">
        <div className="product-thumbnails">
          <div className="product-thumbnail-placeholder">
            <i className="fas fa-image"></i>
          </div>
        </div>
        <div className="product-main-image-placeholder">
          <i className="fas fa-image fa-3x"></i>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* ====== گالری اصلی ====== */}
      <div className="product-gallery-wrapper">
        <div className="product-thumbnails">
          {displayThumbnails.map((img, index) => (
            <img
              key={index}
              src={img}
              alt={`${productName} - ${index + 1}`}
              className={`product-thumbnail ${mainImage === img ? "active" : ""}`}
              onClick={() => handleThumbnailClick(img, index)}
            />
          ))}
          {hasMoreImages && (
            <div className="product-thumbnail-more" onClick={handleMoreClick}>
              <span>...</span>
            </div>
          )}
        </div>
        <img
          src={mainImage}
          alt={productName}
          className="product-main-image"
          onClick={handleMainImageClick}
          style={{ cursor: "pointer" }}
        />
      </div>

      {/* ====== Lightbox ====== */}
      {isLightboxOpen && (
        <div className="lightbox-overlay" onClick={closeLightbox}>
          <button className="lightbox-close" onClick={closeLightbox}>
            <i className="fas fa-times"></i>
          </button>

          <button className="lightbox-nav lightbox-prev" onClick={goToPrevious}>
            <i className="fas fa-chevron-left"></i>
          </button>

          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <img src={allImages[currentIndex]} alt={`${productName} - ${currentIndex + 1}`} />
            <div className="lightbox-counter">
              {currentIndex + 1} / {allImages.length}
            </div>
          </div>

          <button className="lightbox-nav lightbox-next" onClick={goToNext}>
            <i className="fas fa-chevron-right"></i>
          </button>
        </div>
      )}
    </>
  );
}