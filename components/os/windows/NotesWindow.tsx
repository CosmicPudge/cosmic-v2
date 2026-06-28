"use client";

import AppWindow from "./AppWindow";

export default function NotesWindow() {
  return (
    <AppWindow
      title="Notes"
      windowName="notes"
    >
      <h1 className="text-2xl font-bold">Notes</h1>

      <p className="mt-2 text-white/70">
        Notes system coming soon.
      </p>
    </AppWindow>
  );
}