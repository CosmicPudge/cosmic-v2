"use client";

import GlassPanel from "../ui/GlassPanel";

export default function SearchWidget() {
  return (
    <GlassPanel className="h-full p-6">
      <h2 className="text-xl font-semibold">
        Search
      </h2>

      <p className="mt-2 text-white/60">
        Search Cosmic and connected services.
      </p>
    </GlassPanel>
  );
}