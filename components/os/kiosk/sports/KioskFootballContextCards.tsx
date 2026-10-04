"use client";

import { Fragment, type ReactNode } from "react";
import type { FootballDriveSummary, FootballGameStats, FootballPlay, FootballSituation } from "@/core/contracts/sports/Football";
import type { FootballLifecycleState } from "@/services/sports/football/lifecycle";

type Team = { name: string; abbreviation: string; score?: number };

export default function KioskFootballContextCards({ stats, currentDrive, latestPlay, penaltyText, situation, away, home, lifecycleState }: {
  stats?: FootballGameStats;
  currentDrive?: FootballDriveSummary;
  latestPlay?: FootballPlay;
  penaltyText?: string;
  situation?: FootballSituation;
  away: Team;
  home: Team;
  lifecycleState: FootballLifecycleState;
}) {
  return <div className="kiosk-football-context-grid grid min-h-0 gap-3 lg:grid-cols-[1fr_1.35fr_1fr]">
    <ScoringCard stats={stats} away={away} home={home} currentPeriodValue={situation?.quarter} />
    <LastPlayCard play={latestPlay} penaltyText={penaltyText} drive={currentDrive} />
    <GameContextCard situation={situation} drive={currentDrive} away={away} home={home} lifecycleState={lifecycleState} />
  </div>;
}

function Panel({ label, children }: { label: string; children: ReactNode }) {
  return <section className="kiosk-football-context-card min-w-0 rounded-2xl border border-white/15 bg-black/25 px-4 py-3"><p className="kiosk-football-card-label text-[clamp(.65rem,1vw,.8rem)] font-black uppercase tracking-[.18em] text-amber-300">{label}</p><div className="mt-2 min-h-[4.5rem]">{children}</div></section>;
}

function ScoringCard({ stats, away, home, currentPeriodValue }: { stats?: FootballGameStats; away: Team; home: Team; currentPeriodValue?: number }) {
  const periods = stats?.scoringByPeriod?.slice(0, 8) ?? [];
  if (!periods.length) return <Panel label="SCORING BY QUARTER"><p className="text-sm text-white/55">Scoring summary is not available yet.</p></Panel>;
  return <Panel label="SCORING BY QUARTER"><div className="overflow-x-auto"><div className="grid min-w-[20rem] gap-y-2 text-center text-xs font-semibold text-white" style={{ gridTemplateColumns: `minmax(3rem,1fr) repeat(${periods.length}, minmax(1.45rem,1fr)) minmax(2rem,1fr)` }}><span className="text-left text-white/55">TEAM</span>{periods.map((period) => <span key={period.period} className={period.period === currentPeriod(periods, currentPeriodValue) ? "rounded bg-white/10" : ""}>{period.label ?? `Q${period.period}`}</span>)}<span>TOTAL</span><TeamLine team={away} side="away" periods={periods} /><TeamLine team={home} side="home" periods={periods} /></div></div></Panel>;
}

function TeamLine({ team, side, periods }: { team: Team; side: "away" | "home"; periods: NonNullable<FootballGameStats["scoringByPeriod"]> }) { return <><span className="flex items-center gap-2 truncate text-left text-white/85"><span className="kiosk-football-linescore-mark" aria-hidden="true">{team.abbreviation.slice(0, 1)}</span>{team.abbreviation}</span>{periods.map((period) => <span key={`${side}-${period.period}`}>{period[side] ?? "—"}</span>)}<span className="font-black">{team.score ?? "—"}</span></>; }

function currentPeriod(periods: NonNullable<FootballGameStats["scoringByPeriod"]>, current?: number) { return current ?? periods.at(-1)?.period; }

function LastPlayCard({ play, penaltyText, drive }: { play?: FootballPlay; penaltyText?: string; drive?: FootballDriveSummary }) {
  if (!play && !drive) return <Panel label="LAST PLAY"><p className="text-sm text-white/55">Live play-by-play is not available yet.</p></Panel>;
  const age = play?.wallclock ? relativeAge(play.wallclock) : undefined;
  return <Panel label="LAST PLAY"><div className="flex h-full flex-col justify-between gap-2"><div><div className="flex items-start justify-between gap-3"><p className="line-clamp-2 text-sm font-semibold leading-snug text-white">{cleanPlayDescription(play?.shortDescription ?? play?.description) ?? "Drive in progress"}</p>{age ? <span className="shrink-0 text-[.65rem] font-bold uppercase tracking-[.08em] text-sky-200/70">{age}</span> : null}</div>{penaltyText ? <p className="mt-1 line-clamp-2 text-sm font-bold text-amber-300">Penalty: {penaltyText}</p> : null}</div>{drive ? <p className="border-t border-white/15 pt-2 text-xs font-semibold text-white/65">Drive: {[drive.plays !== undefined ? `${drive.plays} plays` : undefined, drive.yards !== undefined ? `${drive.yards} yards` : undefined, drive.elapsedTime, drive.result].filter(Boolean).join(" · ") || "Updating"}</p> : null}</div></Panel>;
}

function GameContextCard({ situation, drive, away, home, lifecycleState }: { situation?: FootballSituation; drive?: FootballDriveSummary; away: Team; home: Team; lifecycleState: FootballLifecycleState }) {
  const terminal = lifecycleState === "final" || lifecycleState === "postgame";
  if (terminal) return <Panel label="FINAL CONTEXT"><div className="grid grid-cols-[minmax(5.5rem,1fr)_minmax(0,1.2fr)] gap-x-3 gap-y-1 text-sm"><ContextRow label="FINAL SCORE" value={`${away.abbreviation} ${away.score ?? "—"} · ${home.abbreviation} ${home.score ?? "—"}`} /><ContextRow label="LAST PLAY" value={drive?.result ?? "End of game"} /></div></Panel>;
  const ball = situation?.fieldPosition?.display ?? situation?.possessionText;
  const possession = situation?.possessionTeamAbbreviation ?? situation?.possessionText?.split(/\s+/)[0];
  return <Panel label="GAME CONTEXT"><div className="grid grid-cols-[minmax(5.5rem,1fr)_minmax(0,1.2fr)] gap-x-3 gap-y-1 text-sm"><ContextRow label="POSSESSION" value={possession} /><ContextRow label="BALL ON" value={ball} /><ContextRow label="DRIVE" value={drive ? [drive.plays !== undefined ? `${drive.plays} plays` : undefined, drive.yards !== undefined ? `${drive.yards} yards` : undefined].filter(Boolean).join(", ") : undefined} /><ContextRow label="TIME OF POSSESSION" value={drive?.elapsedTime} /><ContextRow label="RED ZONE" value={situation?.redZone === undefined ? undefined : situation.redZone ? "Yes" : "No"} /></div></Panel>;
}

function ContextRow({ label, value }: { label: string; value?: string }) { return <Fragment><span className="text-[.65rem] font-bold uppercase tracking-[.08em] text-white/55">{label}</span><span className="truncate font-semibold text-white">{value ?? "—"}</span></Fragment>; }

function relativeAge(value: string) { const timestamp = Date.parse(value); if (!Number.isFinite(timestamp)) return undefined; const seconds = Math.max(0, Math.round((Date.now() - timestamp) / 1000)); if (seconds < 60) return `${seconds}s ago`; return `${Math.floor(seconds / 60)}m ago`; }
function cleanPlayDescription(value?: string) { return value?.replace(/^\([^)]*\)\s*/u, "").split(/\.\s*PENALTY\b/i)[0].trim(); }
