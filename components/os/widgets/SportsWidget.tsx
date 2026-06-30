"use client";

import GlassPanel from "../ui/GlassPanel";
import StatusBadge from "../ui/StatusBadge";

export default function SportsWidget() {
  return (
    <GlassPanel className="h-full p-6">
      <div className="flex h-full flex-col justify-between">
        <div>
          <h2 className="text-xl font-semibold">
            Sports
          </h2>

          <p className="mt-2 text-white/60">
            Live scores and favorite teams.
          </p>
        </div>

        <StatusBadge
          color="red"
          label="Waiting for Games"
        />
      </div>
    </GlassPanel>
  );
}