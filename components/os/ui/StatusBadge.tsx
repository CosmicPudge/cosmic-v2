"use client";

interface StatusBadgeProps {
  label: string;
  color?: "green" | "yellow" | "red" | "blue" | "gray";
}

const colors = {
  green: "bg-green-500",
  yellow: "bg-yellow-400",
  red: "bg-red-500",
  blue: "bg-blue-500",
  gray: "bg-gray-400",
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