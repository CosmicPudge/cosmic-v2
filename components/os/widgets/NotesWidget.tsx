"use client";

import GlassPanel from "../ui/GlassPanel";

export default function NotesWidget() {
  return (
    <GlassPanel className="h-full p-6">
      <h2 className="text-xl font-semibold">
        Notes
      </h2>

      <p className="mt-2 text-white/60">
        Quick notes and reminders.
      </p>
    </GlassPanel>
  );
}