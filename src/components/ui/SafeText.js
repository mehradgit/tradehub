// src/components/ui/SafeText.js
export default function SafeText({ text, className = "" }) {
  return (
    <span
      className={`safe-text ${className}`}
      data-text={String(text ?? "")}
      data-3cx-ignore="true"
      suppressHydrationWarning
    />
  );
}