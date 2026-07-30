"use client";

import { motion } from "framer-motion";
import { useState } from "react";

import type { WidgetFootprint } from "@/apps/core";

export interface WidgetResizerProps {
  value: WidgetFootprint;
  onChange: (footprint: WidgetFootprint) => void;
  disabled?: boolean;
  className?: string;
}

const columns = [1, 2, 3, 4] as const;
const rows = [1, 2] as const;

function isFilled(
  cell: WidgetFootprint,
  footprint: WidgetFootprint
) {
  return cell.cols <= footprint.cols && cell.rows <= footprint.rows;
}

/**
 * A shared, keyboard-accessible footprint picker for widget editing surfaces.
 */
export default function WidgetResizer({
  value,
  onChange,
  disabled = false,
  className = "",
}: WidgetResizerProps) {
  const [preview, setPreview] = useState<WidgetFootprint | null>(null);
  const displayed = preview ?? value;

  return (
    <section className={`select-none ${className}`} aria-label="Resize widget">
      <div className="mb-3 flex items-baseline justify-between gap-4">
        <p className="text-sm font-medium text-white/90">Resize widget</p>
        <output className="text-xs tabular-nums text-white/50">
          {displayed.cols} × {displayed.rows}
        </output>
      </div>

      <div
        className="grid grid-cols-4 gap-1.5"
        role="grid"
        aria-label="Widget footprint selector"
        onPointerLeave={() => setPreview(null)}
      >
        {rows.map((row) =>
          columns.map((col) => {
            const footprint: WidgetFootprint = { cols: col, rows: row };
            const filled = isFilled({ cols: col, rows: row }, displayed);
            const selected = value.cols === col && value.rows === row;

            return (
              <motion.button
                key={`${col}-${row}`}
                type="button"
                role="gridcell"
                aria-label={`${col} by ${row} widget`}
                aria-pressed={selected}
                disabled={disabled}
                onFocus={() => setPreview(footprint)}
                onBlur={() => setPreview(null)}
                onPointerEnter={() => setPreview(footprint)}
                onClick={() => onChange(footprint)}
                whileTap={{ scale: 0.9 }}
                transition={{ type: "spring", stiffness: 500, damping: 28 }}
                className="relative h-7 rounded-md border border-white/10 bg-white/[0.045] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-sky-300/80 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {filled && (
                  <motion.span
                    layoutId="widget-resizer-fill"
                    className="absolute inset-[2px] rounded-[4px] bg-sky-300/80 shadow-[0_0_16px_rgba(125,211,252,0.7)]"
                    transition={{ type: "spring", stiffness: 420, damping: 32 }}
                  />
                )}
              </motion.button>
            );
          })
        )}
      </div>

      <p className="mt-3 text-xs text-white/45">
        Current: {value.cols} × {value.rows}
      </p>
    </section>
  );
}
