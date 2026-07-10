"use client";

import type { ReactNode } from "react";

interface Props {
  children: ReactNode;

  type?:
  | "none"
  | "float"
  | "spin"
  | "pulse"
  | "rain";

  duration?: number;

  className?: string;
}

export default function Motion({
  children,
  type = "none",
  duration,
  className = "",
}: Props) {

  const animations = {
  none: "",
  float: "cosmic-cloud-float",
  spin: "cosmic-sun-spin",
  pulse: "cosmic-sun-breathe",
  rain: "cosmic-rain-fall",
} as const;

  const animation = animations[type];

  return (
    <div
      className={className}
      style={{
        animation:
          animation
            ? `${animation} ${duration ?? 8}s ease-in-out infinite`
            : undefined,
      }}
    >
      {children}
    </div>
  );
}