"use client";

import { useMemo } from "react";
import { useSports } from "@/hooks/os/useSports";
import { useSettingsRepository } from "@/services/settings/localRepository";
import { isFavoriteEvent } from "@/services/sports/preferences";
import { normalizeKioskSportsEvent } from "@/services/sports/kioskSelection";
import { selectKioskSportsBackground } from "@/components/os/widgets/shared/kioskSceneBackgrounds";
import type { SportsEvent, SportsSnapshot, SportsStanding, SportsTeam } from "@/core/contracts/Sports";
import SportsTeamLogo from "@/components/apps/sports/SportsTeamLogo";

const FAVORITES = [
  { key: "nfl", label: "Green Bay Packers", match: (event: SportsEvent) => event.sport === "nfl" && /packers|green bay/i.test(event.title + " " + event.homeTeam?.name + " " + event.awayTeam?.name) },
  { key: "mlb", label: "Los Angeles Angels", match: (event: SportsEvent) => event.sport === "mlb" && /angels/i.test(event.title + " " + event.homeTeam?.name + " " + event.awayTeam?.name) },
  { key: "f1", label: "Formula 1", match: (event: SportsEvent) => event.sport === "f1" },
  { key: "nascar", label: "NASCAR", match: (event: SportsEvent) => event.sport === "nascar" },
  { key: "usu", label: "Utah State", match: (event: SportsEvent) => event.sport === "college-football" && /utah state|aggies/i.test(event.title + " " + event.homeTeam?.name + " " + event.awayTeam?.name) },
  { key: "utah", label: "Utah Utes", match: (event: SportsEvent) => event.sport === "college-football" && /\butah\b|utes/i.test(event.title + " " + event.homeTeam?.name + " " + event.awayTeam?.name) && !/utah state/i.test(event.title + " " + event.homeTeam?.name + " " + event.awayTeam?.name) },
] as const;
function activeEvent(event: SportsEvent) { return !["final","cancelled","postponed"].includes(event.status) && (event.status === "live" || event.start.getTime() >= Date.now() - 60_000); }
const UTAH_STATE_2026 = [
  ["2026-10-10T01:00:00Z","Washington State Cougars","home","The CW","Maverik Stadium"],
  ["2026-10-24T23:30:00Z","Texas State Bobcats","away","CBS Sports Network","UFCU Stadium"],
  ["2026-10-31T19:30:00Z","Colorado State Rams","home","USA Network","Maverik Stadium"],
  ["2026-11-08T02:30:00Z","Fresno State Bulldogs","home","USA Network","Maverik Stadium"],
  ["2026-11-15T02:30:00Z","San Diego State Aztecs","away","USA Network","Snapdragon Stadium"],
  ["2026-11-22T03:30:00Z","Oregon State Beavers","away","CBS Sports Network","Reser Stadium"],
] as const;
function officialUsuSchedule(): SportsEvent[] {
  return UTAH_STATE_2026.map(([start,opponent,side,broadcast,venue],index) => ({
    id: `usu-official-2026-${index}`, sport:"college-football" as const,
    title: side==="home" ? `${opponent} at Utah State Aggies` : `Utah State Aggies at ${opponent}`,
    start:new Date(start), status:"scheduled" as const,
    homeTeam: side==="home" ? {id:"328",name:"Utah State Aggies",abbreviation:"USU"} : {name:opponent},
    awayTeam: side==="away" ? {id:"328",name:"Utah State Aggies",abbreviation:"USU"} : {name:opponent},
    venue,broadcast,source:"Utah State Athletics",sourceUrl:"https://utahstateaggies.com/news/2026/5/27/utah-state-football-selected-for-11-national-broadcasts.aspx",
  })).filter(activeEvent);
}
const UTAH_2026 = [
 ["2026-10-11T02:15:00Z","Kansas Jayhawks","home","ESPN","Rice-Eccles Stadium"],
 ["2026-10-18T02:15:00Z","Colorado Buffaloes","away","TBA","Folsom Field"],
 ["2026-11-28T02:00:00Z","West Virginia Mountaineers","home","TBA","Rice-Eccles Stadium"],
] as const;
function officialUtahSchedule(): SportsEvent[] {
 return UTAH_2026.map(([start,opponent,side,broadcast,venue],index)=>({
  id:`utah-official-2026-${index}`,sport:"college-football" as const,
  title:side==="home" ? `${opponent} at Utah Utes` : `Utah Utes at ${opponent}`,
  start:new Date(start),status:"scheduled" as const,
  homeTeam:side==="home" ? {id:"254",name:"Utah Utes",abbreviation:"UTAH"} : {name:opponent},
  awayTeam:side==="away" ? {id:"254",name:"Utah Utes",abbreviation:"UTAH"} : {name:opponent},
  venue,broadcast,source:"University of Utah Athletics",sourceUrl:"https://utahutes.com/sports/football/schedule/text",
 })).filter(activeEvent);
}
function fullDate(event: SportsEvent) { return event.start.toLocaleString([], { weekday:"short", month:"short", day:"numeric", hour:"numeric", minute:"2-digit" }); }

function normalizedName(value?: string) { return (value ?? "").toLowerCase().replace(/[^a-z0-9]/g, " ").replace(/\\s+/g, " ").trim(); }
function standingFor(team: SportsTeam | undefined, sport: SportsEvent["sport"], standings?: SportsSnapshot["standings"]): SportsStanding | undefined {
 if (!team || !standings?.[sport]) return undefined;
 const name=normalizedName(team.name);
 const abbreviation=normalizedName(team.abbreviation);
 return standings[sport]?.find((standing) => {
   const candidate=normalizedName(standing.team ?? standing.name);
   return candidate===name || (name.length>4 && (candidate.endsWith(name) || name.endsWith(candidate))) ||
     (abbreviation.length>=3 && candidate===abbreviation);
 });
}
function recordFor(team: SportsTeam | undefined, sport: SportsEvent["sport"], standings?: SportsSnapshot["standings"]): string | undefined {
 const standing=standingFor(team,sport,standings);
 if (standing?.record) return standing.record;
 if (standing && typeof standing.wins==="number" && typeof standing.losses==="number")
   return [standing.wins,standing.losses,...(standing.draws ? [standing.draws] : [])].join("-");
 return team?.record;
}
function favoriteRecord(key: string, standings?: SportsSnapshot["standings"]): string | undefined {
 const sport=key==="mlb" ? "mlb" : key==="nfl" ? "nfl" : "college-football";
 const pattern=key==="mlb" ? /angels/i : key==="nfl" ? /green bay|packers/i : key==="usu" ? /utah state/i : /utah utes|^utah$/i;
 const match=standings?.[sport]?.find((standing)=>pattern.test(standing.team ?? standing.name));
 return match?.record ?? (typeof match?.wins==="number" && typeof match?.losses==="number" ? `${match.wins}-${match.losses}` : undefined);
}
export default function SportsKioskOverview() {
  const { data, loading } = useSports({ kioskEligibility: false });
  
  const events = useMemo(() => {
    if (!data) return [];
    return [...new Map([...data.live, ...data.upcoming, ...data.featured].map((event) => [event.id, event])).values()]
      .filter((event) => activeEvent(event) && FAVORITES.some((favorite) => favorite.match(event)))
      .sort((a, b) => (a.status === "live" ? -1 : b.status === "live" ? 1 : a.start.getTime() - b.start.getTime()));
  }, [data]);
  const cards = FAVORITES.map((favorite) => ({ ...favorite, event: events.find(favorite.match) ?? (favorite.key === "usu" ? officialUsuSchedule()[0] : favorite.key === "utah" ? officialUtahSchedule()[0] : undefined) }));
  const primary = cards[0].event ?? events[0];
  const primaryView = primary ? normalizeKioskSportsEvent(primary) : undefined;
  const secondary = cards.filter((card) => card.key !== "nfl");
  const league = [...events, ...officialUtahSchedule().filter((item) => !events.some((event) => event.sport === "college-football" && Math.abs(event.start.getTime() - item.start.getTime()) < 60_000 && /utah utes/i.test(event.title))), ...officialUsuSchedule().filter((item) => !events.some((event) => event.sport === "college-football" && Math.abs(event.start.getTime() - item.start.getTime()) < 60_000 && /utah state/i.test(event.title)))].filter((event) => event.id !== primary?.id && !secondary.some((card) => card.event?.id === event.id)).slice(0, 5);
  const background = primaryView ? selectKioskSportsBackground(primaryView.backgroundKey) : "/dashboard/sports/stadium.webp";
  const now = new Date();

  return <section className="relative h-full w-full touch-none select-none overflow-hidden overscroll-none bg-[#090316] text-white">
    <img src={background} alt="" className="absolute inset-0 h-full w-full object-cover" />
    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,2,18,.22),rgba(10,3,28,.64)_47%,rgba(8,3,24,.92))]" />
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_48%_28%,rgba(139,44,255,.18),transparent_38%)]" />
    <div className="relative z-10 flex h-full min-h-0 flex-col overflow-hidden px-[3.2vw] pb-[3.8vh] pt-[4.5vh]">
      <div className="text-[clamp(.65rem,1.15vw,1.1rem)] font-semibold uppercase tracking-[.35em]">COSMOS <span className="text-violet-500">•</span> <span className="font-normal text-white/65">SPORTS</span></div>
      <h1 className="mt-[5vh] text-[clamp(3rem,6.3vw,6.2rem)] font-black leading-[.88] tracking-[-.055em] drop-shadow-[0_0_22px_rgba(174,91,255,.5)]">{headline(primary)}</h1>
      <p className="mt-3 text-[clamp(1.25rem,2.4vw,2.35rem)] font-light">{dateLine(now)}</p>

      <div className="mt-[4.5vh] grid min-h-0 flex-1 grid-cols-[2.1fr_.95fr] gap-[1.2vw]">
        <div className="grid min-h-0 grid-rows-[1fr_1.12fr] gap-[1.2vw]">
          <EventHero event={primary} loading={loading} standings={data?.standings} />
          <div className="grid min-h-0 grid-cols-3 grid-rows-2 gap-[.7vw]">
            {secondary.map((card) => <MiniEvent key={card.key} event={card.event} label={card.label} record={favoriteRecord(card.key,data?.standings)} standings={data?.standings} />)}
          </div>
        </div>
        <aside className="min-h-0 overflow-hidden rounded-[1.6vw] border border-violet-400/45 bg-[#100720]/80 p-[1.2vw] shadow-[inset_0_0_30px_rgba(124,58,237,.08)] backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-white/10 pb-3 text-[clamp(.7rem,1vw,.95rem)] uppercase tracking-[.23em] text-violet-100"><span>🏆 &nbsp; More Matchups</span><span className="text-white/55">Upcoming</span></div>
          <div className="mt-2 flex min-h-0 flex-col overflow-hidden">{league.length ? league.map((event) => <LeagueRow key={event.id} event={event} />) : <p className="py-12 text-center text-white/45">No other followed events right now.</p>}</div>
        </aside>
      </div>
    </div>
  </section>;
}

function EventHero({ event, loading, standings }: { event?: SportsEvent; loading: boolean; standings?: SportsSnapshot["standings"] }) {
  if (!event) return <div className="flex items-center justify-center rounded-[1.6vw] border border-violet-400/45 bg-[#100720]/80 text-xl text-white/55">{loading ? "Loading sports…" : "No followed events scheduled."}</div>;
  const view = normalizeKioskSportsEvent(event)!;
  return <article className="relative overflow-hidden rounded-[1.6vw] border border-violet-400/55 bg-[linear-gradient(110deg,rgba(17,7,38,.9),rgba(17,7,38,.62))] px-[2.2vw] py-[2.2vh] shadow-[0_0_24px_rgba(124,58,237,.18)] backdrop-blur-md">
    <div className="flex items-center justify-between text-[clamp(.72rem,1.1vw,1rem)] uppercase tracking-[.25em] text-violet-100"><span>{sportIcon(event)} &nbsp; {view.sportLabel}</span><span>{view.live ? "● LIVE" : view.eventType}</span></div>
    <div className="grid h-[calc(100%-2rem)] grid-cols-[1fr_auto_1fr] items-center gap-[2vw]">
      <Team event={event} side="away" standings={standings} />
      <div className="min-w-[9rem] text-center"><span className="rounded-full bg-violet-600 px-5 py-2 text-xs font-black uppercase tracking-[.12em] shadow-[0_0_20px_rgba(139,92,246,.6)]">{view.live ? "Live" : event.status === "pregame" ? "Pregame" : "Up Next"}</span><p className="mt-4 text-[clamp(1.8rem,3vw,3.1rem)] font-black">{view.live ? score(event) : eventTime(event)}</p><p className="mt-1 text-[clamp(.8rem,1.1vw,1.1rem)] font-semibold text-violet-200">{event.start.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" })}</p><p className="mt-2 text-[clamp(.75rem,1vw,.95rem)] text-white/70">⌖ {view.venueName ?? "Venue TBA"}</p>{view.broadcaster ? <p className="mt-1 text-sm text-white/55">{view.broadcaster}</p> : null}</div>
      <Team event={event} side="home" standings={standings} />
    </div>
  </article>;
}

function Team({ event, side, standings }: { event: SportsEvent; side: "home" | "away"; standings?: SportsSnapshot["standings"] }) {
  const team = side === "home" ? event.homeTeam : event.awayTeam;
  if (!team) return <div className={side === "home" ? "text-left" : "text-right"}><p className="text-[clamp(1.5rem,2.5vw,2.6rem)] font-black uppercase">{event.metadata?.eventName ?? event.title}</p></div>;
  return <div className={side === "home" ? "text-left" : "text-right"}><div className={`mb-2 flex ${side === "home" ? "justify-start" : "justify-end"}`}><SportsTeamLogo sport={event.sport} team={logoTeam(event,team)} size="lg" /></div><p className="text-[clamp(.7rem,.9vw,.85rem)] uppercase tracking-[.2em] text-violet-200/80">{team.abbreviation}</p><p className="mt-1 text-[clamp(1.6rem,2.8vw,3rem)] font-black uppercase leading-none">{team.name}</p><p className="mt-2 text-[clamp(.9rem,1.25vw,1.15rem)] text-white/70">{recordFor(team,event.sport,standings) ? `Record: ${recordFor(team,event.sport,standings)}` : ""}</p></div>;
}

function MiniEvent({ event, label, record, standings }: { event?: SportsEvent; label: string; record?: string; standings?: SportsSnapshot["standings"] }) {
  if (!event) return <article className="flex min-h-0 flex-col justify-between rounded-[1vw] border border-violet-400/30 bg-[linear-gradient(130deg,rgba(64,24,109,.8),rgba(12,6,35,.85))] p-[1vw]"><span className="flex items-center gap-2 text-[clamp(.7rem,.95vw,.95rem)] font-bold uppercase tracking-[.12em] text-violet-100"><CategoryMark label={label} />{label}</span><p className="text-[clamp(.8rem,1vw,1rem)] text-white/70">{record ? `Season record: ${record}` : "Season record unavailable"}</p><p className="text-[clamp(.7rem,.9vw,.9rem)] text-white/50">No upcoming event available</p></article>;
  const view = normalizeKioskSportsEvent(event)!;
  return <article className="overflow-hidden rounded-[1vw] border border-violet-400/45 bg-[linear-gradient(130deg,rgba(69,26,115,.85),rgba(12,6,35,.84))] p-[1vw] backdrop-blur-md"><div className="flex justify-between text-[clamp(.65rem,.9vw,.82rem)] uppercase tracking-[.2em] text-violet-100"><span className="flex items-center gap-2"><CategoryMark label={label} />{label}</span><span>{view.eventType}</span></div><div className="mt-[.5vh] flex h-[calc(100%-2rem)] flex-col gap-1"><div><div className="flex items-center gap-2">{event.homeTeam && <SportsTeamLogo sport={event.sport} team={logoTeam(event,event.homeTeam)} size="sm" />}{event.awayTeam && <SportsTeamLogo sport={event.sport} team={logoTeam(event,event.awayTeam)} size="sm" />}<p className="truncate text-[clamp(.9rem,1.3vw,1.35rem)] font-black leading-tight">{event.title}</p></div><p className="text-[clamp(.72rem,.95vw,.9rem)] font-bold text-white/90">{record ?? (event.homeTeam && recordFor(event.homeTeam,event.sport,standings)) ?? (event.awayTeam && recordFor(event.awayTeam,event.sport,standings)) ?? "Record unavailable"}</p><p className="mt-1 text-[clamp(.7rem,.9vw,.85rem)] text-white/70">{view.venueName ?? view.venueLocation ?? "Venue TBA"}{event.broadcast ? ` · ${event.broadcast}` : ""}</p></div><div className="mt-auto flex items-center justify-between gap-1"><span className="rounded-full bg-violet-600/80 px-2 py-1 text-[.6rem] font-bold uppercase">{view.live ? "Live" : "Next"}</span><p className="text-[clamp(.8rem,1.05vw,1.1rem)] font-black text-violet-100">{fullDate(event)}</p></div></div></article>;
}
function LeagueRow({ event }: { event: SportsEvent }) { const view=normalizeKioskSportsEvent(event)!; return <div className="grid min-h-0 grid-cols-[minmax(0,1fr)_auto] gap-3 overflow-hidden border-b border-white/10 px-2 py-[1.45vh] last:border-0"><div className="min-w-0"><p className="truncate text-[clamp(.78rem,1.05vw,1rem)] font-bold">{event.title}</p><p className="mt-1 text-xs uppercase tracking-[.12em] text-white/45">{view.sportLabel}</p></div><div className="text-right"><p className="text-[clamp(.72rem,.95vw,.9rem)] text-violet-100">{fullDate(event)}</p><p className="mt-1 text-xs text-white/45">{event.broadcast ?? ""}</p></div></div>; }
function logoTeam(event: SportsEvent, team: NonNullable<SportsEvent["homeTeam"]>) {
  const id=team.id ?? "";
  const abbreviation=(team.abbreviation ?? "").toLowerCase();
  if(event.sport==="nfl" && /^[a-z]{2,3}$/.test(abbreviation)) return {...team,logo:`https://a.espncdn.com/i/teamlogos/nfl/500/${abbreviation}.png`};
  if(event.sport==="college-football" && (id==="328" || /utah state/i.test(team.name))) return {...team,id:"328",logo:"https://a.espncdn.com/i/teamlogos/ncaa/500/328.png"};
  if(event.sport==="college-football" && (id==="254" || /utah utes|^utah$/i.test(team.name))) return {...team,id:"254",logo:"https://a.espncdn.com/i/teamlogos/ncaa/500/254.png"};
  if(event.sport==="college-football" && /washington state/i.test(team.name)) return {...team,id:"265",logo:"https://a.espncdn.com/i/teamlogos/ncaa/500/265.png"};
 if(event.sport==="college-football" && /kansas jayhawks/i.test(team.name)) return {...team,id:"2305",logo:"https://a.espncdn.com/i/teamlogos/ncaa/500/2305.png"};
 return team;
}
function CategoryMark({label}:{label:string}) { 
 const key=label.toLowerCase();
 if(key.includes("angels")) return <img src="/logos/mlb/LAA.svg" alt="" className="h-7 w-7 object-contain" />;
 if(key.includes("utes")) return <img src="https://a.espncdn.com/i/teamlogos/ncaa/500/254.png" alt="Utah Utes" className="h-8 w-8 shrink-0 object-contain" />;
 if(key.includes("utah state")) return <img src="https://a.espncdn.com/i/teamlogos/ncaa/500/328.png" alt="Utah State Aggies" className="h-8 w-8 shrink-0 rounded-full bg-white/90 p-1 object-contain" />;
 if(key.includes("formula")) return <b className="text-base italic text-red-500">F1</b>;
 if(key.includes("nascar")) return <b className="text-sm italic text-orange-400">NASCAR</b>;
 return <span className="text-violet-300">◉</span>;
}
function headline(event?: SportsEvent) { if (!event) return "Sports"; const text=`${event.homeTeam?.name ?? ""} ${event.awayTeam?.name ?? ""} ${event.title}`.toLowerCase(); if(text.includes("packers")) return "Packers Game Day"; if(text.includes("angels")) return "Angels Game Day"; if(event.sport==="f1") return "Formula 1"; if(event.sport==="nascar") return "NASCAR"; if(event.sport==="college-football") return "College Football"; return "Game Day"; }
function sportIcon(event: SportsEvent) { return event.sport==="nfl"||event.sport==="college-football"?"◉":event.sport==="mlb"?"◌":event.sport==="f1"?"F1":"◆"; }
function score(event: SportsEvent) { return event.awayTeam?.score !== undefined && event.homeTeam?.score !== undefined ? `${event.awayTeam.score} – ${event.homeTeam.score}` : "LIVE"; }
function eventTime(event: SportsEvent) { return event.start.toLocaleString([], { weekday:"short", hour:"numeric", minute:"2-digit" }); }
function dateLine(date: Date) { return `Today  |  ${date.toLocaleDateString([], { weekday:"long", month:"long", day:"numeric" })}`; }
