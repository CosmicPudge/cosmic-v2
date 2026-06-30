"use client";

import GlassPanel from "../ui/GlassPanel";

export default function SchoolWidget() {
  return (
    <GlassPanel className="h-full p-6">
      <h2 className="text-xl font-semibold">
        School
      </h2>

      <p className="mt-2 text-white/60">
        Classes and assignments.
      </p>
    </GlassPanel>
  );
}