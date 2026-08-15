"use client";

import ClockView from "@/components/apps/clock/ClockView";

export default function ClockWindow() {
  return (
    <div className="h-full overflow-y-auto p-5">
      <ClockView compact />
    </div>
  );
}
