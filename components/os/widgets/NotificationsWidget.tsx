"use client";

import GlassPanel from "../ui/GlassPanel";
import StatusBadge from "../ui/StatusBadge";

export default function NotificationsWidget() {
  return (
    <GlassPanel className="h-full p-6">
      <div className="flex h-full flex-col justify-between">
        <div>
          <h2 className="text-xl font-semibold">
            Notifications
          </h2>

          <p className="mt-2 text-white/60">
            System alerts and updates.
          </p>
        </div>

        <StatusBadge
          color="green"
          label="All Clear"
        />
      </div>
    </GlassPanel>
  );
}