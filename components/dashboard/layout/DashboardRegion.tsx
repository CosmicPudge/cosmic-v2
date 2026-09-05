"use client";

import type { CSSProperties, PropsWithChildren } from "react";

interface DashboardRegionProps
  extends PropsWithChildren {
  className?: string;
  style?: CSSProperties;
}

export default function DashboardRegion({
  children,
  className = "",
  style,
}: DashboardRegionProps) {
  return (
    <section
      className={`relative z-10 ${className}`}
      style={{
        width: "100%",
        minWidth: 0,
        ...style,
      }}
    >
      {children}
    </section>
  );
}
