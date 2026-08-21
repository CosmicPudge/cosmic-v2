"use client";

import { useMusic } from "@/hooks/os/useMusic";

export default function AmbientMusic() {
  const music = useMusic({ refreshMs: 1_000 });
  const track = music.playback?.track;

  if (music.loading) {
    return <p className="text-sm text-white/40">Checking now playing…</p>;
  }

  if (!music.connected || !track) {
    return <p className="text-sm text-white/40">Nothing is playing.</p>;
  }

  return (
    <div className="flex min-w-0 items-center gap-4">
      <div
        className="h-14 w-14 shrink-0 rounded-xl border border-white/10 bg-white/5 bg-cover bg-center shadow-lg"
        style={track.artworkUrl ? { backgroundImage: `url("${track.artworkUrl}")` } : undefined}
        aria-hidden="true"
      />
      <div className="min-w-0">
        <p className="truncate text-lg font-medium text-white/90">{track.title}</p>
        <p className="mt-1 truncate text-sm text-white/45">{track.artists.join(", ")}</p>
        <p className="mt-1 text-[0.65rem] uppercase tracking-[0.2em] text-cyan-100/35">
          {music.playback?.playing ? "Now playing" : "Paused"}
        </p>
      </div>
    </div>
  );
}
