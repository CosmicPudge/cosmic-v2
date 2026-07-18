"use client";

import { ReactNode } from "react";
import clsx from "clsx";
import GlassPanel from "./GlassPanel";

interface MetricProps {
  icon?: ReactNode;
  label: string;
  value: string | number;
  description?: string;
  className?: string;
  accent?: "violet" | "blue" | "green" | "orange" | "red";
}

const accents = {
  violet: "text-violet-300",
  blue: "text-sky-300",
  green: "text-emerald-300",
  orange: "text-orange-300",
  red: "text-rose-300",
};

export default function Metric({
  icon,
  label,
  value,
  description,
  className,
  accent = "violet",
}: MetricProps) {
  return (
    <GlassPanel
      hover
      variant="subtle"
      className={clsx("p-5", className)}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-white/60">
            {label}
          </p>

          <h3 className="mt-2 text-3xl font-bold text-white">
            {value}
          </h3>

          {description && (
            <p className="mt-2 text-sm text-white/45">
              {description}
            </p>
          )}
        </div>

        {icon && (
          <div className={clsx("mt-1", accents[accent])}>
            {icon}
          </div>
        )}
      </div>
    </GlassPanel>
  );
}