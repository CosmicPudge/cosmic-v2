"use client";

import GlassPanel from "../ui/GlassPanel";

export default function SystemWidget() {
  return (
    <GlassPanel className="h-full p-6">
      <h2 className="text-xl font-semibold">
        System
      </h2>

      <p className="mt-2 text-white/60">
        System health and performance.
      </p>
    </GlassPanel>
  );
}