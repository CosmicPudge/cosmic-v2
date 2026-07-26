"use client";

import DashboardCard from "../shared/DashboardCard";

export default function AssistantDock() {
  return (
    <DashboardCard
      glass="sm"
      hover
      className="w-full"
    >
      <div className="flex items-center gap-4">

        <div className="text-2xl">
          ✦
        </div>

        <input
          type="text"
          placeholder="Ask Cosmic..."
          className="
            w-full
            bg-transparent
            outline-none
            text-lg
            placeholder:text-white/40
          "
        />

      </div>
    </DashboardCard>
  );
}