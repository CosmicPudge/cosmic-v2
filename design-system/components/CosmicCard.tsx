"use client";

import clsx from "clsx";
import type { ReactNode } from "react";

interface CosmicCardProps {
  children: ReactNode;
  className?: string;
  interactive?: boolean;
  glass?: boolean;
}

export default function CosmicCard({
  children,
  className,
  interactive = false,
  glass = true,
}: CosmicCardProps) {
  return (
    <div
      className={clsx(
        "cosmic-panel cosmos-card overflow-hidden",
        glass ? "cosmos-card-surface" : "bg-transparent",
        "transition-all duration-300",
        interactive && "cosmic-panel-interactive",
        className,
      )}
    >
      {children}
    </div>
  );
}
