"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";

import type { MusicArtist, MusicTrack } from "@/core/contracts/Music";
import Widget from "@/components/os/ui/widget/Widget";
import { useMusic } from "@/hooks/os/useMusic";

type KioskMusicState = "track" | "playback-detected" | "error" | "idle" | "no-provider";

function hasRenderableTrack(track: MusicTrack | undefined): track is MusicTrack {
  return Boolean(track?.id && track.title.trim() && track.artists.some((artist) => artist.trim()));
}

function classifyState(music: ReturnType<typeof useMusic>, track: MusicTrack | undefined): KioskMusicState {
  if (hasRenderableTrack(track)) return "track";
  if (music.connected && music.playback?.playing) return "playback-detected";
  if (music.error && music.connected) return "error";
  if (music.connected) return "idle";
  return "no-provider";
}

function providerName(provider: ReturnType<typeof useMusic>["provider"]) {
  if (provider === "spotify") return "Spotify";
  if (provider === "appleMusic") return "Apple Music";
  if (provider === "local") return "Cosmic Music";
  return "Cosmic Music";
}

export default function KioskMusicWidget({ music }: { music: ReturnType<typeof useMusic> }) {
  const track = music.playback?.track;
  const state = classifyState(music, track);
  const provider = providerName(music.provider);
  const accent = music.provider === "spotify" ? "#1ed760" : "#f0abfc";

  return <Widget accent="music" className="kiosk-music-widget" contentPadding={false} hover={false} imageOpacity={0} imageBlur={0}>
    <div className="kiosk-music-scene">
      {hasRenderableTrack(track) && track.artworkUrl ? <img className="kiosk-music-background" src={track.artworkUrl} alt="" draggable={false} onError={(event) => { event.currentTarget.style.display = "none"; }} /> : null}
      <div className="kiosk-music-overlay" aria-hidden="true" />
      <div className="kiosk-music-content" style={{ "--kiosk-music-accent": accent } as CSSProperties}>
        {state === "track" && hasRenderableTrack(track) ? <PlayingState music={music} track={track} provider={provider} /> : state !== "track" ? <StatusState state={state} provider={provider} /> : null}
      </div>
    </div>
  </Widget>;
}

function PlayingState({ music, track, provider }: { music: ReturnType<typeof useMusic>; track: MusicTrack; provider: string }) {
  const progress = useTrackProgress(music.playback?.positionMs ?? 0, music.playback?.durationMs ?? track.durationMs, music.playback?.playing ?? false, track.id);
  const artists = useMemo<MusicArtist[]>(() => (track.artistProfiles?.length ? track.artistProfiles : track.artists.map((name) => ({ name }))).slice(0, 2), [track.artistProfiles, track.artists]);

  return <div className="kiosk-music-playing">
    <div className="kiosk-music-art-section">
      <div className="kiosk-music-art-frame">
        {track.artworkUrl ? <img src={track.artworkUrl} alt={`${track.title} artwork`} draggable={false} /> : <span aria-hidden="true">♫</span>}
      </div>
    </div>
    <div className="kiosk-music-details">
      <p className="kiosk-music-status">{provider} <span aria-hidden="true">•</span> {music.playback?.playing ? "NOW PLAYING" : "PAUSED"}</p>
      <h1>{track.title}</h1>
      <div className="kiosk-music-artists">
        {artists.map((artist, index) => <ArtistAvatar key={`${artist.id ?? artist.name}-${index}`} artist={artist} />)}
        <p>{track.artists.join(", ")}</p>
      </div>
      {track.album ? <p className="kiosk-music-album">{track.album}</p> : null}
      {music.playback?.durationMs || track.durationMs ? <ProgressBar progress={progress} elapsed={progress} duration={music.playback?.durationMs ?? track.durationMs ?? 0} /> : null}
      {music.playback?.deviceName ? <p className="kiosk-music-device">PLAYING ON {music.playback.deviceName}</p> : null}
    </div>
  </div>;
}

function StatusState({ state, provider }: { state: Exclude<KioskMusicState, "track">; provider: string }) {
  const title = state === "playback-detected" ? "Playback detected" : state === "error" ? "Music temporarily unavailable" : state === "idle" ? "Nothing playing right now" : "No music service connected";
  const detail = state === "playback-detected" ? `${provider} is active, but track details are not available yet.` : state === "error" ? "Cosmic will retry automatically." : state === "idle" ? `Start playing something on ${provider} and it will appear here.` : "Connect a music service from Cosmic Account Settings.";
  return <div className="kiosk-music-status-state"><div className="kiosk-music-mark">♫</div><p className="kiosk-music-status">{provider}</p><h1>{title}</h1><p>{detail}</p></div>;
}

function ArtistAvatar({ artist }: { artist: MusicArtist }) {
  const initials = artist.name.split(/\s+/).map((part) => part[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
  return <span className="kiosk-music-artist-avatar">{artist.imageUrl ? <img src={artist.imageUrl} alt="" draggable={false} onError={(event) => { event.currentTarget.style.display = "none"; }} /> : initials}</span>;
}

function ProgressBar({ progress, elapsed, duration }: { progress: number; elapsed: number; duration: number }) {
  const ratio = duration > 0 ? Math.min(1, Math.max(0, progress / duration)) : 0;
  return <div className="kiosk-music-progress"><div className="kiosk-music-progress-track"><span style={{ width: `${ratio * 100}%` }} /></div><div><span>{formatDuration(elapsed)}</span><span>{formatDuration(duration)}</span></div></div>;
}

function useTrackProgress(positionMs: number, durationMs: number | undefined, playing: boolean, trackId: string) {
  const [value, setValue] = useState(positionMs);
  useEffect(() => {
    const start = Math.max(0, positionMs);
    const reset = window.setTimeout(() => setValue(start), 0);
    if (!playing || !durationMs) return () => window.clearTimeout(reset);
    const startedAt = Date.now();
    const timer = window.setInterval(() => setValue(Math.min(durationMs, start + Date.now() - startedAt)), 250);
    return () => { window.clearTimeout(reset); window.clearInterval(timer); };
  }, [durationMs, playing, positionMs, trackId]);
  return durationMs ? Math.min(durationMs, Math.max(0, value)) : Math.max(0, value);
}

function formatDuration(value: number) {
  const totalSeconds = Math.max(0, Math.floor(value / 1000));
  return `${Math.floor(totalSeconds / 60)}:${String(totalSeconds % 60).padStart(2, "0")}`;
}
