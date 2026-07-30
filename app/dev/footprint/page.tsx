"use client";

import { useState } from "react";

import type { WidgetFootprint } from "@/apps/core";
import { WidgetResizer } from "@/components/os/layout/WidgetResizer";

export default function FootprintPickerDevPage() {
  const [size, setSize] = useState<WidgetFootprint>({
    rows: 2,
    cols: 2,
  });

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-950 p-12">
      <div className="space-y-8">
        <WidgetResizer
          value={size}
          onChange={setSize}
        />

        <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-white">
          Selected Size: {size.cols} × {size.rows}
        </div>
      </div>
    </main>
  );
}
