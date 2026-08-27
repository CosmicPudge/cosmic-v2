"use client";

import { useEffect, useId, useRef, useState, type CSSProperties } from "react";
import type { MusicArtist, MusicProviderKind } from "@/core/contracts/Music";
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
  const sceneState = hasTrack ? "track" : music.connected && playing ? "playback-detected" : "idle";
  const lastTrackId = useRef<string | undefined>(undefined);
  useEffect(() => { setMusicPlaying(source, Boolean(active && playing)); return () => setMusicPlaying(source, false); }, [active, playing, setMusicPlaying, source]);
  useEffect(() => { if (process.env.NODE_ENV !== "production") { const changed = lastTrackId.current !== undefined && lastTrackId.current !== track?.id; console.info(`[music-poll] responseTrackPresent=${Boolean(track)} responseTrackChanged=${changed}`); console.info(`[kiosk-music] state=${sceneState} currentTrackPresent=${Boolean(track)} renderedTrackMatchesCurrent=true artworkPresent=${Boolean(track?.artworkUrl)} artistProfiles=${track?.artistProfiles?.length ?? 0}`); lastTrackId.current = track?.id; } }, [sceneState, track]);
  return <Widget accent="music" className="kiosk-music-widget" contentPadding={false} hover={false} imageOpacity={1} imageBlur={0}>
    <div className="kiosk-music-scene relative flex h-full min-h-0 flex-col overflow-hidden text-white" data-music-provider={provider?.id ?? "none"}>
      <div className="kiosk-music-backgrounds absolute inset-0" aria-hidden="true">
        {track?.artworkUrl ? <img className="kiosk-music-background kiosk-music-background-current" src={track.artworkUrl} alt="" draggable={false} onError={(event) => { event.currentTarget.style.display = "none"; }} /> : null}
      </div>
      <div className="kiosk-music-overlay absolute inset-0" aria-hidden="true" />
      <div className="kiosk-music-layer relative z-[2] flex h-full min-h-0 flex-1">
        {hasTrack ? <PlayingScene music={music} track={track!} duration={music.playback?.durationMs ?? track?.durationMs} progressMs={music.playback?.positionMs ?? 0} playing={playing} reconnecting={hasTemporaryError} /> : <ProviderScene provider={provider} connected={music.connected} configured={music.configured} playing={playing} error={hasTemporaryError} />}
      </div>
    </div>
  </Widget>;
}

function PlayingScene({ music, track, duration, progressMs, playing, reconnecting }: { music: ReturnType<typeof useMusic>; track: NonNullable<ReturnType<typeof useMusic>["playback"]>["track"] & object; duration?: number; progressMs: number; playing: boolean; reconnecting: boolean }) {
  const interpolatedProgress = useSmoothProgress(progressMs, duration, playing, track.id);
  return <div className="kiosk-music-playing relative z-10 grid min-h-0 flex-1 grid-cols-[minmax(0,44fr)_minmax(0,56fr)] items-center gap-[clamp(1rem,3.5vw,4rem)] p-[clamp(.75rem,2vw,2.25rem)]"><div className="kiosk-music-primary min-w-0 justify-self-center"><div className="kiosk-music-art aspect-square w-[min(42vw,42vh,32rem)] overflow-hidden rounded-[clamp(.5rem,1vw,1rem)] bg-black/35 shadow-2xl">{track.artworkUrl ? <img src={track.artworkUrl} alt="" draggable={false} className="h-full w-full object-cover" onError={(event) => { event.currentTarget.style.display = "none"; }} /> : <span className="grid h-full w-full place-items-center text-6xl text-white/45">♫</span>}</div></div><div className="kiosk-music-details min-w-0 max-w-3xl"><p className="text-[.7rem] font-semibold uppercase tracking-[.3em] text-emerald-200/85">{playing ? "PLAYING" : "PAUSED"}</p>{reconnecting ? <p className="mt-2 text-xs uppercase tracking-[.2em] text-amber-100/70">Reconnecting…</p> : null}<h1 className="mt-4 line-clamp-2 text-[clamp(1.8rem,4.8vw,5rem)] font-semibold leading-[.98] tracking-[-.03em]">{track.title}</h1><ArtistProfiles track={track} /><p className="mt-2 truncate text-[clamp(1rem,2.1vw,1.6rem)] text-white/80">{track.artists.join(", ")}</p>{track.album ? <p className="mt-2 truncate text-[clamp(.75rem,1.3vw,1rem)] uppercase tracking-[.18em] text-white/50">{track.album}</p> : null}{duration ? <ProgressBar progressMs={interpolatedProgress} duration={duration} /> : null}{music.playback?.deviceName ? <p className="mt-5 text-xs uppercase tracking-[.18em] text-white/40">Playing on {music.playback.deviceName}</p> : null}</div></div>;
}

function ArtistProfiles({ track }: { track: NonNullable<ReturnType<typeof useMusic>["playback"]>["track"] & object }) {
  const artists: MusicArtist[] = (track.artistProfiles?.length ? track.artistProfiles : track.artists.map((name) => ({ name }))).slice(0, 2);
  return <div className="kiosk-music-artists mt-5 flex items-center gap-3">{artists.map((artist, index) => <ArtistAvatar key={`${artist.id ?? artist.name}-${index}`} artist={artist} />)}{track.artists.length > 2 ? <span className="text-xs text-white/55">+{track.artists.length - 2}</span> : null}</div>;
}

function ArtistAvatar({ artist }: { artist: { name: string; imageUrl?: string | null } }) {
  const [failed, setFailed] = useState(false);
  const initials = artist.name.split(/\s+/).map((part) => part[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
  return <div className="kiosk-music-artist-avatar grid size-[clamp(2.75rem,5vw,4.5rem)] shrink-0 place-items-center overflow-hidden rounded-full border border-white/30 bg-white/10 text-[clamp(.7rem,1.3vw,1rem)] font-semibold text-white/75">{artist.imageUrl && !failed ? <img src={artist.imageUrl} alt={`${artist.name} profile`} draggable={false} className="h-full w-full object-cover" onError={() => setFailed(true)} /> : initials}</div>;
}

function ProviderScene({ provider, connected, configured, playing, error }: { provider: ProviderPresentation | null; connected: boolean; configured: boolean; playing: boolean; error: boolean }) {
  const name = provider?.label ?? "Cosmic Music";
  const waitingForMetadata = Boolean(provider && connected && playing && !error);
  const temporaryFailure = Boolean(provider && connected && error);
  return <div className="kiosk-music-provider-state relative z-10 flex min-h-0 flex-1 flex-col items-center justify-center p-[clamp(1.5rem,7vw,7rem)] text-center" style={{ "--music-provider-accent": provider?.accent ?? "#f0abfc" } as CSSProperties}>{provider ? <ProviderMark presentation={provider} /> : <div className="kiosk-music-cosmic-mark">♫</div>}<p className="mt-6 text-[.7rem] font-semibold uppercase tracking-[.34em] text-[color:var(--music-provider-accent)]">{name}</p><h1 className="mt-4 text-[clamp(1.5rem,3.5vw,3.4rem)] font-semibold tracking-tight">{temporaryFailure ? "Temporarily unavailable" : waitingForMetadata ? "Playback detected" : provider && connected ? "Nothing playing right now" : configured ? "Connect your music service" : "No music service connected"}</h1><p className="mt-3 max-w-xl text-[clamp(.85rem,1.5vw,1.1rem)] leading-relaxed text-white/55">{temporaryFailure ? "Cosmic will retry automatically." : waitingForMetadata ? `${name} is active, but normal track information is not available yet.` : provider && connected ? `Connected to your Cosmic profile. Start playing something on ${name} and it will appear here.` : "Connect Spotify from Cosmic Account Settings."}</p></div>;
}

function ProviderMark({ presentation }: { presentation: ProviderPresentation }) {
  if (presentation.logoSrc) return <img className="kiosk-music-provider-mark" src={presentation.logoSrc} alt={presentation.label} draggable={false} />;
  if (presentation.id === "appleMusic") return null;
  return <div className="kiosk-music-provider-mark grid place-items-center rounded-2xl border border-fuchsia-200/30 text-4xl text-fuchsia-200">♫</div>;
}

function ProgressBar({ progressMs, duration }: { progressMs: number; duration: number }) { return <div className="kiosk-music-progress mt-[clamp(1.5rem,4vw,3rem)] max-w-2xl"><div className="h-1.5 overflow-hidden rounded-full bg-white/20"><div className="h-full rounded-full bg-emerald-300" style={{ width: `${Math.min(100, progressMs / duration * 100)}%` }} /></div><div className="mt-2 flex justify-between text-xs tabular-nums text-white/60"><span>{formatDuration(progressMs)}</span><span>{formatDuration(duration)}</span></div></div>; }

function useSmoothProgress(positionMs: number, durationMs: number | undefined, playing: boolean, trackId: string | undefined) { const key = `${trackId ?? ""}:${positionMs}:${durationMs ?? ""}:${playing}`; const [baseline, setBaseline] = useState({ key: "", positionMs, startedAt: 0 }); const [now, setNow] = useState(0); useEffect(() => { const sync = () => { const timestamp = Date.now(); setBaseline({ key, positionMs, startedAt: timestamp }); setNow(timestamp); }; const initial = window.setTimeout(sync, 0); if (!playing || !durationMs) return () => window.clearTimeout(initial); const timer = window.setInterval(() => setNow(Date.now()), 250); return () => { window.clearTimeout(initial); window.clearInterval(timer); }; }, [durationMs, key, playing, positionMs]); return playing && durationMs && baseline.key === key ? Math.min(durationMs, baseline.positionMs + now - baseline.startedAt) : positionMs; }
function formatDuration(value: number) { const totalSeconds = Math.max(0, Math.floor(value / 1000)); const hours = Math.floor(totalSeconds / 3600); const minutes = Math.floor(totalSeconds / 60) % 60; const seconds = totalSeconds % 60; return hours ? `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}` : `${minutes}:${String(seconds).padStart(2, "0")}`; }
