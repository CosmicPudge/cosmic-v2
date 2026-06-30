"use client";

import GlassPanel from "../ui/GlassPanel";

export default function ClockWidget() {
  return (
    <GlassPanel className="flex h-full items-center justify-center p-6">
      <div className="text-center">
        <h2 className="text-4xl font-bold">
          --:--
        </h2>

        <p className="mt-2 text-white/60">
          Clock coming soon
        </p>
      </div>
    </GlassPanel>
  );
}