"use client";

import type { SportsEvent } from "@/core/contracts/Sports";

interface KioskNascarViewProps {
  event: SportsEvent;
}

export default function KioskNascarView({
  event,
}: KioskNascarViewProps) {
  const session =
    event.metadata?.sessionType ??
    "Cup Series";

  const track =
    event.metadata?.track ??
    event.metadata?.circuit ??
    event.venue;

  const eventName =
    event.metadata?.eventName ??
    event.metadata?.competition ??
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
                Live NASCAR
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

        {/* Main */}
        <div className="flex min-h-0 flex-1 items-center justify-center px-[clamp(1.5rem,5vw,5rem)] py-6">
          <div className="w-full max-w-6xl">

            <div className="text-center">
              <p className="text-[clamp(.75rem,1.2vw,1rem)] font-semibold uppercase tracking-[0.24em] text-white/35">
                NASCAR
              </p>

              <h2 className="mx-auto mt-3 max-w-5xl text-[clamp(2rem,5vw,4.5rem)] font-black leading-[.95] tracking-[-0.055em] text-white">
                {eventName}
              </h2>

              {track ? (
                <p className="mt-4 text-[clamp(1rem,2vw,1.5rem)] font-semibold text-white/45">
                  {track}
                </p>
              ) : null}
            </div>

            {/* Lap / stage status */}
            <div className="mx-auto mt-[clamp(2rem,6vh,4rem)] max-w-4xl overflow-hidden rounded-[2rem] border border-white/[0.08] bg-white/[0.035]">
              <div className="px-[clamp(1.5rem,4vw,3rem)] py-[clamp(1.5rem,4vh,2.5rem)] text-center">
                <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-white/30">
                  Race Status
                </p>

                <p className="mt-3 text-[clamp(2rem,6vw,5rem)] font-black leading-none tracking-[-0.05em] text-white">
                  {event.statusDetail ?? "LIVE"}
                </p>
              </div>

              {/* Faux timing strip until richer telemetry exists */}
              <div className="grid grid-cols-3 border-t border-white/[0.07]">
                <div className="border-r border-white/[0.07] p-4 text-center">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-white/25">
                    Session
                  </p>

                  <p className="mt-2 text-sm font-bold text-white/70">
                    {session}
                  </p>
                </div>

                <div className="border-r border-white/[0.07] p-4 text-center">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-white/25">
                    Track
                  </p>

                  <p className="mt-2 truncate text-sm font-bold text-white/70">
                    {track ?? "Unavailable"}
                  </p>
                </div>

                <div className="p-4 text-center">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-white/25">
                    Broadcast
                  </p>

                  <p className="mt-2 truncate text-sm font-bold text-white/70">
                    {event.broadcast ?? "Unavailable"}
                  </p>
                </div>
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
            NASCAR Priority 4
          </p>
        </footer>

        <div className="pointer-events-none absolute inset-0 rounded-[inherit] ring-1 ring-inset ring-white/[0.035]" />
      </section>
    </div>
  );
}