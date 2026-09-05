"use client";

import { useEffect, useState } from "react";
import type { SportsDirectoryEntry } from "@/services/sports/directory";

type DirectoryResponse = { teams?: SportsDirectoryEntry[]; error?: string };
let cachedTeams: SportsDirectoryEntry[] | null = null;
let pending: Promise<SportsDirectoryEntry[]> | null = null;

async function requestDirectory(): Promise<SportsDirectoryEntry[]> {
  if (cachedTeams) return cachedTeams;
  if (!pending) pending = fetch("/api/sports/college-football/teams", { cache: "no-store", credentials: "include" }).then(async (response) => {
    const body = await response.json() as DirectoryResponse;
    if (!response.ok || !Array.isArray(body.teams)) throw new Error(body.error ?? "College Football directory unavailable.");
    cachedTeams = body.teams;
    return body.teams;
  }).finally(() => { pending = null; });
  return pending;
}

export function useCollegeFootballDirectory() {
  const [teams, setTeams] = useState<SportsDirectoryEntry[]>(cachedTeams ?? []);
  const [loading, setLoading] = useState(!cachedTeams);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    requestDirectory().then((next) => { if (active) setTeams(next); }).catch((reason) => { if (active) setError(reason instanceof Error ? reason.message : "College Football directory unavailable."); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  return { teams, loading, error, retry: () => { cachedTeams = null; setError(null); setLoading(true); requestDirectory().then(setTeams).catch((reason) => setError(reason instanceof Error ? reason.message : "College Football directory unavailable.")).finally(() => setLoading(false)); } };
}

export function prefetchCollegeFootballSchedule(teamId: string) {
  if (!/^[a-zA-Z0-9_-]{1,40}$/.test(teamId)) return;
  void fetch(`/api/sports/team/college-football/${encodeURIComponent(teamId)}`, { credentials: "include", cache: "no-store" }).catch(() => undefined);
}
