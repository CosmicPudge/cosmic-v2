"use client";

import AppWindow from "./AppWindow";

export default function MusicWindow() {
  return (
    <AppWindow
      title="Music"
      windowName="music"
    >
      <h1 className="text-2xl font-bold">Music</h1>

      <p className="mt-2 text-white/70">
        Music system coming soon.
      </p>
    </AppWindow>
  );
}