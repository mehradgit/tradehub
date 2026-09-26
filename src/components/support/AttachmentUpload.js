// src/components/support/AttachmentUpload.js
"use client";

import { useRef, useState } from "react";
import { toast } from "react-toastify";
import UploadProgress from "@/components/ui/UploadProgress";
import { uploadFileWithProgress } from "@/utils/uploadHelpers";

export default function AttachmentUpload({
  attachments = [],
  onChange,
  maxFiles = 3,
  maxSizeMB = 5,
}) {
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFiles = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (attachments.length + files.length > maxFiles) {
      toast.warning(`Maximum ${maxFiles} files allowed`);
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      const uploaded = [];
      for (const file of files) {
        if (!file.type.startsWith("image/")) {
          toast.warning(`Skipping ${file.name}: only images allowed`);
          continue;
        }
        const sizeMB = file.size / (1024 * 1024);
        if (sizeMB > maxSizeMB) {
          toast.warning(
            `Skipping ${file.name}: exceeds ${maxSizeMB}MB limit`
          );
          continue;
        }

        const result = await uploadFileWithProgress(
          file,
          "tickets",
          (percent) => setProgress(percent)
        );

        uploaded.push({
          fileName: file.name,
          filePath: result.path,
          fileSize: file.size,
          fileType: file.type,
        });
      }

      if (uploaded.length > 0) {
        onChange([...attachments, ...uploaded]);
        toast.success(`${uploaded.length} file(s) uploaded`);
      }
    } catch (err) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploading(false);
      setProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeAttachment = (index) => {
    onChange(attachments.filter((_, i) => i !== index));
  };

  return (
    <div>
      <div
        className="image-upload-area"
        onClick={() => !uploading && fileInputRef.current.click()}
        style={{ padding: "20px", cursor: uploading ? "not-allowed" : "pointer" }}
      >
        <i className="fas fa-cloud-upload-alt"></i>
        <p style={{ marginBottom: 4, fontSize: 13 }}>
          {uploading ? "Uploading..." : "Click to upload screenshots"}
        </p>
        <div className="help-text" style={{ fontSize: 11 }}>
          Max {maxFiles} images · {maxSizeMB}MB each
        </div>
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: "none" }}
          multiple
          accept="image/*"
          onChange={handleFiles}
          disabled={uploading}
        />
      </div>

      <UploadProgress progress={progress} label="Uploading..." />

      {attachments.length > 0 && (
        <div className="d-flex flex-wrap gap-2 mt-2">
          {attachments.map((att, index) => (
            <div
              key={index}
              className="position-relative"
              style={{ width: 60, height: 60 }}
            >
              <img
                src={att.filePath}
                alt={att.fileName}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  borderRadius: 8,
                  border: "1px solid var(--gray-light)",
                }}
              />
              <button
                type="button"
                className="btn btn-danger btn-sm position-absolute top-0 end-0 rounded-circle p-0"
                style={{
                  width: 20,
                  height: 20,
                  fontSize: 10,
                  lineHeight: 1,
                }}
                onClick={() => removeAttachment(index)}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}