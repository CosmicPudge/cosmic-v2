"use client";

import GlassPanel from "../ui/GlassPanel";

export default function AssistantWidget() {
  return (
    <GlassPanel className="h-full p-6">
      <div className="flex h-full flex-col justify-between">
        <div>
          <h2 className="text-xl font-semibold">Assistant</h2>
          <p className="mt-2 text-sm text-white/60">
            Your personal AI assistant for Cosmic OS.
          </p>
        </div>

        <div className="text-xs text-white/40">
          Coming in Alpha 0.2
        </div>
      </div>
    </GlassPanel>
  );
}