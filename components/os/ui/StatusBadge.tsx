"use client";

interface StatusBadgeProps {
  label: string;
  color?: "green" | "yellow" | "red" | "blue" | "gray";
}

const colors = {
  green:
    "bg-green-500/15 text-green-400 border-green-500/30 shadow-[0_0_18px_rgba(34,197,94,0.25)]",

  yellow:
    "bg-yellow-500/15 text-yellow-300 border-yellow-500/30",

  blue:
    "bg-sky-500/15 text-sky-300 border-sky-500/30",

  orange:
    "bg-orange-500/15 text-orange-300 border-orange-500/30",

  red:
    "bg-red-500/15 text-red-400 border-red-500/30",

  gray:
    "bg-gray-500/15 text-gray-300 border-gray-500/30",
};

export default function StatusBadge({
  label,
  color = "gray",
}: StatusBadgeProps) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1">
      <div
        className={`h-2 w-2 rounded-full ${colors[color]}`}
      />

      <span className="text-sm text-white/80">
        {label}
      </span>
    </div>
  );
}