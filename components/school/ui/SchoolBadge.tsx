"use client";

import clsx from "clsx";

export type SchoolBadgeColor =
  | "red"
  | "orange"
  | "green"
  | "blue"
  | "purple";

interface SchoolBadgeProps {
  children: React.ReactNode;
  color?: SchoolBadgeColor;
}

const styles: Record<SchoolBadgeColor, string> = {
  red: "bg-red-500/15 text-red-300 border-red-500/20",
  orange: "bg-orange-500/15 text-orange-300 border-orange-500/20",
  green: "bg-emerald-500/15 text-emerald-300 border-emerald-500/20",
  blue: "bg-sky-500/15 text-sky-300 border-sky-500/20",
  purple: "bg-violet-500/15 text-violet-300 border-violet-500/20",
};

export default function SchoolBadge({
  children,
  color = "blue",
}: SchoolBadgeProps) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium",
        styles[color]
      )}
    >
      {children}
    </span>
  );
}