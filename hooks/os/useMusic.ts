"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { MusicSnapshot } from "@/core/contracts/Music";
import { useVisiblePolling } from "@/hooks/useVisiblePolling";
import { useCosmicScope } from "@/services/storage/scope";
import { kioskApiUrl } from "@/services/kioskRequest";
import { KIOSK_REFRESH_MS, musicBackoffMs, sceneRefreshDiagnostics } from "@/services/kiosk/refreshPolicy";
import { useConnectionHealth } from "@/services/kiosk/ConnectionHealthProvider";
import { fetchWithTimeout } from "@/services/kiosk/fetchWithTimeout";

interface UseMusicOptions {
  refreshMs?: number | ((snapshot: MusicSnapshot | null) => number);
  enabled?: boolean;
}

const musicCache = new Map<string, MusicSnapshot>();

export function isMusicConfigured(snapshot: MusicSnapshot | null) {
  return snapshot?.configured === true;
}

export function useMusic({ refreshMs, enabled = true }: UseMusicOptions = {}) {
  const scope = useCosmicScope();
  const { recordAttempt, recordSuccess, recordFailure } = useConnectionHealth();
  const [snapshot, setSnapshot] = useState<MusicSnapshot | null>(() => musicCache.get(scope.id) ?? null);
  const hasLoaded = useRef(false);
  const refreshPromiseRef = useRef<Promise<void> | null>(null);
  const requestSequenceRef = useRef(0);
  const latestAcceptedSequenceRef = useRef(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [requestError, setRequestError] = useState<string>();
  const [actionError, setActionError] = useState<string>();
  const [actionLoading, setActionLoading] = useState(false);
  const [lastSuccessfulRefreshAt, setLastSuccessfulRefreshAt] = useState<string>();
  const [failureCount, setFailureCount] = useState(0);
  const [retryAfterMs, setRetryAfterMs] = useState<number>();

  const refresh = useCallback(async () => {
    if (refreshPromiseRef.current) return refreshPromiseRef.current;

    const initial = !hasLoaded.current;
    const requestSequence = ++requestSequenceRef.current;

    if (initial) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    const request = (async () => {
      try {
        recordAttempt("music");
        const response = await fetchWithTimeout(kioskApiUrl("/api/music"), { credentials: "include", cache: "no-store" });

        if (!response.ok) {
          const retryAfter = response.headers.get("Retry-After");
          const retryAfterValue = retryAfter && /^\d+(?:\.\d+)?$/.test(retryAfter) ? Number(retryAfter) * 1000 : undefined;
          const failure = new Error("Music is unavailable.") as Error & { retryAfterMs?: number };
          failure.retryAfterMs = retryAfterValue;
          throw failure;
        }

        const next = await response.json() as MusicSnapshot;
        if (requestSequence < latestAcceptedSequenceRef.current) return;
        latestAcceptedSequenceRef.current = requestSequence;
        if (process.env.NODE_ENV !== "production") console.info(`[use-music] direct-response trackPresent=${Boolean(next.playback.track)} trackIdSuffix=${next.playback.track?.id?.slice(-4) ?? "none"} title=${JSON.stringify(next.playback.track?.title ?? null)}`);
        setSnapshot(next);
        musicCache.set(scope.id, next);
        setLastSuccessfulRefreshAt(new Date().toISOString());
        setRequestError(undefined);
        setFailureCount(0);
        setRetryAfterMs(undefined);
        recordSuccess("music");
        window.dispatchEvent(new CustomEvent("cosmic:music-updated"));
      } catch (cause) {
        if (cause instanceof DOMException && cause.name === "AbortError") return;
        const failure = cause as Error & { retryAfterMs?: number };
        setFailureCount((count) => count + 1);
        setRetryAfterMs(failure.retryAfterMs);
        recordFailure("music", "provider-error");
        setRequestError(cause instanceof Error ? cause.message : "Music is unavailable.");
      } finally {
        hasLoaded.current = true;
        setLoading(false);
        setRefreshing(false);
      }
    })();

    refreshPromiseRef.current = request;
    try {
      await request;
    } finally {
      if (refreshPromiseRef.current === request) refreshPromiseRef.current = null;
    }
  }, [recordAttempt, recordFailure, recordSuccess, scope.id]);

  useEffect(() => {
    if (!enabled || refreshMs !== undefined) return;

    const initial = window.setTimeout(() => {
      void refresh();
    }, 0);

    return () => window.clearTimeout(initial);
  }, [enabled, refresh, refreshMs, scope.id]);

  useEffect(() => { const timer = window.setTimeout(() => { const cachedSnapshot = musicCache.get(scope.id) ?? null; setSnapshot(cachedSnapshot); setLoading(!cachedSnapshot); setRequestError(undefined); setLastSuccessfulRefreshAt(cachedSnapshot ? new Date().toISOString() : undefined); hasLoaded.current = false; }, 0); return () => window.clearTimeout(timer); }, [scope.id]);
  useEffect(() => {
    const syncCachedMusic = () => {
      const next = musicCache.get(scope.id);
      if (next) { setSnapshot(next); setLoading(false); setRequestError(undefined); hasLoaded.current = true; }
    };
    window.addEventListener("cosmic:music-updated", syncCachedMusic);
    return () => window.removeEventListener("cosmic:music-updated", syncCachedMusic);
  }, [scope.id]);

  const intervalMs = typeof refreshMs === "function" ? refreshMs(snapshot) : refreshMs;
  const effectiveIntervalMs = intervalMs === undefined ? undefined : Math.max(intervalMs, musicBackoffMs(failureCount, retryAfterMs));
  useVisiblePolling(refresh, effectiveIntervalMs ?? 0, { enabled: enabled && effectiveIntervalMs !== undefined }, "music");

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") console.info(`[use-music] hook-state trackPresent=${Boolean(snapshot?.playback.track)} trackIdSuffix=${snapshot?.playback.track?.id?.slice(-4) ?? "none"} title=${JSON.stringify(snapshot?.playback.track?.title ?? null)}`);
  }, [snapshot?.playback.track, snapshot?.playback.track?.id, snapshot?.playback.track?.title]);

  const command = useCallback(async (action: string, value?: number) => {
    if (actionLoading) {
      return;
    }

    setActionLoading(true);
    setActionError(undefined);

    try {
      const response = await fetch(kioskApiUrl("/api/music/action"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, value }),
      });
      const result = await response.json() as { error?: string };

      if (!response.ok) {
        throw new Error(result.error ?? "Music action failed.");
      }

      await refresh();
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : "Music action failed.");
    } finally {
      setActionLoading(false);
    }
  }, [actionLoading, refresh]);

  const providerError = snapshot?.error;
  const error = requestError ?? providerError ?? actionError;

  return {
    snapshot,
    loading,
    refreshing,
    error,
    requestError,
    providerError,
    actionError,
    refresh,
    refreshDiagnostics: sceneRefreshDiagnostics(lastSuccessfulRefreshAt, effectiveIntervalMs ?? KIOSK_REFRESH_MS.musicIdle, effectiveIntervalMs !== undefined && effectiveIntervalMs <= KIOSK_REFRESH_MS.musicActive ? "live" : "active"),
    actionLoading,
    configured: isMusicConfigured(snapshot),
    connected: snapshot?.connected ?? false,
    reconnectRequired: !snapshot?.connected && Boolean(providerError && /reconnect/i.test(providerError)),
    provider: snapshot?.provider,
    playback: snapshot?.playback,
    capabilities: snapshot?.capabilities,
    play: () => command("play"),
    pause: () => command("pause"),
    next: () => command("next"),
    previous: () => command("previous"),
    seek: (value: number) => command("seek", value),
    setVolume: (value: number) => command("volume", value),
  };
}
