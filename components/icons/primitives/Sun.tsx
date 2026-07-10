"use client";

import { Colors } from "@/design-system/tokens/colors";

interface Props {
  size?: number;
  className?: string;
}

export default function Sun({
  size = 64,
  className = "",
}: Props) {
  const CENTER = 50;

  const CORE_RADIUS = 19;

  const RAY_COUNT = 12;

  const RAY_INNER = 28;

  const RAY_OUTER = 14;

  const RAY_WIDTH = 4;

  const rays = Array.from({
    length: RAY_COUNT,
  });

  return (
    <g>
      <defs>

        <radialGradient
          id="cosmicSunGradient"
          cx="50%"
          cy="50%"
          r="50%"
        >
          <stop
            offset="0%"
            stopColor={Colors.weather.sunInner}
          />

          <stop
            offset="65%"
            stopColor={Colors.weather.sunMiddle}
          />

          <stop
            offset="100%"
            stopColor={Colors.weather.sunOuter}
          />
        </radialGradient>

      </defs>

      {rays.map((_, index) => {
        const angle = index * 30;

        return (
          <line
            key={index}
            x1="50"
            y1="12"
            x2="50"
            y2="22"
            stroke={Colors.weather.sunRay}
            strokeWidth="4"
            strokeLinecap="round"
            transform={`rotate(${angle} 50 50)`}
          />
        );
      })}

      <circle
        cx={CENTER}
        cy={CENTER}
        r={CORE_RADIUS}
        fill="url(#cosmicSunGradient)"
      />
    </g>
  );
}