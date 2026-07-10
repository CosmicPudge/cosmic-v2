"use client";

import type { ReactNode } from "react";

interface Props {
  x?: number;
  y?: number;
  scale?: number;
  rotate?: number;
  children: ReactNode;
}

export default function Transform({
  x = 0,
  y = 0,
  scale = 1,
  rotate = 0,
  children,
}: Props) {
  return (
    <g
      transform={`
        translate(${x} ${y})
        rotate(${rotate} 50 50)
        scale(${scale})
      `}
    >
      {children}
    </g>
  );
}