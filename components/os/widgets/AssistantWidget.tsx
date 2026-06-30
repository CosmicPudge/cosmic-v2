"use client";

import GlassPanel from "../ui/GlassPanel";
import StatusBadge from "../ui/StatusBadge";

export default function AssistantWidget() {
  return (
    <GlassPanel className="h-full p-6">
      <div className="flex h-full flex-col justify-between">
        <div>
          <h2 className="text-xl font-semibold">Assistant</h2>

          <p className="mt-2 text-white/60">
            Your personal AI assistant.
          </p>
        </div>

        <StatusBadge
          color="blue"
          label="Ready"
        />
      </div>
    </GlassPanel>
  );
}