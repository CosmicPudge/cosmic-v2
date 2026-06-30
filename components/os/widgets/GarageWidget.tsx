"use client";

import GlassPanel from "../ui/GlassPanel";
import StatusBadge from "../ui/StatusBadge";

export default function GarageWidget() {
  return (
    <GlassPanel className="h-full p-6">
      <div className="flex h-full flex-col justify-between">
        <div>
          <h2 className="text-xl font-semibold">Garage</h2>

          <p className="mt-2 text-white/60">
            Vehicle maintenance overview.
          </p>
        </div>

        <StatusBadge
          color="yellow"
          label="Maintenance Due"
        />
      </div>
    </GlassPanel>
  );
}