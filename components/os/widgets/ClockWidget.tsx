"use client";

import GlassPanel from "../ui/GlassPanel";

export default function ClockWidget() {
  return (
    <GlassPanel className="h-full p-6">
      <div className="flex h-full flex-col justify-between">
        <div>
          <h2 className="text-xl font-semibold">
            Clock
          </h2>

          <p className="mt-2 text-sm text-white/60">
            Current time and date.
          </p>
        </div>

        <div className="text-xs text-white/40">
          Coming in Alpha 0.2
        </div>
      </div>
    </GlassPanel>
  );
}