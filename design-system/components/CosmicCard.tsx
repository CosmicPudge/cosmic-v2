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

        "cosmic-panel",
        "overflow-hidden",

        glass &&

        "bg-white/[0.06] backdrop-blur-2xl",

        "transition-all duration-300",

        interactive &&
          "cosmic-panel-interactive",

        className
      )}
    >
      {children}
    </div>
  );
}
