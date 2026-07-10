"use client";

import "@/styles/animations/weather.css";

export default function Lightning() {
  return (
    <svg
      width="18"
      height="24"
      viewBox="0 0 18 24"
      style={{
        animation:
          "cosmic-flash 6s infinite",
      }}
    >
      <polygon
        points="10,0 2,12 8,12 5,24 16,9 10,9"
        fill="#FFD54F"
      />
    </svg>
  );
}