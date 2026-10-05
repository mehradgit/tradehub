// src/components/ui/RichTextEditor.js
"use client";

import { useMemo, useCallback } from "react";
import dynamic from "next/dynamic";
import { toast } from "react-toastify";
import "react-quill-new/dist/quill.snow.css";

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });

export default function RichTextEditor({ value, onChange, placeholder, height = 200 }) {
  // ====== Toolbar modules (useMemo prevents rebuilding) ======
  const modules = useMemo(() => {
    // Image upload handler function
    const imageHandler = async () => {
      const input = document.createElement("input");
      input.setAttribute("type", "file");
      input.setAttribute("accept", "image/*");
      input.click();

      input.onchange = async () => {
        const file = input.files[0];
        if (!file) return;

        const sizeMB = file.size / (1024 * 1024);
        if (sizeMB > 2) {
          toast.error(`Image size (${sizeMB.toFixed(1)}MB) exceeds the 2MB limit.`);
          return;
        }

        try {
          // Compress the image (your existing code)
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = async (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = async () => {
              const canvas = document.createElement("canvas");
              let width = img.width;
              let height = img.height;
              const maxWidth = 800;
              const maxHeight = 800;

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
              const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.7);

              // Convert to a Blob for upload
              const response = await fetch(compressedDataUrl);
              const blob = await response.blob();
              const compressedFile = new File([blob], file.name, { type: "image/jpeg" });

              const formData = new FormData();
              formData.append("file", compressedFile);
              formData.append("type", "products");

              const uploadRes = await fetch("/api/upload", {
                method: "POST",
                body: formData,
              });

              const data = await uploadRes.json();
              if (!uploadRes.ok) throw new Error(data.message || "Upload failed");

              // Insert the image into the editor
              const quill = quillRef.current.getEditor();
              const range = quill.getSelection(true);
              quill.insertEmbed(range.index, "image", data.path);

              toast.success("Image uploaded successfully!");
            };
            img.onerror = () => toast.error("Failed to load image");
          };
        } catch (error) {
          toast.error(error.message || "Failed to upload image");
        }
      };
    };

    return {
      toolbar: {
        container: [
          [{ header: [1, 2, 3, 4, 5, 6, false] }],
          ["bold", "italic", "underline", "strike"],
          [{ list: "ordered" }, { list: "bullet" }],
          [{ color: [] }, { background: [] }],
          ["link", "image"],
          ["clean"],
        ],
        handlers: { image: imageHandler },
      },
    };
  }, []);

  const formats = useMemo(
    () => ["header", "bold", "italic", "underline", "strike", "list", "color", "background", "link", "image"],
    []
  );

  // ====== Stable onChange function ======
  const handleChange = useCallback(
    (content) => {
      onChange(content);
    },
    [onChange]
  );

  return (
    <div className="rich-text-editor">
      <ReactQuill
        theme="snow"
        value={value || ""} // ✅ always a string
        onChange={handleChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder || "Write your description here..."}
        style={{ height: height }}
      />
      <div className="text-muted small mt-2">
        <i className="fas fa-info-circle me-1"></i>
        Max image size: 2MB · Images will be automatically compressed
      </div>
      <style jsx>{`
        .rich-text-editor :global(.ql-editor) {
          min-height: ${height}px;
          font-size: 14px;
        }
        .rich-text-editor :global(.ql-toolbar) {
          border-radius: 8px 8px 0 0;
          background: #f9f7f4;
          border: 1px solid #e8e2da !important;
        }
        .rich-text-editor :global(.ql-container) {
          border-radius: 0 0 8px 8px;
          border: 1px solid #e8e2da !important;
          border-top: none !important;
          font-family: "Inter", sans-serif;
        }
      `}</style>
    </div>
  );
}