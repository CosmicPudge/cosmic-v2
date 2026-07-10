"use client";

import Cloud from "../primitives/Cloud";
import Lightning from "../primitives/Lightning";

interface Props {
  size?: number;
}

export default function Thunderstorm({
  size = 64,
}: Props) {
  return (
    <div
      className="relative"
      style={{
        width: size,
        height: size + 20,
      }}
    >
      <Cloud size={size} />

      <div
        className="absolute"
        style={{
          left: size / 2 - 8,
          top: size - 2,
        }}
      >
        <Lightning />
      </div>
    </div>
  );
}