"use client";

import { cn } from "./utils";

interface WidgetDividerProps {
  className?: string;
}

export default function WidgetDivider({
  className,
}: WidgetDividerProps) {
  return (
    <div
      className={cn(
        "my-1 h-px w-full bg-gradient-to-r",
        "from-transparent via-white/10 to-transparent",
        className
      )}
    />
  );
}