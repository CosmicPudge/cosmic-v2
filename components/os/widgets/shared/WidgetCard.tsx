"use client";

import clsx from "clsx";
import type { ReactNode } from "react";

interface WidgetCardProps {
  children: ReactNode;
  className?: string;
}

export default function WidgetCard({
  children,
  className,
}: WidgetCardProps) {
  return (
    <div
      className={clsx(
        `
        relative
        overflow-hidden

        rounded-[30px]

        border
        border-white/10

        bg-white/[0.05]

        backdrop-blur-2xl

        shadow-[0_12px_40px_rgba(0,0,0,.22)]

        p-5
        `,
        className
      )}
    >
      {/* Top Highlight */}
      <div
        className="
          pointer-events-none
          absolute
          inset-0

          bg-gradient-to-b

          from-white/[0.08]
          via-transparent
          to-transparent
        "
      />

      {/* Corner Glow */}
      <div
        className="
          pointer-events-none
          absolute
          inset-0

          bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,.08),transparent_55%)]
        "
      />

      {/* Bottom Depth */}
      <div
        className="
          pointer-events-none
          absolute
          inset-0

          bg-gradient-to-t

          from-black/10
          via-transparent
          to-transparent
        "
      />

      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}