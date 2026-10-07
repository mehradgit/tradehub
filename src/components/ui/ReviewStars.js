"use client";

export default function ReviewStars({
  value = 0,
  size = 16,
  onChange,
  readOnly = false,
  showValue = false,
}) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 2,
        color: "#f5b544",
        fontSize: size,
      }}
    >
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= Math.round(value);
        const half =
          !filled && n - 0.5 <= value && value < n;

        return (
          <i
            key={n}
            className={`fa-star ${
              half ? "fa-solid fa-star-half-stroke" : filled ? "fa-solid" : "fa-regular"
            }`}
            onClick={!readOnly && onChange ? () => onChange(n) : undefined}
            style={{
              cursor: readOnly ? "default" : "pointer",
              transition: "transform 0.15s ease",
            }}
            onMouseEnter={(e) => {
              if (!readOnly) e.currentTarget.style.transform = "scale(1.15)";
            }}
            onMouseLeave={(e) => {
              if (!readOnly) e.currentTarget.style.transform = "scale(1)";
            }}
          />
        );
      })}
      {showValue && (
        <span
          style={{
            marginLeft: 6,
            color: "#0b1f18",
            fontWeight: 700,
            fontSize: size - 2,
          }}
        >
          {Number(value).toFixed(1)}
        </span>
      )}
    </span>
  );
}