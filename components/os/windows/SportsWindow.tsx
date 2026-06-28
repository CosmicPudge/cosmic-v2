"use client";

import AppWindow from "./AppWindow";

export default function SportsWindow() {
  return (
    <AppWindow
      title="Sports"
      windowName="sports"
    >
      <h1 className="text-2xl font-bold">Sports</h1>

      <p className="mt-2 text-white/70">
        Sports system coming soon.
      </p>
    </AppWindow>
  );
}