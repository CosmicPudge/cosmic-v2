"use client";

import AppWindow from "./AppWindow";

export default function CalendarWindow() {
  return (
    <AppWindow
      title="Calendar"
      windowName="calendar"
    >
      <h1 className="text-2xl font-bold">Calendar</h1>

      <p className="mt-2 text-white/70">
        Calendar system coming soon.
      </p>
    </AppWindow>
  );
}