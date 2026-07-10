"use client";

import Cloud from "../primitives/Cloud";
import Snowflake from "../primitives/Snowflake";

interface Props {
  size?: number;
}

export default function Snow({
  size = 64,
}: Props) {
  return (
    <div
      className="relative"
      style={{
        width: size,
        height: size + 22,
      }}
    >
      <Cloud size={size} />

      <div
        className="absolute flex gap-2"
        style={{
          left: 15,
          top: size - 4,
        }}
      >
        <Snowflake />

        <Snowflake delay={0.5} />

        <Snowflake delay={1} />
      </div>
    </div>
  );
}