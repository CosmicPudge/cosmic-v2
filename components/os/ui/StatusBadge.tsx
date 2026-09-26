"use client";

interface StatusBadgeProps {
  label: string;
  color?: "green" | "yellow" | "red" | "blue" | "gray" | "orange";
}

const colors = {
  green: "cosmic-status-green",
  yellow: "cosmic-status-yellow",
  blue: "cosmic-status-blue",
  orange: "cosmic-status-orange",
  red: "cosmic-status-red",
  gray: "cosmic-status-gray",
};

export default function StatusBadge({
  label,
  color = "gray",
}: StatusBadgeProps) {
  return (
    <div className={`cosmic-status-badge ${colors[color]}`}>
      <span className="cosmic-status-dot" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}
