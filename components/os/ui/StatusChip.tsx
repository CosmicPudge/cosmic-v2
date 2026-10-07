"use client";

import { ReactNode } from "react";
import clsx from "clsx";

type StatusVariant = "primary" | "success" | "warning" | "danger" | "neutral";

interface StatusChipProps {
  children: ReactNode;
  variant?: StatusVariant;
  icon?: ReactNode;
  className?: string;
}

const variants = {
  primary: "bg-violet-500/12 border-violet-400/22 text-violet-100",
  success: "bg-emerald-500/12 border-emerald-400/22 text-emerald-100",
  warning: "bg-amber-500/12 border-amber-400/22 text-amber-100",
  danger: "bg-rose-500/12 border-rose-400/22 text-rose-100",
  neutral: "bg-white/[0.035] border-white/10 text-white/65",
};

export default function StatusChip({ children, variant = "neutral", icon, className }: StatusChipProps) {
  return (
    <span className={clsx(
      "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-[0.02em]",
      variants[variant],
      className,
    )}>
      {icon}
      <span>{children}</span>
    </span>
  );
}
