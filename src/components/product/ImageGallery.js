// src/components/product/ImageGallery.js
"use client";

import { useState, useEffect } from "react";

export default function ImageGallery({ images, productName }) {
  // ====== Normalise the images ======
  const normalizeImages = (imgData) => {
    if (!imgData) return [];
    if (Array.isArray(imgData)) return imgData;
    if (typeof imgData === "object") {
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
  const [mainImage, setMainImage] = useState(
    allImages[0] || "https://placehold.co/360x360",
  );
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const displayThumbnails = allImages.slice(0, 4);
  const hasMoreImages = allImages.length > 4;

  // When the main image changes, keep the index in sync
  useEffect(() => {
    const idx = allImages.indexOf(mainImage);
    if (idx !== -1) setCurrentIndex(idx);
  }, [mainImage, allImages]);

  // ====== Open the Lightbox ======
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

  // ====== Previous/Next ======
  const goToPrevious = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : allImages.length - 1));
  };

  const goToNext = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev < allImages.length - 1 ? prev + 1 : 0));
  };

  // ====== Keyboard ======
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isLightboxOpen) return;
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") goToPrevious(e);
      if (e.key === "ArrowRight") goToNext(e);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLightboxOpen]);

  const handleThumbnailClick = (img, index) => {
    setMainImage(img);
    setCurrentIndex(index);
  };

  const handleMainImageClick = () => {
    if (allImages.length > 0) openLightbox(currentIndex);
  };

  const handleMoreClick = () => {
    // Open at the first image that is not shown as a thumbnail
    // (was a hardcoded 5, which overshot for products with few images).
    openLightbox(displayThumbnails.length);
  };

  // ====== No-image state ======
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
      {/* ====== Main gallery ====== */}
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
        />
      </div>

      {/* ====== Lightbox ====== */}
      {isLightboxOpen && (
        <div className="lightbox-overlay" onClick={closeLightbox}>
          <button className="lightbox-close" onClick={closeLightbox}>
            <i className="fas fa-times"></i>
          </button>

          <button
            className="lightbox-nav lightbox-prev"
            onClick={goToPrevious}
            aria-label="Previous"
          >
            <i className="fas fa-chevron-left"></i>
          </button>

          <div
            className="lightbox-content"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={allImages[currentIndex]}
              alt={`${productName} - ${currentIndex + 1}`}
            />
            <div className="lightbox-counter">
              {currentIndex + 1} / {allImages.length}
            </div>
          </div>

          <button
            className="lightbox-nav lightbox-next"
            onClick={goToNext}
            aria-label="Next"
          >
            <i className="fas fa-chevron-right"></i>
          </button>
        </div>
      )}

      {/* ====== Styles ====== */}
      <style jsx>{`
        /* ============================================================
           Gallery Wrapper
           ============================================================ */
        .product-gallery-wrapper {
          display: flex;
          gap: 10px;
          align-items: flex-start;
          justify-content: center;
          width: 100%;
          max-width: 100%;
          min-width: 0;
        }

        /* ============================================================
           Thumbnails
           ============================================================ */
        .product-thumbnails {
          display: flex;
          flex-direction: column;
          gap: 10px;
          flex-shrink: 0;
          width: 64px;
          max-height: none;
          /* Never scroll: the strip is capped at 4 thumbnails plus the
             "more" tile (see displayThumbnails), so its height is bounded
             and always fits without a scrollbar. */
          overflow: visible;   
          scrollbar-width: thin;
          padding: 2px 0;                   
        }

        .product-thumbnail {
          width: 64px;
          height: 64px;
          border-radius: 12px;
          border: 1.5px solid #f7c3a3;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
          object-fit: cover;
          opacity: 0.55;
          transition: all 0.25s ease;
          cursor: pointer;
          flex-shrink: 0;
          background: #f5f8f6;
          display: block;
        }

        .product-thumbnail:hover {
          opacity: 0.85;
        }

        .product-thumbnail.active {
          opacity: 1;
          border-color: #ea6a18;
          box-shadow: 0 4px 14px rgba(234, 106, 24, 0.36);
        }

        .product-thumbnail-more {
          width: 64px;
          height: 64px;
          border-radius: 12px;
          border: 1.5px dashed #f7c3a3;
          background: rgba(247, 195, 163, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          font-weight: 700;
          color: #ea6a18;
          flex-shrink: 0;
          cursor: pointer;
          transition: all 0.25s ease;
        }

        .product-thumbnail-more:hover {
          background: rgba(234, 106, 24, 0.12);
          border-color: #ea6a18;
          transform: scale(1.03);
        }

        .product-thumbnail-placeholder {
          width: 64px;
          height: 64px;
          border-radius: 12px;
          border: 1.5px dashed #e0e0e0;
          background: #f5f8f6;
          display: grid;
          place-items: center;
          color: #cbd5d1;
          font-size: 22px;
          flex-shrink: 0;
        }

        /* ============================================================
           Main Image
           ============================================================ */
        .product-main-image {
          flex: 1;
          width: 100%;
          max-width: 240px;
          aspect-ratio: 1 / 1;
          border-radius: 18px;
          border: 2px solid #f7c3a3;
          box-shadow: 0 6px 18px rgba(0, 0, 0, 0.12);
          object-fit: cover;
          cursor: pointer;
          background: #f5f8f6;
          display: block;
          transition: transform 0.3s ease;
        }

        .product-main-image:hover {
          transform: scale(1.01);
        }

        .product-main-image-placeholder {
          flex: 1;
          width: 100%;
          max-width: 240px;
          aspect-ratio: 1 / 1;
          border-radius: 18px;
          border: 2px dashed #e0e0e0;
          background: #f5f8f6;
          display: grid;
          place-items: center;
          color: #cbd5d1;
        }

        /* ============================================================
           Lightbox
           ============================================================ */
        .lightbox-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.92);
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: lightboxFadeIn 0.3s ease;
        }

        @keyframes lightboxFadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .lightbox-close {
          position: absolute;
          top: 20px;
          right: 30px;
          background: none;
          border: none;
          color: white;
          font-size: 36px;
          cursor: pointer;
          z-index: 10;
          transition: transform 0.3s ease;
          padding: 8px 12px;
        }

        .lightbox-close:hover {
          transform: rotate(90deg);
        }

        .lightbox-nav {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          background: rgba(255, 255, 255, 0.1);
          border: none;
          color: white;
          font-size: 28px;
          cursor: pointer;
          padding: 16px 20px;
          border-radius: 50%;
          transition: all 0.3s ease;
          z-index: 10;
        }

        .lightbox-nav:hover {
          background: rgba(255, 255, 255, 0.2);
        }

        .lightbox-prev {
          left: 20px;
        }

        .lightbox-next {
          right: 20px;
        }

        .lightbox-content {
          position: relative;
          max-width: 90vw;
          max-height: 90vh;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .lightbox-content img {
          max-width: 90vw;
          max-height: 85vh;
          object-fit: contain;
          border-radius: 8px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        }

        .lightbox-counter {
          position: absolute;
          bottom: -40px;
          left: 50%;
          transform: translateX(-50%);
          color: rgba(255, 255, 255, 0.7);
          font-size: 14px;
          font-weight: 500;
          font-family: "Poppins", sans-serif;
        }

        /* ============================================================
           Responsive
           ============================================================ */
        @media (max-width: 768px) {
          .product-gallery-wrapper {
            flex-direction: column-reverse;
            align-items: center;
            width: 100%;
            gap: 14px;
          }

          .product-thumbnails {
            flex-direction: row;
            width: 100%;
            max-height: none;
            max-width: 100%;
            flex-wrap: wrap;
            overflow: visible;
            padding-bottom: 4px;
            justify-content: center;
            scrollbar-width: thin;
          }

          .product-thumbnail,
          .product-thumbnail-more,
          .product-thumbnail-placeholder {
            width: 56px;
            height: 56px;
            flex-shrink: 0;
          }

          .product-main-image,
          .product-main-image-placeholder {
            max-width: 100%;
            width: 100%;
          }

          .lightbox-nav {
            padding: 10px 14px;
            font-size: 20px;
          }

          .lightbox-prev {
            left: 10px;
          }

          .lightbox-next {
            right: 10px;
          }

          .lightbox-content img {
            max-width: 95vw;
            max-height: 80vh;
          }
        }
      `}</style>
    </>
  );
}