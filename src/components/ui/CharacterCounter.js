// src/components/ui/CharacterCounter.js
export default function CharacterCounter({ text, max, label }) {
  const current = text?.length || 0;
  const isOver = current > max;

  return (
    <div className={`text-end small mt-1 ${isOver ? "text-danger" : "text-muted"}`}>
      {label && <span className="me-1">{label}</span>}
      <span className={isOver ? "fw-bold" : ""}>
        {current}/{max}
      </span>
      {isOver && (
        <span className="text-danger ms-1">
          <i className="fas fa-exclamation-triangle"></i> Exceeded
        </span>
      )}
    </div>
  );
}