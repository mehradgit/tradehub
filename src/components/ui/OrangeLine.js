// src/components/ui/OrangeLine.js
export default function OrangeLine({ className = "", width = "159.44", height = "1" }) {
  return (
    <svg
      className={className}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block" }}
    >
      Drop shadow filter
      {/* <defs>
        <filter id="orangeLineShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow
            dx="0"
            dy="0"
            stdDeviation="4"
            floodColor="#EA6A18"
            floodOpacity="0.56"
          />
        </filter>
      </defs> */}

      {/* Main line */}
      {/* <line
        x1="0"
        y1={parseFloat(height) / 2}
        x2={parseFloat(width)}
        y2={parseFloat(height) / 2}
        stroke="#F7C3A3"
        strokeWidth="1"
        filter="url(#orangeLineShadow)"
      /> */}
    </svg>
  );
}