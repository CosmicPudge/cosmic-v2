"use client";

import Sun from "../primitives/Sun";
import Cloud from "../primitives/Cloud";

interface Props {
  size?: number;
}

export default function PartlyCloudyDay({
  size = 64,
}: Props) {
  return (
    <div
      className="relative"
      style={{
        width: size,
        height: size,
      }}
    >
      <div
        className="absolute"
        style={{
          left: 0,
          top: 0,
          transform: "scale(.75)",
        }}
      >
        <Sun size={size} />
      </div>

      <div
        className="absolute"
        style={{
          right: 0,
          bottom: 0,
          transform: "scale(.78)",
        }}
      >
        <Cloud size={size} />
      </div>
    </div>
  );
}