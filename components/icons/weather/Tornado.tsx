"use client";

import Wind from "./Wind";

export default function Tornado({
  size = 64,
}: {
  size?: number;
}) {
  return <Wind size={size} />;
}