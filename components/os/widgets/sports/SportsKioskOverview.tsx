"use client";

import { useMemo } from "react";
import { useSports } from "@/hooks/os/useSports";
import { useSettingsRepository } from "@/services/settings/localRepository";
import { prioritizeFollowedEvents } from "@/services/sports/preferences";
import { normalizeKioskSportsEvent } from "@/services/sports/kioskSelection";
import { selectKioskSportsBackground } from "@/components/os/widgets/shared/kioskSceneBackgrounds";
import type { SportsEvent } from "@/core/contracts/Sports";

const SPORT_ORDER = ["nfl", "mlb", "f1", "nascar", "college-football"] as const;

export default function SportsKioskOverview() {
  const { data, loading } = useSports({ kioskEligibility: true });
  const { data: settings } = useSettingsRepository();
  const events = useMemo(() => {
    if (!data) return [];
    const unique = [...new Map([...data.live, ...data.upcoming, ...data.featured].map((event) => [event.id, event])).values()];
    return prioritizeFollowedEvents(unique, settings.preferences).filter((event) => normalizeKioskSportsEvent(event));
  }, [data, settings.preferences]);
  const primary = events[0];
  const primaryView = primary ? normalizeKioskSportsEvent(primary) : undefined;
  const secondary = SPORT_ORDER.flatMap((sport) => events.find((event) => event.sport === sport && event.id !== primary?.id) ?? []).slice(0, 2);
  const league = events.filter((event) => event.id !== primary?.id && !secondary.some((item) => item.id === event.id)).slice(0, 5);
  const background = primaryView ? selectKioskSportsBackground(primaryView.backgroundKey) : "/dashboard/sports/stadium.webp";
  const now = new Date();

  return <section className="relative h-full w-full overflow-hidden bg-[#090316] text-white">
    <img src={background} alt="" className="absolute inset-0 h-full w-full object-cover" />
    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,2,18,.22),rgba(10,3,28,.64)_47%,rgba(8,3,24,.92))]" />
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_48%_28%,rgba(139,44,255,.18),transparent_38%)]" />
    <div className="relative z-10 flex h-full flex-col px-[3.2vw] pb-[3.8vh] pt-[4.5vh]">
      <div className="text-[clamp(.65rem,1.15vw,1.1rem)] font-semibold uppercase tracking-[.35em]">COSMOS <span className="text-violet-500">•</span> <span className="font-normal text-white/65">SPORTS</span></div>
      <h1 className="mt-[5vh] text-[clamp(3rem,6.3vw,6.2rem)] font-black leading-[.88] tracking-[-.055em] drop-shadow-[0_0_22px_rgba(174,91,255,.5)]">{headline(primary)}</h1>
      <p className="mt-3 text-[clamp(1.25rem,2.4vw,2.35rem)] font-light">{dateLine(now)}</p>

      <div className="mt-[4.5vh] grid min-h-0 flex-1 grid-cols-[2.15fr_.95fr] gap-[1.2vw]">
        <div className="grid min-h-0 grid-rows-[1.25fr_.85fr] gap-[1.2vw]">
          <EventHero event={primary} loading={loading} />
          <div className="grid min-h-0 grid-cols-2 gap-[1.2vw]">
            {secondary.length ? secondary.map((event) => <MiniEvent key={event.id} event={event} />) : <EmptyMini label="More favorites will appear here" />}
          </div>
        </div>
        <aside className="min-h-0 rounded-[1.6vw] border border-violet-400/45 bg-[#100720]/80 p-[1.2vw] shadow-[inset_0_0_30px_rgba(124,58,237,.08)] backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-white/10 pb-3 text-[clamp(.7rem,1vw,.95rem)] uppercase tracking-[.23em] text-violet-100"><span>🏆 &nbsp; Around the League</span><span className="text-white/55">Upcoming</span></div>
          <div className="mt-2 flex flex-col">{league.length ? league.map((event) => <LeagueRow key={event.id} event={event} />) : <p className="py-12 text-center text-white/45">No other followed events right now.</p>}</div>
        </aside>
      </div>
    </div>
  </section>;
}

function EventHero({ event, loading }: { event?: SportsEvent; loading: boolean }) {
  if (!event) return <div className="flex items-center justify-center rounded-[1.6vw] border border-violet-400/45 bg-[#100720]/80 text-xl text-white/55">{loading ? "Loading sports…" : "No followed events scheduled."}</div>;
  const view = normalizeKioskSportsEvent(event)!;
  return <article className="relative overflow-hidden rounded-[1.6vw] border border-violet-400/55 bg-[linear-gradient(110deg,rgba(17,7,38,.9),rgba(17,7,38,.62))] px-[2.2vw] py-[2.2vh] shadow-[0_0_24px_rgba(124,58,237,.18)] backdrop-blur-md">
    <div className="flex items-center justify-between text-[clamp(.72rem,1.1vw,1rem)] uppercase tracking-[.25em] text-violet-100"><span>{sportIcon(event)} &nbsp; {view.sportLabel}</span><span>{view.live ? "● LIVE" : view.eventType}</span></div>
    <div className="grid h-[calc(100%-2rem)] grid-cols-[1fr_auto_1fr] items-center gap-[2vw]">
      <Team event={event} side="away" />
      <div className="min-w-[9rem] text-center"><span className="rounded-full bg-violet-600 px-5 py-2 text-xs font-black uppercase tracking-[.12em] shadow-[0_0_20px_rgba(139,92,246,.6)]">{view.live ? "Live" : event.status === "pregame" ? "Pregame" : "Up Next"}</span><p className="mt-4 text-[clamp(1.8rem,3vw,3.1rem)] font-black">{view.live ? score(event) : eventTime(event)}</p><p className="mt-2 text-[clamp(.75rem,1vw,.95rem)] text-white/70">⌖ {view.venueName ?? "Venue TBA"}</p>{view.broadcaster ? <p className="mt-1 text-sm text-white/55">{view.broadcaster}</p> : null}</div>
      <Team event={event} side="home" />
    </div>
  </article>;
}

function Team({ event, side }: { event: SportsEvent; side: "home" | "away" }) {
  const team = side === "home" ? event.homeTeam : event.awayTeam;
  if (!team) return <div className={side === "home" ? "text-left" : "text-right"}><p className="text-[clamp(1.5rem,2.5vw,2.6rem)] font-black uppercase">{event.metadata?.eventName ?? event.title}</p></div>;
  return <div className={side === "home" ? "text-left" : "text-right"}><p className="text-[clamp(.7rem,.9vw,.85rem)] uppercase tracking-[.2em] text-violet-200/80">{team.abbreviation}</p><p className="mt-1 text-[clamp(1.6rem,2.8vw,3rem)] font-black uppercase leading-none">{team.name}</p><p className="mt-2 text-[clamp(.9rem,1.25vw,1.15rem)] text-white/70">{team.record ?? ""}</p></div>;
}

function MiniEvent({ event }: { event: SportsEvent }) {
  const view = normalizeKioskSportsEvent(event)!;
  return <article className="overflow-hidden rounded-[1.45vw] border border-violet-400/45 bg-[#100720]/82 p-[1.4vw] backdrop-blur-md"><div className="flex justify-between text-[clamp(.65rem,.9vw,.82rem)] uppercase tracking-[.2em] text-violet-100"><span>{sportIcon(event)} &nbsp; {view.sportLabel}</span><span>{view.eventType}</span></div><div className="mt-[2vh] grid grid-cols-[1fr_auto] items-end gap-3"><div><p className="line-clamp-2 text-[clamp(1.1rem,1.75vw,1.7rem)] font-black leading-tight">{event.title}</p><p className="mt-2 text-[clamp(.7rem,.9vw,.85rem)] text-white/60">{view.venueName ?? view.venueLocation ?? "Venue TBA"}</p></div><div className="text-right"><span className="rounded-full bg-violet-600/80 px-3 py-1 text-[.65rem] font-bold uppercase">{view.live ? "Live" : "Next"}</span><p className="mt-2 text-[clamp(1rem,1.4vw,1.35rem)] font-black">{eventTime(event)}</p></div></div></article>;
}
function EmptyMini({ label }: { label: string }) { return <div className="col-span-2 flex items-center justify-center rounded-[1.45vw] border border-violet-400/30 bg-[#100720]/72 text-white/45">{label}</div>; }
function LeagueRow({ event }: { event: SportsEvent }) { const view=normalizeKioskSportsEvent(event)!; return <div className="grid grid-cols-[1fr_auto] gap-3 border-b border-white/10 px-2 py-[1.45vh] last:border-0"><div className="min-w-0"><p className="truncate text-[clamp(.78rem,1.05vw,1rem)] font-bold">{event.title}</p><p className="mt-1 text-xs uppercase tracking-[.12em] text-white/45">{view.sportLabel}</p></div><div className="text-right"><p className="text-[clamp(.72rem,.95vw,.9rem)] text-violet-100">{eventTime(event)}</p><p className="mt-1 text-xs text-white/45">{event.broadcast ?? ""}</p></div></div>; }
function headline(event?: SportsEvent) { if (!event) return "Sports"; const text=`${event.homeTeam?.name ?? ""} ${event.awayTeam?.name ?? ""} ${event.title}`.toLowerCase(); if(text.includes("packers")) return "Packers Game Day"; if(text.includes("angels")) return "Angels Game Day"; if(event.sport==="f1") return "Formula 1"; if(event.sport==="nascar") return "NASCAR"; if(event.sport==="college-football") return "College Football"; return "Game Day"; }
function sportIcon(event: SportsEvent) { return event.sport==="nfl"||event.sport==="college-football"?"◉":event.sport==="mlb"?"◌":event.sport==="f1"?"F1":"◆"; }
function score(event: SportsEvent) { return event.awayTeam?.score !== undefined && event.homeTeam?.score !== undefined ? `${event.awayTeam.score} – ${event.homeTeam.score}` : "LIVE"; }
function eventTime(event: SportsEvent) { return event.start.toLocaleString([], { weekday:"short", hour:"numeric", minute:"2-digit" }); }
function dateLine(date: Date) { return `Today  |  ${date.toLocaleDateString([], { weekday:"long", month:"long", day:"numeric" })}`; }
