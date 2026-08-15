"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { MusicSnapshot } from "@/core/contracts/Music";

export function useMusic() {
  const [snapshot, setSnapshot] = useState<MusicSnapshot | null>(null);
  const hasLoaded = useRef(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [requestError, setRequestError] = useState<string>();
  const [actionError, setActionError] = useState<string>();
  const [actionLoading, setActionLoading] = useState(false);

  const refresh = useCallback(async () => {
    const initial = !hasLoaded.current;

    if (initial) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    try {
      const response = await fetch("/api/music", { cache: "no-store" });

      if (!response.ok) {
        throw new Error("Music is unavailable.");
      }

      setSnapshot(await response.json() as MusicSnapshot);
      setRequestError(undefined);
    } catch (cause) {
      setRequestError(cause instanceof Error ? cause.message : "Music is unavailable.");
    } finally {
      hasLoaded.current = true;
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const initial = window.setTimeout(() => {
      void refresh();
    }, 0);

    return () => window.clearTimeout(initial);
  }, [refresh]);

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
