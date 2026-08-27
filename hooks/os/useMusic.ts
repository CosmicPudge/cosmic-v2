"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { MusicSnapshot } from "@/core/contracts/Music";
import { useVisiblePolling } from "@/hooks/useVisiblePolling";
import { useCosmicScope } from "@/services/storage/scope";
import { kioskApiUrl } from "@/services/kioskRequest";

interface UseMusicOptions {
  refreshMs?: number;
  enabled?: boolean;
}

export function useMusic({ refreshMs, enabled = true }: UseMusicOptions = {}) {
  const [snapshot, setSnapshot] = useState<MusicSnapshot | null>(null);
  const hasLoaded = useRef(false);
  const refreshPromiseRef = useRef<Promise<void> | null>(null);
  const requestSequenceRef = useRef(0);
  const latestAcceptedSequenceRef = useRef(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [requestError, setRequestError] = useState<string>();
  const [actionError, setActionError] = useState<string>();
  const [actionLoading, setActionLoading] = useState(false);
  const scope = useCosmicScope();

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
        const response = await fetch(kioskApiUrl("/api/music"), { credentials: "include", cache: "no-store" });

        if (!response.ok) {
          throw new Error("Music is unavailable.");
        }

        const next = await response.json() as MusicSnapshot;
        if (requestSequence < latestAcceptedSequenceRef.current) return;
        latestAcceptedSequenceRef.current = requestSequence;
        if (process.env.NODE_ENV !== "production") console.info(`[use-music] direct-response trackPresent=${Boolean(next.playback.track)} trackIdSuffix=${next.playback.track?.id?.slice(-4) ?? "none"} title=${JSON.stringify(next.playback.track?.title ?? null)}`);
        setSnapshot(next);
        setRequestError(undefined);
      } catch (cause) {
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
  }, []);

  useEffect(() => {
    if (!enabled || refreshMs !== undefined) return;

    const initial = window.setTimeout(() => {
      void refresh();
    }, 0);

    return () => window.clearTimeout(initial);
  }, [enabled, refresh, refreshMs, scope.id]);

  useEffect(() => { const timer = window.setTimeout(() => { setSnapshot(null); setLoading(true); setRequestError(undefined); hasLoaded.current = false; }, 0); return () => window.clearTimeout(timer); }, [scope.id]);

  useVisiblePolling(refresh, refreshMs ?? 0, { enabled: enabled && refreshMs !== undefined });

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
      const response = await fetch("/api/music/action", {
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
    actionLoading,
    configured: Boolean(snapshot?.provider),
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
