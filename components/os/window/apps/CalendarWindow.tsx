"use client";

import CalendarView from "@/components/apps/calendar/CalendarView";

export default function CalendarWindow() {
  return (
    <div className="h-full overflow-y-auto p-6">
      <CalendarView />
    </div>
  );
}