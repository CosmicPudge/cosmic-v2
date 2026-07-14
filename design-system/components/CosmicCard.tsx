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

        "overflow-hidden",

        "rounded-3xl",

        "border border-white/10",

        glass &&

        "bg-white/[0.06] backdrop-blur-2xl",

        "shadow-xl",

        "transition-all duration-300",

        interactive &&
          "hover:scale-[1.015] hover:bg-white/[0.08]",

        className
      )}
    >
      {children}
    </div>
  );
}