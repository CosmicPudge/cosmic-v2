"use client";

import type { SportsEvent } from "@/core/contracts/Sports";
import { normalizeKioskSportsEvent } from "@/services/sports/kioskSelection";
import { selectKioskSportsBackground } from "@/components/os/widgets/shared/kioskSceneBackgrounds";
import KioskSceneBackground from "@/components/os/widgets/shared/KioskSceneBackground";

export default function KioskSportsAlert({ event, thresholdMinutes }: { event: SportsEvent; thresholdMinutes: number }) {
  const normalized = normalizeKioskSportsEvent(event);
  const sport = normalized?.sportLabel ?? event.sport.toUpperCase();
  const session = normalized?.eventType ?? event.metadata?.sessionType ?? "EVENT";
  return (
    <div className="relative h-full w-full">
      <KioskSceneBackground family="sports" state="scheduled" image={selectKioskSportsBackground(normalized?.backgroundKey)} />
      <div className="relative z-10 flex h-full items-center px-[7vw] py-[8vh]">
        <div className="max-w-[68vw] rounded-[2rem] border border-white/15 bg-black/35 px-10 py-8 shadow-2xl backdrop-blur-md">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-cyan-100/75">{sport} · Upcoming</p>
          <p className="mt-5 text-2xl font-semibold uppercase tracking-[0.18em] text-amber-100">Starts in {thresholdMinutes} minutes</p>
          <h1 className="mt-4 text-5xl font-semibold leading-tight text-white">{event.title}</h1>
          <p className="mt-5 text-xl uppercase tracking-[0.14em] text-white/75">
            {session}{event.venue ? ` · ${event.venue}` : ""}{event.sport === "f1" ? " · Apple TV" : event.broadcast ? ` · ${event.broadcast}` : ""}
          </p>
          <p className="mt-3 text-lg text-white/60">{event.start.toLocaleString([], { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</p>
        </div>
      </div>
    </div>
  );
}
