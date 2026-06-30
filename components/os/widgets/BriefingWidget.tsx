"use client";

import GlassPanel from "../ui/GlassPanel";
import StatusBadge from "../ui/StatusBadge";

export default function BriefingWidget() {
  return (
    <GlassPanel className="h-full p-6">
      <div className="flex h-full flex-col justify-between">
        <div>
          <h2 className="text-xl font-semibold">Daily Briefing</h2>

          <p className="mt-2 text-white/60">
            Your personalized summary of today.
          </p>
        </div>

        <StatusBadge
          color="green"
          label="Available"
        />
      </div>
    </GlassPanel>
  );
}