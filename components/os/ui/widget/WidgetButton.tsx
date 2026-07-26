"use client";

import { WidgetButtonProps } from "./types";
import { cn } from "./utils";

export default function WidgetButton({
  children,
  className,
  ...props
}: WidgetButtonProps) {
  return (
    <button
      {...props}
      className={cn(
        "inline-flex items-center justify-center",
        "rounded-2xl",
        "border border-white/10",
        "bg-white/6",
        "px-4 py-2",
        "text-sm font-medium text-white/80",
        "backdrop-blur-xl",
        "transition-all duration-200",
        "hover:border-white/20",
        "hover:bg-white/10",
        "hover:text-white",
        "active:scale-[0.98]",
        "disabled:pointer-events-none",
        "disabled:opacity-50",
        className
      )}
    >
      {children}
    </button>
  );
}