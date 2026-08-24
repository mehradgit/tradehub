// src/components/requests/RequestGallery.js
"use client";

import { useState } from "react";

export default function RequestGallery({ mainImage, thumbnails, hasImages }) {
  const [currentImage, setCurrentImage] = useState(mainImage);

  return (
    <div className="request-gallery">
      {/* ====== تصویر اصلی یا پل‌هولدر ====== */}
      <div className="request-image-wrapper">
        {hasImages ? (
          <div
            className="request-image"
            style={{ backgroundImage: `url(${currentImage || mainImage})` }}
          ></div>
        ) : (
          <div className="request-image-placeholder">
            <div className="placeholder-content">
              <i className="fas fa-image fa-3x"></i>
              <p>No image available</p>
            </div>
          </div>
        )}
      </div>

      {/* ====== ریزتصاویر (فقط اگر عکس وجود داشته باشد) ====== */}
      {hasImages && thumbnails.length > 0 && (
        <div className="request-thumbnails">
          {[mainImage, ...thumbnails].map((img, index) => (
            <div
              key={index}
              className={`thumb ${img === currentImage ? "active" : ""}`}
              style={{ backgroundImage: `url(${img})` }}
              onClick={() => setCurrentImage(img)}
            />
          ))}
        </div>
      )}
    </div>
  );
}