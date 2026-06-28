"use client";

import { ReactNode } from "react";

interface GlassPanelProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}

export default function GlassPanel({
  children,
  className = "",
  hover = true,
}: GlassPanelProps) {
  return (
    <div
      className={[
        "rounded-3xl",
        "border border-white/10",
        "bg-white/[0.04]",
        "backdrop-blur-2xl",
        "shadow-[0_8px_32px_rgba(0,0,0,0.35)]",
        "transition-all",
        "duration-300",
        "p-6",

        hover
          ? "hover:bg-white/[0.08] hover:border-white/20 hover:scale-[1.015]"
          : "",

        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}