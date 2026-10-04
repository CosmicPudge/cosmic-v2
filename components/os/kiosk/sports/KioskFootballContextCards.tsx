"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { FootballDriveSummary, FootballGameStats, FootballPlayerLeader } from "@/core/contracts/sports/Football";
import { footballStatRows } from "@/services/sports/football/stats";

type Team = { name: string; abbreviation: string; score: number };
type Card = { id: string; label: string; content: ReactNode };

export default function KioskFootballContextCards({ stats, currentDrive, away, home, lifecycleState, attention }: { stats?: FootballGameStats; currentDrive?: FootballDriveSummary; away: Team; home: Team; lifecycleState: string; attention: string }) {
  const cards = useMemo(() => buildCards({ stats, currentDrive, away, home, lifecycleState }), [away, currentDrive, home, lifecycleState, stats]);
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (cards.length <= 1 || attention !== "normal") return;
    const timer = window.setInterval(() => setIndex((value) => (value + 1) % cards.length), 10_000);
    return () => window.clearInterval(timer);
  }, [attention, cards.length]);
  const card = cards[index % Math.max(cards.length, 1)] ?? cards[0];
  if (!card) return <InfoPanel label="GAME CONTEXT" value="Detailed context is not available yet." />;
  return <div className="kiosk-football-context-card min-w-0 rounded-2xl border border-white/15 bg-black/25 px-4 py-3" aria-live="polite"><div className="flex items-center justify-between gap-3"><p className="kiosk-football-card-label text-[clamp(.65rem,1vw,.8rem)] font-black uppercase tracking-[.18em] text-white/80">{card.label}</p>{cards.length > 1 ? <p className="text-[.6rem] font-semibold uppercase tracking-[.14em] text-white/45">{index + 1} / {cards.length}</p> : null}</div><div className="mt-2 min-h-[3.2rem]">{card.content}</div></div>;
}

function buildCards({ stats, currentDrive, away, home, lifecycleState }: { stats?: FootballGameStats; currentDrive?: FootballDriveSummary; away: Team; home: Team; lifecycleState: string }): Card[] {
  const cards: Card[] = [];
  const drive = currentDrive ?? stats?.recentDrives?.[0];
  if (drive && (drive.plays !== undefined || drive.yards !== undefined || drive.elapsedTime || drive.result)) cards.push({ id: "drive", label: "CURRENT DRIVE", content: <p className="text-sm font-semibold text-white">{[drive.plays !== undefined ? `${drive.plays} plays` : undefined, drive.yards !== undefined ? `${drive.yards} yards` : undefined, drive.elapsedTime, drive.result].filter(Boolean).join(" · ")}</p> });
  const rows = footballStatRows(stats?.teamStats);
  if (rows.length) cards.push({ id: "team-stats", label: "TEAM STATS", content: <TeamStats rows={rows} teams={[away, home]} /> });
  const leaders = stats?.playerLeaders ?? [];
  if (leaders.length) cards.push({ id: "leaders", label: "PLAYER LEADERS", content: <Leaders leaders={leaders} /> });
  const drives = (stats?.recentDrives ?? []).slice(0, 4).filter((item) => item !== drive);
  if (drives.length) cards.push({ id: "recent-drives", label: "RECENT DRIVES", content: <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm font-semibold text-white">{drives.map((item, index) => <div key={item.id ?? `${item.teamAbbreviation}-${index}`} className="flex justify-between gap-2"><span className="text-white/65">{item.teamAbbreviation ?? "TEAM"}</span><span className="truncate">{shortDriveResult(item.result ?? item.description)}</span></div>)}</div> });
  const scoring = stats?.scoringPlays?.slice(-4).reverse() ?? [];
  if (scoring.length) cards.push({ id: "scoring", label: "SCORING SUMMARY", content: <div className="space-y-1 text-sm text-white">{scoring.map((play, index) => <p key={play.id ?? `${play.period}-${index}`}><span className="mr-2 font-bold text-amber-100">{play.period !== undefined ? `${play.period}Q` : "—"}</span>{play.teamAbbreviation ? `${play.teamAbbreviation} — ` : ""}{play.description}</p>)}</div> });
  if (stats?.scoringByPeriod?.length) cards.push({ id: "linescore", label: "SCORING BY QUARTER", content: <div className="grid grid-cols-[1fr_repeat(5,minmax(1.5rem,1fr))] gap-1 text-center text-xs font-semibold text-white"><span className="text-left text-white/55">TEAM</span>{stats.scoringByPeriod.slice(0, 5).map((period) => <span key={period.period}>{period.label ?? `Q${period.period}`}</span>)}<span>T</span>{[[away, "away"], [home, "home"]].map(([team, side]) => <Fragment key={side as string}><span className="truncate text-left text-white/75">{(team as Team).abbreviation}</span>{stats.scoringByPeriod!.slice(0, 5).map((period) => <span key={`${side}-${period.period}`}>{period[side as "away" | "home"] ?? "—"}</span>)}<span>{(team as Team).score}</span></Fragment>)}</div> });
  if (lifecycleState === "halftime") {
    const order = ["team-stats", "leaders", "linescore", "scoring", "drive", "recent-drives"];
    cards.sort((left, right) => order.indexOf(left.id) - order.indexOf(right.id));
  }
  return cards;
}

function TeamStats({ rows, teams }: { rows: ReturnType<typeof footballStatRows>; teams: Team[] }) { return <div className="grid grid-cols-[1fr_repeat(2,minmax(3rem,1fr))] gap-x-3 gap-y-1 text-xs font-semibold text-white"><span className="text-white/50">STAT</span>{teams.map((team) => <span key={team.abbreviation} className="text-center text-white/75">{team.abbreviation}</span>)}{rows.slice(0, 6).map((row) => <Fragment key={row.label}><span className="text-white/65">{row.label}</span>{row.values.slice(0, 2).map((value, index) => <span key={`${row.label}-${index}`} className="text-center">{value ?? "—"}</span>)}</Fragment>)}</div>; }
function Leaders({ leaders }: { leaders: FootballPlayerLeader[] }) { return <div className="grid grid-cols-3 gap-3 text-xs text-white">{leaders.slice(0, 3).map((leader) => <div key={`${leader.category}-${leader.playerId ?? leader.name}`} className="min-w-0"><p className="text-[.6rem] font-black uppercase tracking-[.14em] text-amber-100/80">{leader.category}</p><p className="truncate font-bold">{leader.name}</p><p className="truncate text-white/70">{leader.statLine}</p></div>)}</div>; }
function shortDriveResult(value?: string) { if (!value) return "—"; const lower = value.toLowerCase(); if (lower.includes("touchdown") || lower === "td") return "TD"; if (lower.includes("field goal")) return lower.includes("miss") ? "MISSED FG" : "FG"; if (lower.includes("intercept")) return "INT"; if (lower.includes("fumble")) return "FUMBLE"; if (lower.includes("punt")) return "PUNT"; if (lower.includes("downs")) return "DOWNS"; if (lower.includes("half")) return "END HALF"; return value; }
function InfoPanel({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl border border-white/15 bg-black/25 px-4 py-3"><p className="text-[clamp(.65rem,1vw,.8rem)] font-black uppercase tracking-[.18em] text-white/80">{label}</p><p className="mt-2 text-sm text-white/70">{value}</p></div>; }
