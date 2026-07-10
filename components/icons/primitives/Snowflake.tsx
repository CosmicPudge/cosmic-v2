"use client";

import "@/styles/animations/weather.css";

interface Props {
  delay?: number;
}

export default function Snowflake({
  delay = 0,
}: Props) {
  return (
    <div
      style={{
        animation: "cosmic-snow 3s ease-in-out infinite",
        animationDelay: `${delay}s`,
      }}
    >
      <g>
        <path
          d="M12 2v20M4 7l16 10M20 7L4 17M2 12h20"
          stroke="#EAF6FF"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </g>
    </div>
  );
}