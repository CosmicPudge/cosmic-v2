"use client";

import { ReactNode } from "react";

interface GlassPanelProps {
  children: ReactNode;
  className?: string;
}

export default function GlassPanel({
  children,
  className = "",
}: GlassPanelProps) {
  return (
    <div
      className={[
        "rounded-3xl",
        "border border-white/10",
        "bg-white/5",
        "backdrop-blur-xl",
        "shadow-2xl",
        "transition-all",
        "duration-300",
        "hover:bg-white/10",
        "hover:border-white/20",
        "p-6",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}