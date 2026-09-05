"use client";

import clsx from "clsx";

interface WidgetLoadingProps {
  className?: string;
  label?: string;
  compact?: boolean;
}

export default function WidgetLoading({
  className,
  label = "Loading...",
  compact = false,
}: WidgetLoadingProps) {
  return (
    <div className={clsx("flex flex-1 items-center justify-center", className)}>
      <div className={clsx("flex items-center", compact ? "gap-2" : "gap-3")}>
        <div className={clsx("animate-pulse rounded-full bg-white/70 motion-reduce:animate-none", compact ? "h-1.5 w-1.5" : "h-2 w-2")} />
        <span className={clsx("text-white/60", compact ? "text-xs" : "text-sm")}>
          {label}
        </span>
      </div>
    </div>
  );
}
