"use client";

import GlassPanel from "../ui/GlassPanel";

export default function WeatherWidget() {
  return (
    <GlassPanel>
      <h2 className="text-xl font-semibold">Weather</h2>

      <div className="mt-6 flex items-center justify-between">
        <div>
          <p className="text-6xl font-bold">72°</p>
          <p className="text-white/60">Clear Sky</p>
        </div>

        <div className="text-6xl">☀️</div>
      </div>
    </GlassPanel>
  );
}