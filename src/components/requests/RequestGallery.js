// src/components/requests/RequestGallery.js
"use client";

import { useState } from "react";

export default function RequestGallery({ mainImage, thumbnails, hasImages }) {
  const allImages = hasImages ? [mainImage, ...thumbnails] : [];
  const [currentImage, setCurrentImage] = useState(mainImage);

  return (
    <>
      <div className="request-gallery">
        {hasImages ? (
          <>
            <div className="request-main-image-wrapper">
              <img
                src={currentImage || mainImage}
                alt="Request"
                className="request-main-image"
              />
            </div>

            {allImages.length > 1 && (
              <div className="request-thumbnails">
                {allImages.map((img, index) => (
                  <button
                    key={index}
                    type="button"
                    className={`request-thumb ${
                      img === currentImage ? "active" : ""
                    }`}
                    style={{ backgroundImage: `url(${img})` }}
                    onClick={() => setCurrentImage(img)}
                    aria-label={`View image ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="request-image-placeholder">
            <div className="placeholder-content">
              <i className="fas fa-image fa-3x"></i>
              <p>No image available</p>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .request-gallery {
          display: flex;
          flex-direction: column;
          gap: 14px;
          width: 100%;
          min-width: 0;
        }

        .request-main-image-wrapper {
          width: 100%;
          aspect-ratio: 3 / 2;
          border-radius: 14px;
          overflow: hidden;
          border: 1px solid #e8edf0;
          background: #f5f8f6;
          box-shadow: 0 4px 16px rgba(15, 23, 42, 0.05);
        }

        .request-main-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .request-thumbnails {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .request-thumb {
          width: 70px;
          height: 70px;
          border-radius: 10px;
          background-size: cover;
          background-position: center;
          cursor: pointer;
          border: 2px solid transparent;
          transition: all 0.2s ease;
          padding: 0;
          outline: none;
          background-color: #f5f8f6;
        }

        .request-thumb:hover {
          border-color: #5dc888;
          transform: scale(1.03);
        }

        .request-thumb.active {
          border-color: #13795b;
          box-shadow: 0 4px 14px rgba(19, 121, 91, 0.25);
        }

        .request-image-placeholder {
          width: 100%;
          aspect-ratio: 3 / 2;
          background: #f9fbfa;
          border: 2px dashed #e0e6e3;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #94a3b8;
        }

        .request-image-placeholder .placeholder-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }

        .request-image-placeholder .placeholder-content i {
          opacity: 0.4;
        }

        .request-image-placeholder .placeholder-content p {
          font-size: 13px;
          font-weight: 600;
          margin: 0;
          color: #94a3b8;
        }

        /* ============================================================
           Responsive
           ============================================================ */
        @media (max-width: 992px) {
          .request-main-image-wrapper,
          .request-image-placeholder {
            max-width: 560px;
            margin: 0 auto;
          }

          .request-thumbnails {
            justify-content: center;
          }
        }

        @media (max-width: 500px) {
          .request-gallery {
            gap: 10px;
          }

          .request-thumb {
            width: 56px;
            height: 56px;
            border-radius: 8px;
          }
        }
      `}</style>
    </>
  );
}