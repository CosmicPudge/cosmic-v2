"use client";

import GlassPanel from "../ui/GlassPanel";
import StatusBadge from "../ui/StatusBadge";

export default function CalendarWidget() {
  return (
    <GlassPanel className="h-full p-6">
      <div className="flex h-full flex-col justify-between">
        <div>
          <h2 className="text-xl font-semibold">Calendar</h2>

          <p className="mt-2 text-white/60">
            Upcoming events and reminders.
          </p>
        </div>

        <StatusBadge
          color="gray"
          label="No Events"
        />
      </div>
    </GlassPanel>
  );
}