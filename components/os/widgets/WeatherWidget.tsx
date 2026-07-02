"use client";

import GlassPanel from "../ui/GlassPanel";
import WidgetCard from "./WidgetCard";

export default function WeatherWidget() {
  return (
    <WidgetCard route="/weather">
    <GlassPanel>

      <div className="flex items-center justify-between">

        <div>

          <p className="text-sm uppercase tracking-widest text-white/50">
            Weather
          </p>

          <h2 className="mt-2 text-6xl font-bold">
            72°
          </h2>

          <p className="text-lg text-white/70">
            Clear Sky
          </p>

        </div>

        <div className="text-7xl">
          ☀️
        </div>

      </div>

    </GlassPanel>
    </WidgetCard>
  );
}