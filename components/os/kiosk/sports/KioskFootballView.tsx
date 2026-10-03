"use client";

import type { SportsEvent } from "@/core/contracts/Sports";
import type { FootballLiveData } from "@/core/contracts/sports/Football";
import type { CollegeFootballLiveData } from "@/services/sports/providers/college-football-detail";
import { resolveSportsTeamIdentity } from "@/services/sports/identity";

interface KioskFootballViewProps {
  event: SportsEvent;
  live?: FootballLiveData | CollegeFootballLiveData;
}

function getTeamName(
  team: SportsEvent["homeTeam"] | SportsEvent["awayTeam"],
) {
  if (!team) {
    return "—";
  }

  return team.abbreviation ?? team.name;
}

function getScore(
  team: SportsEvent["homeTeam"] | SportsEvent["awayTeam"],
) {
  if (!team || team.score === undefined) {
    return "—";
  }

  return String(team.score);
}

export default function KioskFootballView({
  event,
  live,
}: KioskFootballViewProps) {
  const awayName = getTeamName(event.awayTeam);
  const homeName = getTeamName(event.homeTeam);
  const isCollegeFootball = event.sport === "college-football";
  const collegeLive = live && "period" in live ? live : undefined;
  const situation = live && "situation" in live ? live.situation : collegeLive?.situation;

  const awayScore = live?.away.score !== undefined ? String(live.away.score) : getScore(event.awayTeam);
  const homeScore = live?.home.score !== undefined ? String(live.home.score) : getScore(event.homeTeam);

  return (
    <div className="kiosk-sports-view kiosk-football-view relative flex h-[100dvh] w-full items-center justify-center overflow-hidden px-[clamp(1rem,3vw,3rem)] py-[clamp(1rem,3vh,2.5rem)]">
      <section className="relative flex h-full w-full max-w-[1500px] flex-col overflow-hidden rounded-[clamp(1.5rem,3vw,2.75rem)] border border-white/10 bg-black/10 shadow-[0_30px_120px_rgba(0,0,0,.32)] backdrop-blur-md">

        {/* Header */}
        <header className="flex shrink-0 items-center justify-between border-b border-white/[0.07] px-[clamp(1.25rem,3vw,2.5rem)] py-[clamp(.9rem,2vh,1.4rem)]">
          <div className="flex items-center gap-4">
            <span className="relative flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-60" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-red-400" />
            </span>

            <div>
              <p className="text-[clamp(.65rem,1vw,.8rem)] font-semibold uppercase tracking-[0.24em] text-red-200/65">
                {event.status === "live" || event.status === "delayed" ? "LIVE" : event.status === "final" ? "FINAL" : "UPCOMING"} • {isCollegeFootball ? "CFB" : "NFL"}
              </p>

              <h1 className="text-[clamp(1.15rem,2vw,1.7rem)] font-semibold tracking-tight text-white/90">
                {event.title}
              </h1>
            </div>
          </div>

          <div className="text-right">
            <p className="text-[clamp(.65rem,1vw,.8rem)] font-semibold uppercase tracking-[0.2em] text-white/25">
              Cosmic Sports
            </p>
          </div>
        </header>

        {/* Game */}
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-[clamp(1.5rem,5vw,5rem)] py-6">

          {/* Game status */}
          <div className="mb-[clamp(1.5rem,4vh,3rem)] text-center">
            <p className="text-[clamp(1rem,2vw,1.5rem)] font-bold uppercase tracking-[0.18em] text-white/55">
              {event.statusDetail ?? collegeLive?.status ?? (situation?.quarter ? `Q${situation.quarter}${situation.clock ? ` · ${situation.clock}` : ""}` : "Live")}
            </p>
          </div>

          {/* Scoreboard */}
          <div className="grid w-full max-w-5xl grid-cols-[1fr_auto_1fr] items-center gap-[clamp(1.25rem,5vw,5rem)]">

            {/* Away */}
            <div className="min-w-0 text-right">
              <TeamLogo event={event} side="away" />
              <p className="truncate text-[clamp(1.5rem,4vw,3.25rem)] font-black uppercase tracking-[-0.04em] text-white/90">
                {awayName}
              </p>

              <p className="mt-3 text-[clamp(4.5rem,13vw,10rem)] font-black leading-[0.8] tracking-[-0.08em] text-white">
                {awayScore}
              </p>
            </div>

            {/* Divider */}
            <div className="flex flex-col items-center">
              <div className="h-24 w-px bg-gradient-to-b from-transparent via-white/20 to-transparent" />

              <span className="my-4 text-[clamp(.7rem,1vw,.9rem)] font-bold uppercase tracking-[0.22em] text-white/25">
                at
              </span>

              <div className="h-24 w-px bg-gradient-to-b from-transparent via-white/20 to-transparent" />
            </div>

            {/* Home */}
            <div className="min-w-0 text-left">
              <p className="truncate text-[clamp(1.5rem,4vw,3.25rem)] font-black uppercase tracking-[-0.04em] text-white/90">
                {homeName}
              </p>

              <TeamLogo event={event} side="home" />

              <p className="mt-3 text-[clamp(4.5rem,13vw,10rem)] font-black leading-[0.8] tracking-[-0.08em] text-white">
                {homeScore}
              </p>
            </div>
          </div>

          {/* Details */}
          <div className="mt-[clamp(2rem,6vh,4rem)] flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[clamp(.75rem,1.2vw,1rem)] font-medium text-white/40">
            {situation?.quarter ? <span>Q{situation.quarter}{situation.clock ? ` · ${situation.clock}` : ""}</span> : null}
            {collegeLive?.rankings?.length ? <span>{collegeLive.rankings.map((ranking) => `#${ranking.rank} ${ranking.team}`).join(" · ")}</span> : null}
            {situation?.downDistanceText ? <span>{situation.downDistanceText}</span> : null}
            {situation?.possessionText ? <span>{situation.possessionText}</span> : null}
            {event.venue ? (
              <span>{event.venue}</span>
            ) : null}

            {event.venue && event.broadcast ? (
              <span className="text-white/15">•</span>
            ) : null}

            {event.broadcast ? (
              <span>{event.broadcast}</span>
            ) : null}
          </div>
        </div>

        {/* Footer */}
        <footer className="flex shrink-0 items-center justify-between border-t border-white/[0.06] px-[clamp(1.25rem,3vw,2.5rem)] py-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/20">
            Kiosk slideshow paused
          </p>

          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/20">
            Football Priority 1
          </p>
        </footer>

        <div className="pointer-events-none absolute inset-0 rounded-[inherit] ring-1 ring-inset ring-white/[0.035]" />
      </section>
    </div>
  );
}

function TeamLogo({ event, side }: { event: SportsEvent; side: "home" | "away" }) {
  const team = side === "home" ? event.homeTeam : event.awayTeam;
  const identity = resolveSportsTeamIdentity(event.sport, team);
  return identity?.logoPath ? <img className="mx-auto mb-2 h-10 w-10 object-contain opacity-85" src={identity.logoPath} alt="" draggable={false} /> : null;
}
