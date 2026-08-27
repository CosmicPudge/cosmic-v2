"use client";

import { useEffect, useId, useState, type CSSProperties } from "react";
import type { MusicProviderKind } from "@/core/contracts/Music";
import { useKioskSlideshowControl } from "@/components/os/kiosk/KioskSlideshowContext";
import { useWidgetContext } from "@/components/os/ui/widget/WidgetContext";
import Widget from "@/components/os/ui/widget/Widget";
import { useMusic } from "@/hooks/os/useMusic";

interface ProviderPresentation { id: MusicProviderKind; label: string; accent: string; logoSrc?: string; }

function resolveProvider(provider?: MusicProviderKind): ProviderPresentation | null {
  if (provider === "spotify") return { id: "spotify", label: "Spotify", accent: "#1ed760", logoSrc: "/kiosk/brands/spotify.svg" };
  if (provider === "appleMusic") return { id: "appleMusic", label: "Apple Music", accent: "#fa2d48" };
  if (provider === "local") return { id: "local", label: "Cosmic Music", accent: "#f0abfc" };
  return null;
}

export default function KioskMusicWidget({ music }: { music: ReturnType<typeof useMusic> }) {
  const { active } = useWidgetContext();
  const source = useId();
  const { setMusicPlaying } = useKioskSlideshowControl();
  const track = music.playback?.track;
  const provider = resolveProvider(music.provider);
  const playing = Boolean(music.playback?.playing);
  const hasTrack = Boolean(track?.title && track.artists?.length);
  const hasTemporaryError = Boolean(music.error);
  useEffect(() => { setMusicPlaying(source, Boolean(active && playing)); return () => setMusicPlaying(source, false); }, [active, playing, setMusicPlaying, source]);
  const duration = music.playback?.durationMs ?? track?.durationMs;
  const progressMs = useSmoothProgress(music.playback?.positionMs ?? 0, duration, playing, track?.id);
  return <Widget accent="music" className="kiosk-music-widget" contentPadding={false} hover={false} imageUrl={hasTrack ? track?.artworkUrl : undefined} imageOpacity={1} imageBlur={0}>
    <div className="kiosk-music-scene relative flex h-full min-h-0 flex-col overflow-hidden text-white" data-music-provider={provider?.id ?? "none"}>
      <div className="kiosk-music-overlay absolute inset-0" aria-hidden="true" />
      {hasTrack ? <PlayingScene music={music} track={track!} duration={duration} progressMs={progressMs} playing={playing} reconnecting={hasTemporaryError} /> : <ProviderScene provider={provider} connected={music.connected} configured={music.configured} playing={playing} error={hasTemporaryError} />}
    </div>
  </Widget>;
}

function PlayingScene({ music, track, duration, progressMs, playing, reconnecting }: { music: ReturnType<typeof useMusic>; track: NonNullable<ReturnType<typeof useMusic>["playback"]>["track"] & object; duration?: number; progressMs: number; playing: boolean; reconnecting: boolean }) {
  return <div className="kiosk-music-playing relative z-10 grid min-h-0 flex-1 grid-cols-[minmax(0,45fr)_minmax(0,55fr)] items-center gap-[clamp(1.25rem,5vw,5rem)] p-[clamp(1.25rem,6vw,6rem)]"><div className="kiosk-music-primary min-w-0 justify-self-center"><div className="kiosk-music-art aspect-square w-[min(42vw,42vh,32rem)] overflow-hidden rounded-[clamp(.5rem,1vw,1rem)] bg-black/35 shadow-2xl">{track.artworkUrl ? <img src={track.artworkUrl} alt="" draggable={false} className="h-full w-full object-cover" onError={(event) => { event.currentTarget.style.display = "none"; }} /> : <span className="grid h-full place-items-center text-6xl text-white/45">♫</span>}</div></div><div className="min-w-0 max-w-3xl"><p className="text-[.7rem] font-semibold uppercase tracking-[.3em] text-emerald-200/85">{playing ? "PLAYING" : "PAUSED"}</p>{reconnecting ? <p className="mt-2 text-xs uppercase tracking-[.2em] text-amber-100/70">Reconnecting…</p> : null}<h1 className="mt-4 line-clamp-2 text-[clamp(1.8rem,4.8vw,5rem)] font-semibold leading-[.98] tracking-[-.03em]">{track.title}</h1><p className="mt-4 truncate text-[clamp(1rem,2.1vw,1.6rem)] text-white/80">{track.artists.join(", ")}</p>{track.album ? <p className="mt-2 truncate text-[clamp(.75rem,1.3vw,1rem)] uppercase tracking-[.18em] text-white/50">{track.album}</p> : null}{duration ? <ProgressBar progressMs={progressMs} duration={duration} /> : null}{music.playback?.deviceName ? <p className="mt-5 text-xs uppercase tracking-[.18em] text-white/40">Playing on {music.playback.deviceName}</p> : null}</div></div>;
}

function ProviderScene({ provider, connected, configured, playing, error }: { provider: ProviderPresentation | null; connected: boolean; configured: boolean; playing: boolean; error: boolean }) {
  const name = provider?.label ?? "Cosmic Music";
  const waitingForMetadata = Boolean(provider && connected && playing && !error);
  const temporaryFailure = Boolean(provider && connected && error);
  return <div className="kiosk-music-provider-state relative z-10 flex min-h-0 flex-1 flex-col items-center justify-center p-[clamp(1.5rem,7vw,7rem)] text-center" style={{ "--music-provider-accent": provider?.accent ?? "#f0abfc" } as CSSProperties}>{provider ? <ProviderMark presentation={provider} /> : <div className="kiosk-music-cosmic-mark">♫</div>}<p className="mt-6 text-[.7rem] font-semibold uppercase tracking-[.34em] text-[color:var(--music-provider-accent)]">{name}</p><h1 className="mt-4 text-[clamp(1.5rem,3.5vw,3.4rem)] font-semibold tracking-tight">{temporaryFailure ? "Temporarily unavailable" : waitingForMetadata ? "Playback detected" : provider && connected ? "Nothing playing right now" : configured ? "Connect your music service" : "No music service connected"}</h1><p className="mt-3 max-w-xl text-[clamp(.85rem,1.5vw,1.1rem)] leading-relaxed text-white/55">{temporaryFailure ? "Cosmic will retry automatically." : waitingForMetadata ? `${name} is connected. Waiting for track information…` : provider && connected ? `Connected to your Cosmic profile. Start playing something on ${name} and it will appear here.` : "Connect Spotify from Cosmic Account Settings."}</p></div>;
}

function ProviderMark({ presentation }: { presentation: ProviderPresentation }) {
  if (presentation.logoSrc) return <img className="kiosk-music-provider-mark" src={presentation.logoSrc} alt={presentation.label} draggable={false} />;
  if (presentation.id === "appleMusic") return null;
  return <div className="kiosk-music-provider-mark grid place-items-center rounded-2xl border border-fuchsia-200/30 text-4xl text-fuchsia-200">♫</div>;
}

function ProgressBar({ progressMs, duration }: { progressMs: number; duration: number }) { return <div className="kiosk-music-progress mt-[clamp(1.5rem,4vw,3rem)] max-w-2xl"><div className="h-1.5 overflow-hidden rounded-full bg-white/20"><div className="h-full rounded-full bg-emerald-300" style={{ width: `${Math.min(100, progressMs / duration * 100)}%` }} /></div><div className="mt-2 flex justify-between text-xs tabular-nums text-white/60"><span>{formatDuration(progressMs)}</span><span>{formatDuration(duration)}</span></div></div>; }

function useSmoothProgress(positionMs: number, durationMs: number | undefined, playing: boolean, trackId: string | undefined) { const key = `${trackId ?? ""}:${positionMs}:${durationMs ?? ""}:${playing}`; const [baseline, setBaseline] = useState({ key: "", positionMs, startedAt: 0 }); const [now, setNow] = useState(0); useEffect(() => { const sync = () => { const timestamp = Date.now(); setBaseline({ key, positionMs, startedAt: timestamp }); setNow(timestamp); }; const initial = window.setTimeout(sync, 0); if (!playing || !durationMs) return () => window.clearTimeout(initial); const timer = window.setInterval(() => setNow(Date.now()), 250); return () => { window.clearTimeout(initial); window.clearInterval(timer); }; }, [durationMs, key, playing, positionMs]); return playing && durationMs && baseline.key === key ? Math.min(durationMs, baseline.positionMs + now - baseline.startedAt) : positionMs; }
function formatDuration(value: number) { const totalSeconds = Math.max(0, Math.floor(value / 1000)); const hours = Math.floor(totalSeconds / 3600); const minutes = Math.floor(totalSeconds / 60) % 60; const seconds = totalSeconds % 60; return hours ? `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}` : `${minutes}:${String(seconds).padStart(2, "0")}`; }
