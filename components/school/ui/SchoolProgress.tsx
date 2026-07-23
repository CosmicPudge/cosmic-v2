"use client";

import clsx from "clsx";
import { motion } from "framer-motion";

export type SchoolProgressColor =
  | "blue"
  | "green"
  | "orange"
  | "red"
  | "purple";

interface SchoolProgressProps {
  value: number;
  label?: string;
  color?: SchoolProgressColor;
  height?: number;
  animated?: boolean;
}

const colors: Record<SchoolProgressColor, string> = {
  blue: "from-sky-400 to-sky-500",
  green: "from-emerald-400 to-emerald-500",
  orange: "from-orange-400 to-orange-500",
  red: "from-red-400 to-red-500",
  purple: "from-violet-400 to-violet-500",
};

export default function SchoolProgress({
  value,
  label,
  color = "blue",
  height = 10,
  animated = true,
}: SchoolProgressProps) {
  const progress = Math.max(0, Math.min(100, value));

  return (
    <div className="space-y-2">
      {(label || true) && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-white/60">
            {label ?? "Progress"}
          </span>

          <span className="font-medium text-white">
            {progress}%
          </span>
        </div>
      )}

      <div
        className="overflow-hidden rounded-full bg-white/10"
        style={{
          height,
        }}
      >
        <motion.div
          initial={{
            width: animated ? 0 : `${progress}%`,
          }}
          animate={{
            width: `${progress}%`,
          }}
          transition={{
            duration: 0.8,
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