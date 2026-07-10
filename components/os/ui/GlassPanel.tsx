"use client";

import type { ReactNode } from "react";
import Card from "./Card";

interface GlassPanelProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}

export default function GlassPanel({
  children,
  className,
  hover = true,
}: GlassPanelProps) {
  return (
    <Card
      hover={hover}
      className={className}
    >
      {children}
    </Card>
  );
}