// src/components/ui/UploadProgress.js
export default function UploadProgress({ progress, label }) {
  if (!progress || progress === 0) return null;

  return (
    <div className="mt-2">
      <div className="d-flex justify-content-between small">
        <span className="text-muted">{label || "Uploading..."}</span>
        <span className="fw-semibold">{progress}%</span>
      </div>
      <div className="progress" style={{ height: "6px" }}>
        <div
          className="progress-bar progress-bar-striped progress-bar-animated"
          role="progressbar"
          style={{ width: `${progress}%` }}
          aria-valuenow={progress}
          aria-valuemin="0"
          aria-valuemax="100"
        />
      </div>
    </div>
  );
}