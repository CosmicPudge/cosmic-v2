"use client";

import { useEffect, useState } from "react";
import Widget from "@/components/os/ui/widget/Widget";
import { useMusic } from "@/hooks/os/useMusic";

export default function KioskMusicWidget({ music }: { music: ReturnType<typeof useMusic> }) {
  const track = music.playback?.track;
  const duration = music.playback?.durationMs ?? track?.durationMs;
  const progressMs = useSmoothProgress(music.playback?.positionMs ?? 0, duration, Boolean(music.playback?.playing), track?.id);
  const stale = Boolean(music.requestError && track);
  return <Widget accent="music" className="kiosk-music-widget" contentPadding={false} hover={false} imageUrl={track?.artworkUrl} imageOpacity={.42} imageBlur={3}>
    <div className="kiosk-music-scene relative flex h-full min-h-0 flex-col overflow-hidden p-6 text-white sm:p-10">
      <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/35 to-black/65" />
      <div className="relative z-10 flex min-h-0 flex-1 items-center gap-6 sm:gap-12">
        <div className="kiosk-music-art shrink-0 overflow-hidden rounded-xl bg-black/40 shadow-2xl">{track?.artworkUrl ? <img src={track.artworkUrl} alt="" draggable={false} className="h-full w-full object-cover" onError={(event) => { event.currentTarget.style.display = "none"; }} /> : <span className="grid h-full w-full place-items-center text-5xl text-fuchsia-100/65">♫</span>}</div>
        <div className="min-w-0 flex-1">
          <p className="text-[.65rem] font-semibold uppercase tracking-[.3em] text-fuchsia-200/75">{!music.connected ? "SPOTIFY NOT CONNECTED" : track ? music.playback?.playing ? "PLAYING" : "PAUSED" : "COSMIC MUSIC"}</p>
          <h1 className="mt-3 line-clamp-2 text-[clamp(1.5rem,4vw,3.4rem)] font-semibold leading-tight">{!music.connected ? "Connect Spotify from Cosmic Account Settings" : track ? track.title : "Nothing playing"}</h1>
          <p className="mt-2 truncate text-[clamp(.9rem,2vw,1.35rem)] text-white/75">{track?.artists.join(", ") ?? (music.error ? "Cosmic will retry automatically." : "Music is idle")}</p>
          {track?.album ? <p className="mt-2 truncate text-sm uppercase tracking-[.16em] text-white/50">{track.album}</p> : null}
          {stale ? <p className="mt-3 text-xs uppercase tracking-[.18em] text-amber-100/65">Reconnecting…</p> : null}
          {track && duration ? <div className="mt-8 max-w-2xl"><div className="h-1.5 overflow-hidden rounded-full bg-white/20"><div className="h-full rounded-full bg-fuchsia-200" style={{ width: `${Math.min(100, progressMs / duration * 100)}%` }} /></div><div className="mt-2 flex justify-between text-xs tabular-nums text-white/65"><span>{formatDuration(progressMs)}</span><span>{formatDuration(duration)}</span></div></div> : null}
        </div>
      </div>
      {music.playback?.deviceName ? <p className="relative z-10 mt-4 text-xs uppercase tracking-[.18em] text-white/45">Playing on {music.playback.deviceName}</p> : null}
    </div>
  </Widget>;
}

function useSmoothProgress(positionMs: number, durationMs: number | undefined, playing: boolean, trackId: string | undefined) {
  const key = `${trackId ?? ""}:${positionMs}:${durationMs ?? ""}:${playing}`;
  const [baseline, setBaseline] = useState({ key: "", positionMs, startedAt: 0 });
  const [now, setNow] = useState(0);
  useEffect(() => {
    const sync = () => { const timestamp = Date.now(); setBaseline({ key, positionMs, startedAt: timestamp }); setNow(timestamp); };
    const initial = window.setTimeout(sync, 0);
    if (!playing || !durationMs) return () => window.clearTimeout(initial);
    const timer = window.setInterval(() => setNow(Date.now()), 250);
    return () => { window.clearTimeout(initial); window.clearInterval(timer); };
  }, [durationMs, key, playing, positionMs]);
  return playing && durationMs && baseline.key === key ? Math.min(durationMs, baseline.positionMs + now - baseline.startedAt) : positionMs;
}

function formatDuration(value: number) {
  const totalSeconds = Math.max(0, Math.floor(value / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor(totalSeconds / 60) % 60;
  const seconds = totalSeconds % 60;
  return hours ? `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}` : `${minutes}:${String(seconds).padStart(2, "0")}`;
}
