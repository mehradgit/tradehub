// src/components/requests/RequestGallery.js
"use client";

import { useState } from "react";

export default function RequestGallery({ mainImage, thumbnails }) {
  const [currentImage, setCurrentImage] = useState(mainImage);

  const allImages = [mainImage, ...thumbnails];

  return (
    <div className="request-gallery">
      <div
        className="request-image"
        style={{ backgroundImage: `url(${currentImage})` }}
      ></div>
      {allImages.length > 1 && (
        <div className="request-thumbnails">
          {allImages.map((img, index) => (
            <div
              key={index}
              className={`thumb ${index === 0 ? "active" : ""}`}
              style={{ backgroundImage: `url(${img})` }}
              onClick={() => setCurrentImage(img)}
            ></div>
          ))}
        </div>
      )}
    </div>
  );
}