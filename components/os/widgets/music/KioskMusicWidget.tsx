"use client";

import { useEffect, useId, useMemo, useState, type CSSProperties } from "react";

import type { MusicArtist, MusicTrack, PlaybackMediaType } from "@/core/contracts/Music";
import { useKioskSlideshowControl } from "@/components/os/kiosk/KioskSlideshowContext";
import { useWidgetContext } from "@/components/os/ui/widget/WidgetContext";
import Widget from "@/components/os/ui/widget/Widget";
import { useMusic } from "@/hooks/os/useMusic";

type KioskMusicState = "track" | "podcast-detected" | "playback-detected" | "error" | "idle" | "no-provider";

function hasRenderableTrack(track: MusicTrack | undefined): track is MusicTrack {
  return Boolean(track?.id && track.title.trim());
}

function mediaType(track: MusicTrack): PlaybackMediaType { return track.mediaType ?? "unknown"; }

function classifyState(music: ReturnType<typeof useMusic>, track: MusicTrack | undefined): KioskMusicState {
  if (hasRenderableTrack(track)) return "track";
  if (music.playback?.mediaType === "podcast" && music.connected) return "podcast-detected";
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
  const { active } = useWidgetContext();
  const source = useId();
  const { setMusicPlaying } = useKioskSlideshowControl();
  const track = music.playback?.track;
  const state = classifyState(music, track);
  const provider = providerName(music.provider);
  const accent = music.provider === "spotify" ? "#1ed760" : "#f0abfc";

  useEffect(() => {
    setMusicPlaying(source, Boolean(active && music.playback?.playing));
    return () => setMusicPlaying(source, false);
  }, [active, music.playback?.playing, setMusicPlaying, source]);

  return <Widget accent="music" className="kiosk-music-widget" contentPadding={false} hover={false} imageOpacity={0} imageBlur={0}>
    <div className="kiosk-music-scene">
      {hasRenderableTrack(track) && track.artworkUrl ? <img className="kiosk-music-background" src={track.artworkUrl} alt="" draggable={false} onError={(event) => { event.currentTarget.style.display = "none"; }} /> : null}
      <div className="kiosk-music-overlay" aria-hidden="true" />
      <div key={`${track?.id ?? "none"}:${state}`} className="kiosk-music-transition" aria-hidden="true" />
      <div className="kiosk-music-content" style={{ "--kiosk-music-accent": accent } as CSSProperties}>
        {state === "track" && hasRenderableTrack(track) ? <PlayingState key={track.id} music={music} track={track} provider={provider} /> : state !== "track" ? <StatusState state={state} provider={provider} /> : null}
      </div>
    </div>
  </Widget>;
}

function PlayingState({ music, track, provider }: { music: ReturnType<typeof useMusic>; track: MusicTrack; provider: string }) {
  const progress = useTrackProgress(music.playback?.positionMs ?? 0, music.playback?.durationMs ?? track.durationMs, music.playback?.playing ?? false, track.id);
  const artists = useMemo<MusicArtist[]>(() => (track.artistProfiles?.length ? track.artistProfiles : track.artists.map((name) => ({ name }))).slice(0, 3), [track.artistProfiles, track.artists]);
  const primaryArtist = artists[0];
  const type = mediaType(track);
  const spokenType = type === "podcast" || type === "audiobook";
  const titleLabel = type === "podcast" ? "EPISODE" : type === "audiobook" ? "AUDIOBOOK" : "NOW PLAYING";
  const subtitle = type === "podcast" ? track.subtitle : track.artists.join(", ");
  const tertiary = type === "podcast" ? track.tertiaryText : type === "audiobook" ? track.subtitle : track.tertiaryText ?? track.album;

  return <div className="kiosk-music-playing">
    <div className="kiosk-music-artist-section">
      {!spokenType && primaryArtist ? <ArtistPortrait artist={primaryArtist} /> : track.artworkUrl ? <ArtworkPortrait artworkUrl={track.artworkUrl} label={type === "podcast" ? "Podcast artwork" : "Audiobook artwork"} /> : <div className="kiosk-music-artist-placeholder">♫</div>}
      {!spokenType && artists.length > 1 ? <div className="kiosk-music-supporting-artists">{artists.slice(1).map((artist, index) => <ArtistPortrait key={`${artist.id ?? artist.name}-${index}`} artist={artist} small />)}</div> : null}
    </div>
    <div className="kiosk-music-details">
      <p className="kiosk-music-status">{provider} <span aria-hidden="true">•</span> {titleLabel} <span aria-hidden="true">•</span> {music.playback?.playing ? "PLAYING" : "PAUSED"}</p>
      <h1>{track.title}</h1>
      {subtitle ? <p className="kiosk-music-artists">{subtitle}</p> : null}
      {tertiary ? <p className="kiosk-music-album">{tertiary}</p> : null}
      {music.playback?.durationMs || track.durationMs ? <ProgressBar progress={progress} duration={music.playback?.durationMs ?? track.durationMs ?? 0} /> : null}
      {music.playback?.deviceName ? <p className="kiosk-music-device">PLAYING ON {music.playback.deviceName}</p> : null}
    </div>
  </div>;
}

function ArtworkPortrait({ artworkUrl, label }: { artworkUrl: string; label: string }) {
  return <div className="kiosk-music-artist-portrait"><img src={artworkUrl} alt={label} draggable={false} onError={(event) => { event.currentTarget.style.display = "none"; }} /></div>;
}

function StatusState({ state, provider }: { state: Exclude<KioskMusicState, "track">; provider: string }) {
  const title = state === "podcast-detected" ? "Podcast playback detected" : state === "playback-detected" ? "Playback detected" : state === "error" ? "Music temporarily unavailable" : state === "idle" ? "Nothing is playing" : "No music service connected";
  const detail = state === "podcast-detected" ? `${provider} is active; episode details are not available yet.` : state === "playback-detected" ? `${provider} is active, but track details are not available yet.` : state === "error" ? "Cosmic will retry automatically." : state === "idle" ? "Start playing something on Spotify." : "Connect a music service from Cosmic Account Settings.";
  return <div className="kiosk-music-status-state">{provider === "Spotify" ? <img className="kiosk-music-provider-logo" src="/kiosk/brands/spotify.svg" alt="Spotify" draggable={false} /> : <div className="kiosk-music-mark">♫</div>}<p className="kiosk-music-status">{provider}</p><h1>{title}</h1><p>{detail}</p></div>;
}

function ArtistPortrait({ artist, small = false }: { artist: MusicArtist; small?: boolean }) {
  const initials = artist.name.split(/\s+/).map((part) => part[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
  return <div className={small ? "kiosk-music-artist-portrait kiosk-music-artist-portrait-small" : "kiosk-music-artist-portrait"}>{artist.imageUrl ? <img src={artist.imageUrl} alt={`${artist.name} profile`} draggable={false} onError={(event) => { event.currentTarget.style.display = "none"; }} /> : <span>{initials}</span>}</div>;
}

function ProgressBar({ progress, duration }: { progress: number; duration: number }) {
  const ratio = duration > 0 ? Math.min(1, Math.max(0, progress / duration)) : 0;
  return <div className="kiosk-music-progress"><div className="kiosk-music-progress-track"><span style={{ width: `${ratio * 100}%` }} /></div><div><span>{formatDuration(progress)}</span><span>{formatDuration(duration)}</span></div></div>;
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
