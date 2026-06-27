"use client";
import WeatherWidget from "../widgets/WeatherWidget";

export default function UniverseGrid() {
  return (
    <div className="grid grid-cols-12 gap-6">

      <div className="col-span-4">
    <WeatherWidget />
</div>

      <div className="col-span-4 h-64 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl">
        Assistant Widget
      </div>

      <div className="col-span-4 h-64 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl">
        Calendar Widget
      </div>

      <div className="col-span-6 h-96 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl">
        Sports Widget
      </div>

      <div className="col-span-6 h-96 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl">
        Garage Widget
      </div>

    </div>
  );
}