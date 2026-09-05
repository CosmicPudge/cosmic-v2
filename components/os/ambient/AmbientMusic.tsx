"use client";

import { useEffect, useState } from "react";
import { useMusic } from "@/hooks/os/useMusic";
import { deriveAmbientProgress, formatAmbientProgress } from "@/services/music/ambientProgress";

const PROVIDER_REFRESH_MS = 10_000;

function useAmbientProgress(music: ReturnType<typeof useMusic>) {
  const playback = music.playback;
  const [now, setNow] = useState(0);
  const trackId = playback?.track?.id;
  useEffect(() => {
    if (!playback?.playing) return;
    let timer: number | undefined;
    const start = () => {
      if (document.visibilityState !== "visible" || timer !== undefined) return;
      timer = window.setInterval(() => setNow(Date.now()), 1_000);
    };
    const stop = () => { if (timer !== undefined) { window.clearInterval(timer); timer = undefined; } };
    const handleVisibility = () => { if (document.visibilityState === "visible") start(); else stop(); };
    document.addEventListener("visibilitychange", handleVisibility);
    start();
    return () => { stop(); document.removeEventListener("visibilitychange", handleVisibility); };
  }, [playback?.playing, playback?.positionMs, playback?.updatedAt, trackId]);
  return deriveAmbientProgress({ positionMs: playback?.positionMs ?? 0, durationMs: playback?.durationMs ?? playback?.track?.durationMs, playing: playback?.playing ?? false, updatedAt: playback?.updatedAt }, now || undefined);
}

export default function AmbientMusic() {
  const music = useMusic({ refreshMs: PROVIDER_REFRESH_MS });
  const track = music.playback?.track;
  const progress = useAmbientProgress(music);

  if (music.loading) {
    return <p className="ambient-muted">Checking now playing…</p>;
  }

  if (music.error && !music.connected) {
    return <div><p className="ambient-card-value">Music unavailable</p><p className="ambient-card-detail">Playback could not be refreshed.</p></div>;
  }

  if (!music.connected) {
    return <div><p className="ambient-card-value">Music standby</p><p className="ambient-card-detail">Connect a music provider to see playback here.</p></div>;
  }

  if (!track) {
    return <div><p className="ambient-card-value">Nothing playing</p><p className="ambient-card-detail">Your connected music is ready when you are.</p></div>;
  }

  const creator = track.mediaType === "podcast" || track.mediaType === "audiobook" ? track.subtitle : track.artists.join(", ");
  const collection = track.mediaType === "podcast" || track.mediaType === "audiobook" ? track.tertiaryText : track.album;
  const hasDuration = typeof progress.durationMs === "number" && progress.durationMs > 0;
  const durationMs = progress.durationMs ?? 0;
  const ratio = hasDuration ? (progress.progressMs / durationMs) * 100 : 0;
  return <div className="ambient-now-playing"><div className="ambient-now-artwork" style={track.artworkUrl ? { backgroundImage: `url("${track.artworkUrl}")` } : undefined} aria-label={track.artworkUrl ? `${track.title} artwork` : undefined} role={track.artworkUrl ? "img" : undefined}><span aria-hidden="true">♫</span></div><div className="ambient-now-details"><div className="ambient-now-status"><span className="ambient-live-dot is-live" />{music.playback?.playing ? "Now playing" : "Paused"}{progress.stale ? " · Stale" : ""}</div><p className="ambient-now-title" title={track.title}>{track.title}</p>{creator ? <p className="ambient-now-creator" title={creator}>{creator}</p> : null}{collection ? <p className="ambient-now-collection" title={collection}>{collection}</p> : null}{hasDuration ? <div className="ambient-now-progress"><div className="ambient-now-progress-track"><span style={{ width: `${Math.min(100, Math.max(0, ratio))}%` }} /></div><div><span>{formatAmbientProgress(progress.progressMs)}</span><span>{formatAmbientProgress(durationMs)}</span></div></div> : null}</div></div>;
}
