"use client";

import GlassPanel from "../ui/GlassPanel";
import StatusBadge from "../ui/StatusBadge";

export default function CalendarWidget() {
  return (
    <GlassPanel className="flex h-full flex-col justify-between">

  <div>

    <p className="text-xs uppercase tracking-[0.3em] text-white/50">
      Calendar
    </p>

    <h2 className="mt-4 text-3xl font-bold">
      July 9
    </h2>

    <p className="text-white/60">
      Wednesday
    </p>

  </div>

  <div>

    <p className="text-white/70">
      No events today
    </p>

    <div className="mt-4">
      <StatusBadge
        color="gray"
        label="You're all caught up"
      />
    </div>

  </div>

</GlassPanel>
  );
}