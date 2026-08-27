"use client";

import { useEffect, useId, useState } from "react";
import Widget from "@/components/os/ui/widget/Widget";
import { useMusic } from "@/hooks/os/useMusic";
import { useKioskSlideshowControl } from "@/components/os/kiosk/KioskSlideshowContext";
import { useWidgetContext } from "@/components/os/ui/widget/WidgetContext";

export default function KioskMusicWidget({ music }: { music: ReturnType<typeof useMusic> }) {
  const { active } = useWidgetContext();
  const source = useId();
  const { setMusicPlaying } = useKioskSlideshowControl();
  const track = music.playback?.track;
  useEffect(() => {
    setMusicPlaying(source, Boolean(active && music.playback?.playing));
    return () => setMusicPlaying(source, false);
  }, [active, music.playback?.playing, setMusicPlaying, source]);
  const disconnected = !music.connected;
  const providerFailure = music.connected && Boolean(music.error) && !track;
  const statusLabel = disconnected ? music.reconnectRequired ? "SPOTIFY RECONNECT REQUIRED" : music.error?.includes("not configured") ? "SPOTIFY NOT CONFIGURED" : "SPOTIFY NOT CONNECTED" : providerFailure ? "SPOTIFY TEMPORARILY UNAVAILABLE" : track ? music.playback?.playing ? "PLAYING" : "PAUSED" : "COSMIC MUSIC";
  const duration = music.playback?.durationMs ?? track?.durationMs;
  const progressMs = useSmoothProgress(music.playback?.positionMs ?? 0, duration, Boolean(music.playback?.playing), track?.id);
  const stale = Boolean(music.error && track);

  return <Widget accent="music" className="kiosk-music-widget" contentPadding={false} hover={false} imageUrl={track?.artworkUrl} imageOpacity={1} imageBlur={0}>
    <div className="kiosk-music-scene relative flex h-full min-h-0 flex-col overflow-hidden p-[clamp(1rem,4vw,4rem)] text-white">
      <div className="kiosk-music-overlay absolute inset-0" aria-hidden="true" />
      <div className="relative z-10 grid min-h-0 flex-1 grid-cols-[minmax(0,45fr)_minmax(0,55fr)] items-center gap-[clamp(1rem,4vw,4rem)]">
        <div className="kiosk-music-primary min-w-0">
          <div className="kiosk-music-art mb-[clamp(1rem,3vw,2rem)] aspect-square w-[min(100%,clamp(9rem,28vw,25rem))] overflow-hidden rounded-[clamp(.5rem,1vw,1rem)] bg-black/40 shadow-2xl">{track?.artworkUrl ? <img src={track.artworkUrl} alt="" draggable={false} className="h-full w-full object-cover" onError={(event) => { event.currentTarget.style.display = "none"; }} /> : <span className="grid h-full place-items-center text-5xl text-fuchsia-100/65">♫</span>}</div>
          <p className="text-[.65rem] font-semibold uppercase tracking-[.3em] text-fuchsia-200/75">{statusLabel}</p>
          <h1 className="mt-3 line-clamp-2 text-[clamp(1.5rem,4vw,3.4rem)] font-semibold leading-tight">{disconnected ? "Connect Spotify from Cosmic Account Settings" : providerFailure ? "Music temporarily unavailable" : track ? track.title : "Nothing playing right now."}</h1>
          <p className="mt-2 truncate text-[clamp(.9rem,2vw,1.35rem)] text-white/75">{track?.artists.join(", ") ?? (music.error ? "Cosmic will retry automatically." : "Music is idle")}</p>
          {track?.album ? <p className="mt-2 truncate text-sm uppercase tracking-[.16em] text-white/50">{track.album}</p> : null}
          {stale ? <p className="mt-3 text-xs uppercase tracking-[.18em] text-amber-100/65">Reconnecting…</p> : null}
          {track && duration ? <div className="kiosk-music-progress mt-[clamp(1.25rem,4vw,2.5rem)] max-w-2xl"><div className="h-1.5 overflow-hidden rounded-full bg-white/20"><div className="h-full rounded-full bg-fuchsia-200" style={{ width: `${Math.min(100, progressMs / duration * 100)}%` }} /></div><div className="mt-2 flex justify-between text-xs tabular-nums text-white/65"><span>{formatDuration(progressMs)}</span><span>{formatDuration(duration)}</span></div></div> : null}
        </div>
        <aside className="kiosk-music-lyrics min-w-0 self-center" aria-label="Lyrics"><p className="text-xs font-semibold uppercase tracking-[.3em] text-white/55">LYRICS</p><p className="mt-4 text-[clamp(1rem,2vw,1.5rem)] text-white/55">Not available for this track.</p></aside>
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
