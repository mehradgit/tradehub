// src/components/ui/Skeleton.js
export default function Skeleton({ className = "", variant = "text", width, height, style = {} }) {
  const baseStyle = {
    width: width || undefined,
    height: height || undefined,
    ...style,
  };

  return (
    <div className={`skeleton skeleton-${variant} ${className}`} style={baseStyle} />
  );
}

 