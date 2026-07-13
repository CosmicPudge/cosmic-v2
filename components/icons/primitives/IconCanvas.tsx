"use client";

import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
  size?: number;
  className?: string;
  viewBox?: string;
}

export default function IconCanvas({
  children,
  size = 64,
  className = "",
  viewBox = "0 0 100 100",
}: Props) {
  return (
    <div
      className={`relative overflow-visible ${className}`}
      style={{
        width: size,
        height: size,
        minWidth: size,
        minHeight: size,
      }}
    >
      <svg
        viewBox={viewBox}
        width="100%"
        height="100%"
        overflow="visible"
      >
        {children}  
      </svg>
    </div>
  );
}