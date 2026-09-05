"use client";

import type { SportKind, SportsTeam } from "@/core/contracts/Sports";
import type { FootballLiveData, FootballPlay, FootballTeamState } from "@/core/contracts/sports/Football";
import SportsTeamLogo from "@/components/apps/sports/SportsTeamLogo";
import { resolveFootballFieldGeometry } from "@/services/sports/football/field";

const panel = "rounded-3xl border border-white/10 bg-white/[0.045] p-5";

export default function FootballField({ sport, homeTeam, situation, home, away, selectedPlay }: { sport: Extract<SportKind, "nfl" | "college-football">; homeTeam?: SportsTeam; situation?: FootballLiveData["situation"]; home?: FootballTeamState; away?: FootballTeamState; selectedPlay?: FootballPlay }) {
  const geometry = resolveFootballFieldGeometry(situation, home, away);
  const playStart = geometry.lineOfScrimmage;
  const playEnd = selectedPlay?.yardsGained !== undefined && playStart !== undefined ? Math.max(0, Math.min(100, playStart + selectedPlay.yardsGained)) : undefined;
  return <section className={panel} aria-label={`${homeTeam?.name ?? "Home team"} football field`}>
    <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-[11px] uppercase tracking-[0.2em] text-cyan-100/45">Virtual field · offense left to right</p><span className="text-xs text-white/45">{situation?.possessionText ?? situation?.fieldPosition?.display ?? "Live field position unavailable"}</span></div>
    <div className="relative mt-4 aspect-[2.15/1] overflow-hidden rounded-xl border border-white/20 bg-[#165b3a] shadow-inner shadow-black/30">
      <div className="absolute inset-y-0 left-0 w-[8%] border-r border-white/45 bg-[#123f39]/80" /><div className="absolute inset-y-0 right-0 w-[8%] border-l border-white/45 bg-[#123f39]/80" />
      <div className="absolute inset-y-0 left-[8%] right-[8%] bg-[repeating-linear-gradient(90deg,transparent_0,transparent_9.85%,rgba(255,255,255,.5)_9.85%,rgba(255,255,255,.5)_10.15%)]" />
      <div className="absolute inset-y-0 left-[18%] w-px bg-white/75" /><div className="absolute inset-y-0 right-[18%] w-px bg-white/75" /><div className="absolute inset-y-0 left-1/2 w-px bg-white/80" />
      <div className="absolute inset-x-[9%] top-1/2 h-px bg-white/15" />
      <div className="absolute inset-x-[8%] top-1/2 flex justify-between px-[4%] text-[clamp(9px,1.3vw,14px)] font-semibold text-white/65"><span>10</span><span>20</span><span>30</span><span>40</span><span>50</span><span>40</span><span>30</span><span>20</span><span>10</span></div>
      {homeTeam ? <div className="absolute inset-0 grid place-items-center opacity-70"><SportsTeamLogo sport={sport} team={homeTeam} size="lg" fallback="none" /></div> : null}
      {geometry.reliable && geometry.lineOfScrimmage !== undefined ? <div className="absolute inset-y-0 w-1 bg-cyan-200 shadow-[0_0_12px_rgba(103,232,249,.75)]" style={{ left: `${8 + geometry.lineOfScrimmage * .84}%` }} aria-label="Line of scrimmage" /> : null}
      {geometry.reliable && geometry.firstDownYardLine !== undefined ? <div className="absolute inset-y-0 w-1 bg-amber-300 shadow-[0_0_12px_rgba(252,211,77,.75)]" style={{ left: `${8 + geometry.firstDownYardLine * .84}%` }} aria-label="First down line" /> : null}
      {playEnd !== undefined && playStart !== undefined ? <div className="absolute top-1/2 h-1 rounded-full bg-white/80" style={{ left: `${8 + playStart * .84}%`, width: `${Math.abs(playEnd - playStart) * .84}%`, transform: playEnd < playStart ? "translateX(-100%)" : undefined }} aria-label="Selected play path" /> : null}
    </div>
    <div className="mt-3 flex flex-wrap gap-3 text-xs text-white/45"><span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-cyan-200" />LOS</span><span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-amber-300" />First down</span>{!geometry.reliable ? <span>Markers hidden until provider field identity is reliable.</span> : null}</div>
  </section>;
}
