"use client";

import { ReactNode } from "react";
import { cn } from "./utils";

interface WidgetLabelProps {
  children: ReactNode;
  className?: string;
}

export default function WidgetLabel({
  children,
  className,
}: WidgetLabelProps) {
  return (
    <span
      className={cn(
        "text-sm font-medium text-white/65",
        className
      )}
    >
      {children}
    </span>
  );
}