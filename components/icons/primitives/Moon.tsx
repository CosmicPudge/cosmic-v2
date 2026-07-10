"use client";

import { useId } from "react";
import { Colors } from "@/design-system/tokens/colors";

interface Props {
  size?: number;
  className?: string;
}

export default function Moon({
  size = 64,
  className = "",
}: Props) {
  const gradientId = useId();

  return (
    <g>
      <defs>
        <radialGradient
          id={gradientId}
          cx="40%"
          cy="35%"
          r="70%"
        >
          <stop
            offset="0%"
            stopColor={Colors.weather.moonLight}
          />

          <stop
            offset="65%"
            stopColor={Colors.weather.moon}
          />

          <stop
            offset="100%"
            stopColor={Colors.weather.moonShadow}
          />
        </radialGradient>
      </defs>

      {/* Crescent */}

      <path
        d="
          M63 20
          C46 20 32 34 32 50
          C32 66 46 80 63 80

          C53 75 47 64 47 50
          C47 36 53 25 63 20
          Z
        "
        fill={`url(#${gradientId})`}
      />

      {/* Highlight */}

      <path
        d="
          M57 28
          C49 34 45 42 45 50
          C45 58 49 66 57 72
        "
        stroke="rgba(255,255,255,.35)"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </g>
  );
}