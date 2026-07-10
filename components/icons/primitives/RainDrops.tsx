"use client";

import { Colors } from "@/design-system/tokens/colors";

interface Props {
  size?: number;
  className?: string;
}

const DROPS = [
  { x: 36, y: 58, length: 12 },
  { x: 50, y: 62, length: 14 },
  { x: 64, y: 58, length: 12 },
];

export default function RainDrops({
  size = 64,
  className = "",
}: Props) {
  return (
    <g>
      {DROPS.map((drop, index) => (
        <line
          key={index}
          x1={drop.x}
          y1={drop.y}
          x2={drop.x}
          y2={drop.y + drop.length}
          stroke={Colors.weather.rain}
          strokeWidth="3"
          strokeLinecap="round"
        />
      ))}
    </g>
  );
}