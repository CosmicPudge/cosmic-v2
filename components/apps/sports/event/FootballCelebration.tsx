"use client";

import type { FootballPlay } from "@/core/contracts/sports/Football";
import type { SportsTeam } from "@/core/contracts/Sports";

export default function FootballCelebration({ play, team }: { play?: FootballPlay; team?: SportsTeam }) {
  if (!play) return null;
  return <div className="pointer-events-none fixed inset-x-3 top-24 z-30 mx-auto max-w-xl rounded-3xl border border-amber-200/40 bg-slate-950/90 p-5 text-center shadow-2xl shadow-amber-500/20 motion-safe:animate-[pulse_1.4s_ease-in-out_2]" role="status" aria-live="polite"><p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-amber-200">Touchdown</p><p className="mt-2 text-2xl font-black tracking-tight text-white">{team?.name ?? "Scoring team"}</p><p className="mt-1 text-sm text-white/60">{play.description}</p></div>;
}
