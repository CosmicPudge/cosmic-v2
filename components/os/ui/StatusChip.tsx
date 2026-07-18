"use client";

import { ReactNode } from "react";
import clsx from "clsx";

type StatusVariant =
  | "primary"
  | "success"
  | "warning"
  | "danger"
  | "neutral";

interface StatusChipProps {
  children: ReactNode;
  variant?: StatusVariant;
  icon?: ReactNode;
  className?: string;
}

const variants = {
  primary:
    "bg-violet-500/15 border-violet-400/25 text-violet-200",

  success:
    "bg-emerald-500/15 border-emerald-400/25 text-emerald-200",

  warning:
    "bg-orange-500/15 border-orange-400/25 text-orange-200",

  danger:
    "bg-rose-500/15 border-rose-400/25 text-rose-200",

  neutral:
    "bg-white/5 border-white/10 text-white/70",
};

export default function StatusChip({
  children,
  variant = "neutral",
  icon,
  className,
}: StatusChipProps) {
  return (
    <div
      className={clsx(
        "inline-flex items-center gap-2",
        "rounded-full border",
        "px-3 py-1.5",
        "text-sm font-medium",
        "transition-colors duration-300",
        variants[variant],
        className
      )}
    >
      {icon}

      <span>{children}</span>
    </div>
  );
}