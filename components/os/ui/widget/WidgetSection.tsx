"use client";

import { WidgetSectionProps } from "./types";
import { cn } from "./utils";

export default function WidgetSection({
  title,
  children,
  className,
}: WidgetSectionProps) {
  return (
    <section
      className={cn(
        "flex flex-col gap-5",
        className
      )}
    >
      {title && (
        <h4
          className="
            text-[11px]
            font-semibold
            uppercase
            tracking-[0.28em]
            text-white/55
          "
        >
          {title}
        </h4>
      )}

      {children}
    </section>
  );
}