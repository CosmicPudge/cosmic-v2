"use client";

import type { SportsEvent } from "@/core/contracts/Sports";

interface KioskF1ViewProps {
  event: SportsEvent;
}

export default function KioskF1View({
  event,
}: KioskF1ViewProps) {
  const session =
    event.metadata?.sessionType ??
    "Race";

  const track =
    event.metadata?.track ??
    event.metadata?.circuit ??
    event.venue;

  const competition =
    event.metadata?.competition ??
    event.metadata?.eventName ??
    event.title;

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
                Live Formula 1
              </p>

              <h1 className="text-[clamp(1.15rem,2vw,1.7rem)] font-semibold tracking-tight text-white/90">
                {session}
              </h1>
            </div>
          </div>

          <p className="text-[clamp(.65rem,1vw,.8rem)] font-semibold uppercase tracking-[0.2em] text-white/25">
            Cosmic Sports
          </p>
        </header>

        {/* Main content */}
        <div className="flex min-h-0 flex-1 items-center justify-center px-[clamp(1.5rem,5vw,5rem)] py-6">
          <div className="w-full max-w-6xl">

            {/* Event */}
            <div className="text-center">
              <p className="text-[clamp(.75rem,1.2vw,1rem)] font-semibold uppercase tracking-[0.24em] text-white/35">
                Formula 1
              </p>

              <h2 className="mx-auto mt-3 max-w-5xl text-[clamp(2rem,5vw,4.5rem)] font-black leading-[.95] tracking-[-0.055em] text-white">
                {competition}
              </h2>

              {track ? (
                <p className="mt-4 text-[clamp(1rem,2vw,1.5rem)] font-semibold text-white/45">
                  {track}
                </p>
              ) : null}
            </div>

            {/* Live status */}
            <div className="mx-auto mt-[clamp(2rem,6vh,4rem)] max-w-4xl rounded-[2rem] border border-white/[0.08] bg-white/[0.035] px-[clamp(1.5rem,4vw,3rem)] py-[clamp(1.5rem,4vh,2.5rem)] text-center">
              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-white/30">
                Current Race Status
              </p>

              <p className="mt-3 text-[clamp(2rem,6vw,5rem)] font-black leading-none tracking-[-0.05em] text-white">
                {event.statusDetail ?? "LIVE"}
              </p>
            </div>

            {/* Information */}
            <div className="mt-[clamp(1.5rem,5vh,3rem)] grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4 text-center">
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/25">
                  Session
                </p>

                <p className="mt-2 font-bold text-white/75">
                  {session}
                </p>
              </div>

              <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4 text-center">
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/25">
                  Circuit
                </p>

                <p className="mt-2 truncate font-bold text-white/75">
                  {track ?? "Unavailable"}
                </p>
              </div>

              <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4 text-center">
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/25">
                  Broadcast
                </p>

                <p className="mt-2 truncate font-bold text-white/75">
                  {event.broadcast ?? "Unavailable"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="flex shrink-0 items-center justify-between border-t border-white/[0.06] px-[clamp(1.25rem,3vw,2.5rem)] py-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/20">
            Kiosk slideshow paused
          </p>

          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/20">
            Formula 1 Priority 3
          </p>
        </footer>

        <div className="pointer-events-none absolute inset-0 rounded-[inherit] ring-1 ring-inset ring-white/[0.035]" />
      </section>
    </div>
  );
}