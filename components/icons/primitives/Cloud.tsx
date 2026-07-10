"use client";

import { useId } from "react";
import { Colors } from "@/design-system/tokens/colors";

interface Props {
  size?: number;
  className?: string;
}

export default function Cloud({
  size = 64,
  className = "",
}: Props) {
  const gradientId = useId();

  return (
    <g>
      <defs>

        <linearGradient
          id={gradientId}
          x1="50"
          y1="22"
          x2="50"
          y2="78"
          gradientUnits="userSpaceOnUse"
        >
          <stop
            offset="0%"
            stopColor={Colors.weather.cloudLight}
          />

          <stop
            offset="60%"
            stopColor={Colors.weather.cloudMid}
          />

          <stop
            offset="100%"
            stopColor={Colors.weather.cloudDark}
          />

        </linearGradient>

      </defs>

      {/* Main Cloud */}

      <path
        d="
        M24 60
        C18 60 14 56 14 50
        C14 43 20 38 27 38

        C30 28 39 22 50 22

        C59 22 67 27 71 34

        C73 33 76 32 79 32

        C88 32 94 39 94 48

        C94 58 87 64 77 64

        H27

        C25 64 24 62 24 60
        Z
        "
        fill={`url(#${gradientId})`}
      />

      {/* Top Highlight */}

      <path
        d="
        M30 40
        C38 32 47 29 58 30
        C65 31 72 35 77 41
        "
        stroke="rgba(255,255,255,.35)"
        strokeWidth="2.4"
        strokeLinecap="round"
      />

    </g>
  );
}