"use client";

import { WidgetMetricProps } from "./types";
import { cn } from "./utils";

export default function WidgetMetric({
  value,
  label,
  align = "left",
}: WidgetMetricProps) {
  return (
    <div
      className={cn(
        "flex flex-col",
        align === "left" && "items-start text-left",
        align === "center" && "items-center text-center",
        align === "right" && "items-end text-right"
      )}
    >
      <div
        className="
          text-5xl
          font-semibold
          leading-none
          tracking-[-0.04em]
          text-white
        "
      >
        {value}
      </div>

      {label && (
        <p
          className="
            mt-2
            text-sm
            font-medium
            text-white/60
          "
        >
          {label}
        </p>
      )}
    </div>
  );
}