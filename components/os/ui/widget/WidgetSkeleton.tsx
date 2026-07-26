"use client";

import { cn } from "./utils";

interface Props {
  className?: string;
}

export default function WidgetSkeleton({
  className,
}: Props) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-2xl bg-white/8",
        className
      )}
    />
  );
}