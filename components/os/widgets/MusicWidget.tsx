"use client";

import GlassPanel from "../ui/GlassPanel";

export default function MusicWidget() {
  return (
    <GlassPanel className="h-full p-6">
      <h2 className="text-xl font-semibold">
        Music
      </h2>

      <p className="mt-2 text-white/60">
        Music playback coming soon.
      </p>
    </GlassPanel>
  );
}