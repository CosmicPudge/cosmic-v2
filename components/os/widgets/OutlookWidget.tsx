"use client";

import GlassPanel from "../ui/GlassPanel";

export default function OutlookWidget() {
  return (
    <GlassPanel className="h-full p-6">
      <h2 className="text-xl font-semibold">
        Outlook
      </h2>

      <p className="mt-2 text-white/60">
        Email and calendar integration.
      </p>
    </GlassPanel>
  );
}