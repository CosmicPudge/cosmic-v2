"use client";

import GlassPanel from "../ui/GlassPanel";

export default function OutlookWidget() {
  return (
    <GlassPanel className="h-full p-6">
      <div className="flex h-full flex-col justify-between">
        <div>
          <h2 className="text-xl font-semibold">Outlook</h2>
          <p className="mt-2 text-sm text-white/60">
            Email, calendar, and Microsoft account updates.
          </p>
        </div>

        <div className="text-xs text-white/40">
          Coming in Alpha 0.2
        </div>
      </div>
    </GlassPanel>
  );
}