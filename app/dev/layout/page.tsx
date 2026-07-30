"use client";

import { useMemo, useState } from "react";

import type { WidgetFootprint } from "@/apps/core";
import { WidgetResizer } from "@/components/os/layout/WidgetResizer";

const CELL_WIDTH = 150;
const CELL_HEIGHT = 140;
const GAP = 16;

export default function DashboardLayoutLab() {
  const [footprint, setFootprint] = useState<WidgetFootprint>({
    rows: 2,
    cols: 2,
  });

  const previewStyle = useMemo(() => {
    return {
      width: footprint.cols * CELL_WIDTH + (footprint.cols - 1) * GAP,
      height: footprint.rows * CELL_HEIGHT + (footprint.rows - 1) * GAP,
    };
  }, [footprint]);

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <div className="mx-auto flex min-h-screen max-w-7xl items-center justify-center p-12">
        <div className="grid grid-cols-[340px_1fr] gap-12">
          {/* Controls */}
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <WidgetResizer
              value={footprint}
              onChange={setFootprint}
            />

            <div className="mt-8 rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-white/40">
                Selected
              </p>

              <p className="mt-2 text-2xl font-semibold">
                {footprint.cols} × {footprint.rows}
              </p>

              <p className="mt-2 text-sm text-white/50">
                {footprint.cols} columns • {footprint.rows} rows
              </p>
            </div>
          </div>

          {/* Preview */}
          <div className="flex items-center justify-center rounded-3xl border border-white/10 bg-gradient-to-b from-white/5 to-white/[0.02] p-12">
            <div
              style={previewStyle}
              className="
                flex
                items-center
                justify-center
                rounded-3xl
                border
                border-cyan-300/30
                bg-cyan-400/10
                shadow-[0_0_60px_rgba(34,211,238,0.15)]
                transition-all
                duration-300
                ease-out
              "
            >
              <div className="text-center">
                <h2 className="text-xl font-semibold">
                  Weather Widget
                </h2>

                <p className="mt-2 text-sm text-white/60">
                  Live Resize Preview
                </p>

                <p className="mt-6 text-3xl font-bold">
                  {footprint.cols} × {footprint.rows}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
