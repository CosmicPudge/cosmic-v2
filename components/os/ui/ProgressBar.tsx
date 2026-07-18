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
}

const heights = {
  sm: "h-1.5",
  md: "h-2.5",
  lg: "h-4",
};

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
}: ProgressBarProps) {
  const percent = Math.min(
    Math.max((value / max) * 100, 0),
    100
  );

  return (
    <div className={clsx("w-full", className)}>
      {showValue && (
        <div className="mb-2 flex justify-between text-sm text-white/60">
          <span>Progress</span>
          <span>{Math.round(percent)}%</span>
        </div>
      )}

      <div
        className={clsx(
          "overflow-hidden rounded-full bg-white/10",
          heights[height]
        )}
      >
        <motion.div
          initial={animated ? { width: 0 } : false}
          animate={{ width: `${percent}%` }}
          transition={{
            duration: 1,
            ease: [0.22, 1, 0.36, 1],
          }}
          className={clsx(
            "h-full rounded-full bg-gradient-to-r",
            colors[color]
          )}
        />
      </div>
    </div>
  );
}