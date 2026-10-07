"use client";

import clsx from "clsx";
import { motion } from "framer-motion";

interface ProgressBarProps {
  value: number;
  max?: number;
  className?: string;
  height?: "sm" | "md" | "lg";
  color?: "violet" | "blue" | "green" | "orange" | "red";
  animated?: boolean;
  showValue?: boolean;
  label?: string;
}

const heights = { sm: "h-1.5", md: "h-2.5", lg: "h-4" };
const colors = {
  violet: "from-violet-500 to-fuchsia-400",
  blue: "from-sky-500 to-cyan-400",
  green: "from-emerald-500 to-lime-400",
  orange: "from-orange-500 to-amber-400",
  red: "from-rose-500 to-red-400",
};

export default function ProgressBar({
  value,
  max = 100,
  className,
  height = "md",
  color = "violet",
  animated = true,
  showValue = false,
  label = "Progress",
}: ProgressBarProps) {
  const percent = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <div className={clsx("w-full", className)}>
      {showValue && (
        <div className="mb-2 flex justify-between text-xs font-medium text-white/50">
          <span>{label}</span>
          <span className="tabular-nums">{Math.round(percent)}%</span>
        </div>
      )}
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={Math.min(Math.max(value, 0), max)}
        className={clsx("overflow-hidden rounded-full border border-white/[0.04] bg-white/[0.07]", heights[height])}
      >
        <motion.div
          initial={animated ? { width: 0 } : false}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className={clsx("h-full rounded-full bg-gradient-to-r", colors[color])}
        />
      </div>
    </div>
  );
}
