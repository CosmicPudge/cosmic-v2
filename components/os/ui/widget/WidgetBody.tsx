"use client";

import clsx from "clsx";

interface WidgetBodyProps {
  children: React.ReactNode;
  className?: string;
  centered?: boolean;
  scrollable?: boolean;
}

export default function WidgetBody({
  children,
  className,
  centered = false,
  scrollable = false,
}: WidgetBodyProps) {
  return (
    <div className="relative min-h-0 flex-1">
      {/* Top Fade */}
      <div
        className="
          pointer-events-none
          absolute
          inset-x-0
          top-0
          z-20
          h-8
          bg-gradient-to-b
          from-black/20
          to-transparent
        "
      />

      {/* Bottom Fade */}
      <div
        className="
          pointer-events-none
          absolute
          inset-x-0
          bottom-0
          z-20
          h-8
          bg-gradient-to-t
          from-black/20
          to-transparent
        "
      />

      {/* Scroll Area */}
      <div
        className={clsx(
          `
            h-full
            min-h-0
            ${scrollable ? "overflow-y-auto overscroll-contain" : "overflow-hidden"}
          `,
          centered
            ? "flex items-center justify-center"
            : "flex flex-col gap-6",
          className
        )}
      >
        {children}
      </div>
    </div>
  );
}
