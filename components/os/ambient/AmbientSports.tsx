"use client";

import { useSports } from "@/hooks/os/useSports";

export default function AmbientSports() {
  const { data, loading } = useSports({ refreshMs: 60_000 });
  const event = data?.live[0];

  if (loading) {
    return <p className="text-sm text-white/40">Checking live scores…</p>;
  }

  if (!event) {
    return <p className="text-sm text-white/40">No followed games are live.</p>;
  }

  const away = event.awayTeam;
  const home = event.homeTeam;
  const score = away && home
    ? `${away.abbreviation ?? away.name} ${away.score ?? "–"}  ·  ${home.abbreviation ?? home.name} ${home.score ?? "–"}`
    : event.title;

  return (
    <div>
      <div className="flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-rose-400 shadow-[0_0_10px_rgba(251,113,133,0.9)]" />
        <p className="text-[0.65rem] uppercase tracking-[0.24em] text-rose-200/70">Live</p>
      </div>
      <p className="mt-2 text-lg font-medium">{score}</p>
      <p className="mt-1 text-xs text-white/40">{event.statusDetail ?? event.title}</p>
    </div>
  );
}
