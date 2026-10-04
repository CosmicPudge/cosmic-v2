"use client";

import { useEffect, useRef, useState } from "react";
import type { SportsEvent } from "@/core/contracts/Sports";
import type { FootballLiveData } from "@/core/contracts/sports/Football";
import type { CollegeFootballLiveData } from "@/services/sports/providers/college-football-detail";
import { resolveSportsTeamIdentity } from "@/services/sports/identity";
import { createFootballPresentation } from "./footballPresentation";
import KioskFootballContextCards from "./KioskFootballContextCards";
import { FOOTBALL_PENALTY_DISPLAY_MS } from "./footballAttention";
import { interpolateFootballClock } from "@/services/sports/football/clock";

type FootballView = ReturnType<typeof createFootballPresentation>;

export default function KioskFootballView({ event, live }: { event: SportsEvent; live?: FootballLiveData | CollegeFootballLiveData }) {
  const view = createFootballPresentation(event, live);
  const terminal = view.lifecycleState === "final" || view.lifecycleState === "postgame";
  const penaltyVisible = useFootballPenaltyBanner(terminal ? undefined : view.penaltyIdentity);
  const effectiveAttention: FootballView["attention"] = terminal ? "normal" : view.attention !== "normal" ? view.attention : penaltyVisible ? "flag" : "normal";
  const attentionView: FootballView = effectiveAttention === view.attention ? view : { ...view, attention: effectiveAttention, attentionLabel: "FLAG" };
  const tone = effectiveAttention === "flag" ? "kiosk-football-panel--flag" : effectiveAttention !== "normal" ? "kiosk-football-panel--review" : "kiosk-football-panel--normal";
  const possessionText = view.situation?.possessionText ?? view.situation?.possessionTeamAbbreviation;
  return <div className="kiosk-sports-view kiosk-football-scene relative flex h-[100dvh] w-full items-center justify-center overflow-hidden px-[clamp(1rem,3vw,3rem)] py-[clamp(1rem,3vh,2.5rem)]" data-football-attention={effectiveAttention} data-football-state={view.lifecycleState}>
    <section className={`kiosk-football-panel relative flex h-full w-full max-w-[1550px] flex-col overflow-hidden rounded-[clamp(1.5rem,3vw,2.75rem)] border backdrop-blur-md transition-colors duration-500 ${tone}`}>
      <header className="kiosk-football-topbar grid shrink-0 grid-cols-[minmax(0,1fr)_minmax(12rem,2fr)_minmax(0,1fr)] items-center gap-4 border-b border-white/10 px-[clamp(1.25rem,3vw,2.5rem)] py-[clamp(.9rem,2vh,1.4rem)]"><div className="flex min-w-0 items-center gap-4"><span className="kiosk-football-state-dot h-3 w-3 shrink-0 rounded-full" /><p className="kiosk-football-eyebrow truncate text-[clamp(.7rem,1vw,.9rem)] font-bold uppercase tracking-[0.2em] text-white/90">{view.statusLabel} · {view.sportLabel}</p></div><h1 className="kiosk-football-matchup-title min-w-0 truncate text-center text-[clamp(1.1rem,2.2vw,1.8rem)] font-bold tracking-tight text-white">{event.title}</h1><p className="kiosk-football-brand text-right text-[clamp(.65rem,1vw,.85rem)] font-semibold uppercase tracking-[0.2em] text-amber-300">COSMIC SPORTS</p></header>
      {effectiveAttention !== "normal" ? <AttentionBanner view={attentionView} /> : null}
      <div className="kiosk-football-main grid min-h-0 flex-1 grid-rows-[auto_1fr_auto] gap-[clamp(.8rem,2vh,1.5rem)] px-[clamp(1.25rem,4vw,4rem)] py-[clamp(1rem,3vh,2rem)]"><div className="kiosk-football-statusline flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-center"><span className="kiosk-football-status text-[clamp(1rem,1.8vw,1.45rem)] font-black uppercase tracking-[.12em] text-white">{view.countdownLabel ?? (view.quarterLabel ? `${view.quarterLabel}${view.clock ? ` · ${view.clock}` : ""}` : view.lifecycleState === "pregame" ? "PREGAME" : view.lifecycleState === "halftime" ? "HALFTIME" : view.lifecycleState === "overtime" ? "OVERTIME" : "GAME CONTEXT")}</span>{view.rankings.map((rank) => <span key={rank} className="kiosk-football-ranking text-[clamp(.85rem,1.2vw,1.05rem)] font-bold text-amber-100">{rank}</span>)}</div>
        <div className="kiosk-football-scoreboard grid min-h-0 grid-cols-[1fr_auto_1fr] items-center gap-[clamp(1rem,4vw,4rem)]"><ScoreTeam event={event} side="away" team={view.away} /><CenterSituation view={view} possessionText={possessionText} /><ScoreTeam event={event} side="home" team={view.home} /></div>
        <KioskFootballContextCards stats={view.stats} currentDrive={view.currentDrive} latestPlay={view.latestPlay} penaltyText={view.penaltyText} situation={view.situation} away={view.away} home={view.home} lifecycleState={view.lifecycleState} />
      </div>
      <footer className="kiosk-football-footer grid shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-3 border-t border-white/10 px-[clamp(1.25rem,3vw,2.5rem)] py-3 text-[clamp(.6rem,1vw,.75rem)] font-semibold uppercase tracking-[0.16em] text-white/65"><span className="truncate">{view.venue ?? "Football live center"}</span><span className="text-center text-white">{view.broadcast ?? "—"}</span><span className="text-right">{view.lifecycleState === "live" || view.lifecycleState === "starting" ? "LIVE DATA" : view.statusLabel}</span></footer><div className="pointer-events-none absolute inset-0 rounded-[inherit] ring-1 ring-inset ring-white/10" />
    </section>
  </div>;
}

function useFootballPenaltyBanner(identity?: string) {
  const [visibleIdentity, setVisibleIdentity] = useState<string | undefined>(undefined);
  const handled = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (!identity) {
      const clearTask = window.setTimeout(() => setVisibleIdentity(undefined), 0);
      return () => window.clearTimeout(clearTask);
    }
    if (handled.current === identity) return;
    handled.current = identity;
    setVisibleIdentity(identity);
    const timer = window.setTimeout(() => setVisibleIdentity(undefined), FOOTBALL_PENALTY_DISPLAY_MS);
    return () => window.clearTimeout(timer);
  }, [identity]);
  return visibleIdentity === identity;
}

function AttentionBanner({ view }: { view: FootballView }) { const flag = view.attention === "flag"; return <div className={`kiosk-football-attention flex items-center gap-4 border-b border-current/20 px-[clamp(1.25rem,4vw,4rem)] py-2 ${flag ? "kiosk-football-attention--flag" : "justify-center text-center"}`}><span className="kiosk-football-attention-icon text-[clamp(1.5rem,2.5vw,2.5rem)]" aria-hidden="true">{flag ? "⚑" : "◉"}</span><div className="min-w-0 flex-1"><p className="kiosk-football-attention-title text-[clamp(1.1rem,2.4vw,2rem)] font-black uppercase tracking-[.15em]">{view.attentionLabel}</p>{flag ? <><p className="truncate text-[clamp(.85rem,1.4vw,1.2rem)] font-bold text-black/85">{view.penaltyDisplay?.headline ?? "Penalty under review"}</p>{view.penaltyDisplay?.detail ? <p className="truncate text-[clamp(.7rem,1vw,.9rem)] font-semibold text-black/75">{view.penaltyDisplay.detail}</p> : null}</> : view.attention === "challenge" && view.attentionTeam ? <p className="mt-1 text-[clamp(.8rem,1.2vw,1rem)] font-semibold uppercase tracking-[.14em]">Challenge by {view.attentionTeam}</p> : view.attention === "official-review" ? <p className="mt-1 text-[clamp(.8rem,1.2vw,1rem)]">Ruling on the field under review</p> : null}</div>{flag && view.situation?.playClock ? <span className="kiosk-football-play-clock text-[clamp(1rem,1.8vw,1.5rem)] font-black tabular-nums text-black">{view.situation.playClock}</span> : null}</div>; }

function CenterSituation({ view, possessionText }: { view: FootballView; possessionText?: string }) { const situation = view.situation; const terminal = view.lifecycleState === "final" || view.lifecycleState === "postgame"; const showDown = view.lifecycleState === "live" || view.lifecycleState === "starting" || view.lifecycleState === "overtime"; const displayClock = useFootballClock(showDown ? view.clock ?? situation?.clock : undefined, view.quarterLabel, showDown); const periodLabel = terminal ? [view.quarterLabel, view.clock].filter(Boolean).join(" · ") || "FINAL" : view.quarterLabel ?? (view.lifecycleState === "halftime" ? "HALFTIME" : view.lifecycleState === "final" ? "FINAL" : "GAME"); return <div className="kiosk-football-center flex min-w-[clamp(7rem,16vw,13rem)] flex-col items-center gap-3 text-center"><p className={`kiosk-football-clock ${terminal ? "text-[clamp(2rem,4vw,3.4rem)]" : "text-[clamp(1.5rem,3vw,2.8rem)]"} font-black leading-none text-white`}>{terminal ? "FINAL" : showDown ? displayClock ?? "—" : view.lifecycleState === "pregame" ? "KICKOFF" : "—"}</p><p className="kiosk-football-period text-[clamp(.8rem,1.1vw,1rem)] font-bold uppercase tracking-[.16em] text-white/80">{periodLabel}</p>{showDown ? <p className="kiosk-football-down text-[clamp(1rem,1.8vw,1.5rem)] font-black uppercase tracking-[.08em] text-white">{situation?.downDistanceText ?? "VS"}</p> : null}<FieldStrip view={view} possessionText={possessionText} /></div>; }

function useFootballClock(authoritativeClock: string | undefined, period: string | undefined, active: boolean) {
  const [displayClock, setDisplayClock] = useState(authoritativeClock);
  const state = useRef({ authoritativeClock, period, sampleAt: 0, sameSince: 0, running: false });
  useEffect(() => {
    const now = performance.now();
    const previous = state.current;
    const changed = authoritativeClock !== previous.authoritativeClock || period !== previous.period;
    if (!active || !authoritativeClock) {
      state.current = { authoritativeClock, period, sampleAt: now, sameSince: now, running: false };
    } else if (changed) {
      const clockProgressed = previous.period === period && previous.authoritativeClock !== undefined && authoritativeClock !== previous.authoritativeClock;
      state.current = { authoritativeClock, period, sampleAt: now, sameSince: clockProgressed ? now : previous.sameSince, running: clockProgressed };
    } else if (now - previous.sameSince >= 1_100) {
      state.current.running = false;
    }
    const sync = window.setTimeout(() => setDisplayClock(authoritativeClock), 0);
    return () => window.clearTimeout(sync);
  }, [active, authoritativeClock, period]);
  useEffect(() => {
    if (!active) return;
    const ticker = window.setInterval(() => {
      const current = state.current;
      if (current.running && current.authoritativeClock) setDisplayClock(interpolateFootballClock(current.authoritativeClock, performance.now() - current.sampleAt, true));
    }, 250);
    return () => window.clearInterval(ticker);
  }, [active]);
  return displayClock;
}

function FieldStrip({ view, possessionText }: { view: FootballView; possessionText?: string }) { const terminal = view.lifecycleState === "final" || view.lifecycleState === "postgame"; const field = view.situation?.fieldPosition; const yard = field?.yardLine ?? view.situation?.ballYardLine; const first = view.situation?.firstDownYardLine; const display = field?.display ?? possessionText; if (terminal) return <div className="kiosk-football-field-strip kiosk-football-field-strip--final w-full max-w-[19rem] rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-center"><p className="text-[.6rem] font-black uppercase tracking-[.18em] text-white/55">FINAL SCORE</p><p className="mt-1 text-sm font-bold text-white/80">{view.away.abbreviation} {view.away.score ?? "—"} · {view.home.abbreviation} {view.home.score ?? "—"}</p></div>; return <div className="kiosk-football-field-strip w-full max-w-[19rem] rounded-xl border border-white/20 bg-emerald-950/55 p-2"><div className="flex justify-between text-[.55rem] font-black tracking-[.12em] text-white/80"><span>{view.away.abbreviation}</span><span>{view.home.abbreviation}</span></div><svg viewBox="0 0 220 30" className="mt-1 h-8 w-full" role="img" aria-label={display ? `Field position ${display}` : "Football field position"}><rect x="1" y="4" width="218" height="22" rx="3" fill="rgba(16,94,62,.75)" stroke="rgba(255,255,255,.35)" />{[22,44,66,88,110,132,154,176,198].map((x) => <line key={x} x1={x} x2={x} y1="5" y2="25" stroke="rgba(255,255,255,.28)" />)}{first !== undefined ? <line x1={Math.max(4, Math.min(216, first * 2.2))} x2={Math.max(4, Math.min(216, first * 2.2))} y1="5" y2="25" stroke="#facc15" strokeWidth="2" /> : null}{yard !== undefined ? <circle cx={Math.max(7, Math.min(213, yard * 2.2))} cy="15" r="4" fill="#fff" stroke="#111827" strokeWidth="2" /> : null}</svg><p className="mt-1 text-[.65rem] font-semibold text-white/80">{display ? `🏈 ${display}` : "Field position unavailable"}</p></div>; }

function ScoreTeam({ event, side, team }: { event: SportsEvent; side: "home" | "away"; team: FootballView["home"] }) { const source = side === "home" ? event.homeTeam : event.awayTeam; const identity = resolveSportsTeamIdentity(event.sport, source); const [logoFailed, setLogoFailed] = useState(false); return <div className={`kiosk-football-team kiosk-football-team--${side} ${side === "home" ? "text-left" : "text-right"} min-w-0`}><div className={`mb-2 flex items-center gap-3 ${side === "home" ? "justify-start" : "justify-end"}`}><div className="kiosk-football-logo">{identity?.logoPath && !logoFailed ? <img className="h-10 w-10 object-contain" src={identity.logoPath} alt="" draggable={false} onError={() => setLogoFailed(true)} /> : <span className="kiosk-football-monogram" aria-hidden="true">{team.abbreviation.slice(0, 3)}</span>}</div><div className="min-w-0"><p className="kiosk-football-team-name text-[clamp(1.2rem,3vw,2.6rem)] font-black uppercase tracking-[-.035em]" style={{ color: team.possession && team.color ? team.color : "#fff" }}>{team.name}</p><p className="kiosk-football-team-meta text-[clamp(.7rem,1vw,.9rem)] font-bold uppercase tracking-[.15em] text-white/75">{team.abbreviation}{team.record ? ` · ${team.record}` : ""}</p><Timeouts count={team.timeouts} /></div></div><ScoreValue eventId={event.id} side={side} score={team.score} /></div>; }
function Timeouts({ count }: { count?: number }) { if (count === undefined) return null; return <div className="kiosk-football-timeouts mt-1 flex gap-1" aria-label={`${count} timeouts remaining`}>{[0, 1, 2].map((index) => <span key={index} className={`h-2.5 w-2.5 rounded-full border ${index < count ? "border-white/80 bg-white/85" : "border-white/35 bg-white/10"}`} />)}</div>; }
function ScoreValue({ eventId, side, score }: { eventId: string; side: "home" | "away"; score?: number }) { const node = useRef<HTMLSpanElement>(null); const previous = useRef<{ eventId: string; score?: number } | null>(null); useEffect(() => { const prior = previous.current; previous.current = { eventId, score }; if (!prior || prior.eventId !== eventId || prior.score === score || !node.current || score === undefined) return; node.current.classList.remove("kiosk-football-score--changed"); void node.current.offsetWidth; node.current.classList.add("kiosk-football-score--changed"); const timer = window.setTimeout(() => node.current?.classList.remove("kiosk-football-score--changed"), 500); return () => window.clearTimeout(timer); }, [eventId, score]); return <span ref={node} data-score-side={side} className="kiosk-football-score text-[clamp(4rem,11vw,8rem)] font-black leading-none tracking-[-.08em] text-white">{score ?? "—"}</span>; }
