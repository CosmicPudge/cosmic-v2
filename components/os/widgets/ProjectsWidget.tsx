"use client";

import GlassPanel from "../ui/GlassPanel";

export default function ProjectsWidget() {
  return (
    <GlassPanel className="h-full p-6">
      <h2 className="text-xl font-semibold">
        Projects
      </h2>

      <p className="mt-2 text-white/60">
        Active development projects.
      </p>
    </GlassPanel>
  );
}