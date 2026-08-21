"use client";

import type { SportsEvent } from "@/core/contracts/Sports";

interface KioskBaseballViewProps {
  event: SportsEvent;
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
    return "0";
  }

  return String(team.score);
}

export default function KioskBaseballView({
  event,
}: KioskBaseballViewProps) {
  const awayName = getTeamName(event.awayTeam);
  const homeName = getTeamName(event.homeTeam);

  const awayScore = getScore(event.awayTeam);
  const homeScore = getScore(event.homeTeam);

  return (
    <div className="relative flex h-[100svh] w-full items-center justify-center overflow-hidden px-[clamp(1rem,3vw,3rem)] py-[clamp(1rem,3vh,2.5rem)]">
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
                Live Baseball
              </p>

              <h1 className="text-[clamp(1.15rem,2vw,1.7rem)] font-semibold tracking-tight text-white/90">
                {event.title}
              </h1>
            </div>
          </div>

          <p className="text-[clamp(.65rem,1vw,.8rem)] font-semibold uppercase tracking-[0.2em] text-white/25">
            Cosmic Sports
          </p>
        </header>

        {/* Main game area */}
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-[clamp(1.5rem,5vw,5rem)] py-6">

          {/* Inning / game status */}
          <div className="mb-[clamp(1.5rem,4vh,3rem)] text-center">
            <p className="text-[clamp(1rem,2.2vw,1.6rem)] font-black uppercase tracking-[0.16em] text-white/65">
              {event.statusDetail ?? "Live"}
            </p>
          </div>

          {/* Score */}
          <div className="grid w-full max-w-5xl grid-cols-[1fr_auto_1fr] items-center gap-[clamp(1.25rem,5vw,5rem)]">

            {/* Away */}
            <div className="min-w-0 text-right">
              <p className="truncate text-[clamp(1.5rem,4vw,3.25rem)] font-black uppercase tracking-[-0.04em] text-white/90">
                {awayName}
              </p>

              <p className="mt-3 text-[clamp(4.5rem,13vw,10rem)] font-black leading-[0.8] tracking-[-0.08em] text-white">
                {awayScore}
              </p>
            </div>

            {/* Baseball diamond */}
            <div className="flex flex-col items-center">
              <div className="relative h-[clamp(6rem,12vw,9rem)] w-[clamp(6rem,12vw,9rem)]">
                {/* Second */}
                <div className="absolute left-1/2 top-[8%] h-[24%] w-[24%] -translate-x-1/2 rotate-45 border border-white/35 bg-white/[0.07]" />

                {/* Third */}
                <div className="absolute left-[10%] top-1/2 h-[24%] w-[24%] -translate-y-1/2 rotate-45 border border-white/35 bg-white/[0.07]" />

                {/* First */}
                <div className="absolute right-[10%] top-1/2 h-[24%] w-[24%] -translate-y-1/2 rotate-45 border border-white/35 bg-white/[0.07]" />

                {/* Home */}
                <div className="absolute bottom-[8%] left-1/2 h-[20%] w-[20%] -translate-x-1/2 rotate-45 border border-white/20 bg-white/[0.035]" />
              </div>

              <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.24em] text-white/25">
                Live
              </p>
            </div>

            {/* Home */}
            <div className="min-w-0 text-left">
              <p className="truncate text-[clamp(1.5rem,4vw,3.25rem)] font-black uppercase tracking-[-0.04em] text-white/90">
                {homeName}
              </p>

              <p className="mt-3 text-[clamp(4.5rem,13vw,10rem)] font-black leading-[0.8] tracking-[-0.08em] text-white">
                {homeScore}
              </p>
            </div>
          </div>

          {/* Information strip */}
          <div className="mt-[clamp(2rem,6vh,4rem)] flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[clamp(.75rem,1.2vw,1rem)] font-medium text-white/40">
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
            Baseball Priority 2
          </p>
        </footer>

        <div className="pointer-events-none absolute inset-0 rounded-[inherit] ring-1 ring-inset ring-white/[0.035]" />
      </section>
    </div>
  );
}