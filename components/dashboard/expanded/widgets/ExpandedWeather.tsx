"use client";

export default function ExpandedWeather() {
  return (
    <div className="flex h-full flex-col">
      <h1 className="text-5xl font-bold text-white">
        Weather
      </h1>

      <p className="mt-3 text-white/70">
        This is the expanded Weather workspace.
      </p>

      <div className="mt-10 flex-1 rounded-3xl border border-white/10 bg-white/[0.03]" />
    </div>
  );
}