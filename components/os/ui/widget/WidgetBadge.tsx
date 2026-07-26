"use client";

import { ReactNode } from "react";
import { cn } from "./utils";

type Variant =
  | "default"
  | "success"
  | "warning"
  | "danger"
  | "info";

interface WidgetBadgeProps {
  children: ReactNode;
  variant?: Variant;
  className?: string;
}

const variants = {
  default:
    "bg-white/8 text-white/80 border-white/10",

  success:
    "bg-emerald-500/10 text-emerald-300 border-emerald-400/20",

  warning:
    "bg-amber-500/10 text-amber-300 border-amber-400/20",

  danger:
    "bg-red-500/10 text-red-300 border-red-400/20",

  info:
    "bg-sky-500/10 text-sky-300 border-sky-400/20",
};

export default function WidgetBadge({
  children,
  variant = "default",
  className,
}: WidgetBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1",
        "text-[11px] font-semibold uppercase tracking-[0.16em]",
        "backdrop-blur-xl",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}