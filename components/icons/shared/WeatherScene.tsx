"use client";

import type { ReactNode } from "react";

interface Props {
  size?: number;
  children: ReactNode;
  className?: string;
}

export default function WeatherScene({
  size = 64,
  children,
  className = "",
}: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      overflow="visible"
    >
      {children}
    </svg>
  );
}