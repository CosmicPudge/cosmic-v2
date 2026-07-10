"use client";

import "@/styles/animations/weather.css";

export default function WindLines() {
  return (
    <g>
      <path
        d="M5 12 C18 12 18 6 30 6"
        stroke="#D6E9FF"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />

      <path
        d="M12 20 C26 20 26 14 42 14"
        stroke="#D6E9FF"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />

      <path
        d="M3 30 C18 30 18 24 36 24"
        stroke="#D6E9FF"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
    </g>
  );
}