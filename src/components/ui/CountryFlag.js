// src/components/ui/CountryFlag.js
export default function CountryFlag({ countryCode, size = "20px", className = "" }) {
  if (!countryCode) {
    return <span className="text-muted small">—</span>;
  }

  // ✅ تبدیل به حروف کوچک (flag-icons از کدهای کوچک استفاده می‌کند)
  const code = countryCode.toLowerCase();

  return (
    <span
      className={`fi fi-${code} ${className}`}
      style={{
        display: "inline-block",
        width: size,
        height: size,
        borderRadius: "3px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        flexShrink: 0,
      }}
      title={countryCode.toUpperCase()}
    />
  );
}