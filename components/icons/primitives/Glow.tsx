"use client";

import type { ReactNode } from "react";

interface Props {
  children: ReactNode;

  color?: string;

  size?: number;
}

export default function Glow({
  children,
  color = "#ffffff",
  size = 16,
}: Props) {

  return (
    <div
      style={{
        filter: `drop-shadow(0 0 ${size}px ${color})`,
      }}
    >
      {children}
    </div>
  );
}