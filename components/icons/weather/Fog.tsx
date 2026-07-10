"use client";

import Cloud from "../primitives/Cloud";

export default function Fog({
  size = 64,
}: {
  size?: number;
}) {
  return <Cloud size={size} />;
}