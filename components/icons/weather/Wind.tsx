"use client";

import WindLines from "../primitives/WindLines";

interface Props {
  size?: number;
}

export default function Wind({
  size = 64,
}: Props) {
  return (
    <div
      style={{
        transform: `scale(${size / 64})`,
        transformOrigin: "top left",
      }}
    >
      <WindLines />
    </div>
  );
}