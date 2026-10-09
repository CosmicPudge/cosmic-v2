"use client";

import { useMemo } from "react";
import { useSports } from "@/hooks/os/useSports";
import { useSettingsRepository } from "@/services/settings/localRepository";
import { isFavoriteEvent } from "@/services/sports/preferences";
import { normalizeKioskSportsEvent } from "@/services/sports/kioskSelection";
import { selectKioskSportsBackground } from "@/components/os/widgets/shared/kioskSceneBackgrounds";
import type { SportsEvent } from "@/core/contracts/Sports";
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

function withinDays(event: SportsEvent | undefined, days: number) {
  if (!event) return false;
  const delta=event.start.getTime()-Date.now();
  return event.status==="live" || (delta>=-60_000 && delta<=days*86_400_000);
}
function firstCard(cards: ReturnType<typeof buildFavoriteCards>, key: string) { return cards.find((card)=>card.key===key); }
function buildFavoriteCards(events: SportsEvent[]) {
  return FAVORITES.map((favorite) => ({ ...favorite, event: events.find(favorite.match) ?? (favorite.key === "usu" ? officialUsuSchedule()[0] : favorite.key === "utah" ? officialUtahSchedule()[0] : undefined) }));
}
export default function SportsKioskOverview() {
  const { data, loading } = useSports({ kioskEligibility: false });
  
  const events = useMemo(() => {
    if (!data) return [];
    return [...new Map([...data.live, ...data.upcoming, ...data.featured].map((event) => [event.id, event])).values()]
      .filter((event) => activeEvent(event) && FAVORITES.some((favorite) => favorite.match(event)))
      .sort((a, b) => (a.status === "live" ? -1 : b.status === "live" ? 1 : a.start.getTime() - b.start.getTime()));
  }, [data]);
  const cards = buildFavoriteCards(events);
  const packers = firstCard(cards,"nfl");
  const angels = firstCard(cards,"mlb");
  const f1 = firstCard(cards,"f1");
  const usu = firstCard(cards,"usu");
  const utah = firstCard(cards,"utah");
  // The hero is chronological across followed sports, not permanently NFL.
  // A currently-live followed event wins; otherwise the next event wins.
  const heroCandidates = [packers?.event, angels?.event, f1?.event, usu?.event, utah?.event, firstCard(cards,"nascar")?.event]
    .filter((event): event is SportsEvent => Boolean(event))
    .sort((a,b) => {
      if (a.status === "live" && b.status !== "live") return -1;
      if (b.status === "live" && a.status !== "live") return 1;
      return a.start.getTime()-b.start.getTime();
    });
  const primary = heroCandidates[0] ?? events[0];
  const primaryView = primary ? normalizeKioskSportsEvent(primary) : undefined;

  // Match the approved composition: MLB owns the left feature slot only when it has
  // a current/upcoming game; otherwise Utah State takes it. F1 owns the right slot
  // only during an active race week; otherwise Utah takes it.
  const leftFeature = angels?.event && withinDays(angels.event,7) ? angels : usu;
  const rightFeature = f1?.event && withinDays(f1.event,7) ? f1 : utah;
  const features = [leftFeature,rightFeature].filter((card) => Boolean(card) && card?.event?.id !== primary?.id);
  const featureIds = new Set(features.map((card)=>card?.event?.id).filter(Boolean));
  const allFollowed = [...events, ...officialUsuSchedule(), ...officialUtahSchedule()]
    .filter((event,index,array)=>array.findIndex((item)=>item.id===event.id)===index)
    .filter((event)=>event.id!==primary?.id && !featureIds.has(event.id))
    .sort((a,b)=>a.start.getTime()-b.start.getTime());
  const league = allFollowed.slice(0,5);
  const background = primaryView ? selectKioskSportsBackground(primaryView.backgroundKey) : "/dashboard/sports/stadium.webp";
  const now = new Date();
  const packersGameDay = Boolean(primary && primary.sport === "nfl" && /green bay|packers/i.test(`${primary.title} ${primary.homeTeam?.name ?? ""} ${primary.awayTeam?.name ?? ""}`) && (primary.status === "live" || primary.start.toDateString() === now.toDateString()));

  return <section className="relative h-full w-full touch-none select-none overflow-hidden overscroll-none bg-[#090316] text-white">
    <img src={background} alt="" className="absolute inset-0 h-full w-full object-cover" />
    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,2,18,.22),rgba(10,3,28,.64)_47%,rgba(8,3,24,.92))]" />
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_48%_28%,rgba(139,44,255,.18),transparent_38%)]" />
    <div className="relative z-10 flex h-full min-h-0 flex-col overflow-hidden px-[3.2vw] pb-[3.8vh] pt-[4.5vh]">
      <div className="text-[clamp(.65rem,1.15vw,1.1rem)] font-semibold uppercase tracking-[.35em]">COSMOS <span className="text-violet-500">•</span> <span className="font-normal text-white/65">SPORTS</span></div>
      <h1 className={`mt-[5vh] text-[clamp(3rem,6.3vw,6.2rem)] font-black leading-[.88] tracking-[-.055em] ${packersGameDay ? "cosmos-kiosk-packers-gameday-title" : "drop-shadow-[0_0_22px_rgba(174,91,255,.5)]"}`}>{smartHeadline(primary, packersGameDay)}</h1>
      <p className="mt-3 text-[clamp(1.25rem,2.4vw,2.35rem)] font-light">{dateLine(now)}</p>

      <div className="mt-[4.5vh] grid min-h-0 flex-1 grid-cols-[2.1fr_.95fr] gap-[1.2vw]">
        <div className="grid min-h-0 grid-rows-[1.35fr_.9fr] gap-[1.2vw]">
          <EventHero event={primary} loading={loading} />
          <div className="grid min-h-0 grid-cols-2 gap-[.8vw]">
            {features.map((card) => card ? <FeatureEvent key={card.key} event={card.event} label={card.label} /> : null)}
          </div>
        </div>
        <aside className="min-h-0 overflow-hidden rounded-[1.6vw] border border-violet-400/45 bg-[#100720]/80 p-[1.2vw] shadow-[inset_0_0_30px_rgba(124,58,237,.08)] backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-white/10 pb-3 text-[clamp(.7rem,1vw,.95rem)] uppercase tracking-[.23em] text-violet-100"><span>🏆 &nbsp; Around Your Sports</span><span className="text-white/55">Upcoming</span></div>
          <div className="mt-2 flex min-h-0 flex-col overflow-hidden">{league.length ? league.map((event) => <LeagueRow key={event.id} event={event} />) : <p className="py-12 text-center text-white/45">No other followed events right now.</p>}</div>
        </aside>
      </div>
    </div>
  </section>;
}

function EventHero({ event, loading }: { event?: SportsEvent; loading: boolean }) {
  if (!event) return <div className="flex items-center justify-center rounded-[1.6vw] border border-violet-400/45 bg-[#100720]/80 text-xl text-white/55">{loading ? "Loading sports…" : "No followed events scheduled."}</div>;
  const view = normalizeKioskSportsEvent(event)!;
  return <article className="relative overflow-hidden rounded-[1.6vw] border border-violet-400/55 bg-[linear-gradient(110deg,rgba(17,7,38,.9),rgba(17,7,38,.62))] px-[2.2vw] py-[2.2vh] shadow-[0_0_24px_rgba(124,58,237,.18)] backdrop-blur-md">
    <div className="flex items-center justify-between text-[clamp(.72rem,1.1vw,1rem)] uppercase tracking-[.25em] text-violet-100"><span>{sportIcon(event)} &nbsp; {view.sportLabel}</span><span>{view.live ? "● LIVE" : (event.homeTeam?.name?.toLowerCase().includes("green bay") ? "⌂ HOME GAME" : view.eventType)}</span></div>
    <div className="grid h-[calc(100%-2rem)] grid-cols-[1fr_auto_1fr] items-center gap-[2vw]">
      <Team event={event} side="away" />
      <div className="min-w-[9rem] text-center"><span className="rounded-full bg-violet-600 px-5 py-2 text-xs font-black uppercase tracking-[.12em] shadow-[0_0_20px_rgba(139,92,246,.6)]">{view.live ? "Live" : event.status === "pregame" ? "Pregame" : "Up Next"}</span><p className="mt-4 text-[clamp(1.8rem,3vw,3.1rem)] font-black">{view.live ? score(event) : eventTime(event)}</p><p className="mt-1 text-[clamp(.8rem,1.1vw,1.1rem)] font-semibold text-violet-200">{event.start.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" })}</p><p className="mt-2 text-[clamp(.75rem,1vw,.95rem)] text-white/70">⌖ {view.venueName ?? "Venue TBA"}</p>{view.broadcaster ? <p className="mt-1 text-sm text-white/55">{view.broadcaster}</p> : null}</div>
      <Team event={event} side="home" />
    </div>
  </article>;
}

function Team({ event, side }: { event: SportsEvent; side: "home" | "away" }) {
  const team = side === "home" ? event.homeTeam : event.awayTeam;
  if (!team) return <div className={side === "home" ? "text-left" : "text-right"}><p className="text-[clamp(1.5rem,2.5vw,2.6rem)] font-black uppercase">{event.metadata?.eventName ?? event.title}</p></div>;
  return <div className={side === "home" ? "text-left" : "text-right"}><div className={`mb-2 flex ${side === "home" ? "justify-start" : "justify-end"}`}><SportsTeamLogo sport={event.sport} team={logoTeam(event,team)} size="lg" /></div><p className="text-[clamp(.7rem,.9vw,.85rem)] uppercase tracking-[.2em] text-violet-200/80">{team.abbreviation}</p><p className="mt-1 text-[clamp(1.6rem,2.8vw,3rem)] font-black uppercase leading-none">{team.name}</p></div>;
}

function FeatureEvent({ event, label }: { event?: SportsEvent; label: string }) {
  if (!event) return <article className="flex min-h-0 flex-col justify-between rounded-[1vw] border border-violet-400/30 bg-[linear-gradient(130deg,rgba(64,24,109,.8),rgba(12,6,35,.85))] p-[1vw]"><span className="flex items-center gap-2 text-[clamp(.7rem,.95vw,.95rem)] font-bold uppercase tracking-[.12em] text-violet-100"><CategoryMark label={label} />{label}</span><p className="text-[clamp(.7rem,.9vw,.9rem)] text-white/50">No upcoming event available</p></article>;
  const view = normalizeKioskSportsEvent(event)!;
  const featureBg=view.backgroundKey ? selectKioskSportsBackground(view.backgroundKey) : undefined;
  return <article className="relative overflow-hidden rounded-[1.2vw] border border-violet-400/55 bg-[#100720] p-[1.05vw] shadow-[0_0_20px_rgba(124,58,237,.16)]">
    {featureBg ? <img src={featureBg} alt="" className="absolute inset-0 h-full w-full object-cover opacity-35" /> : null}
    <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(13,5,35,.94),rgba(24,8,54,.72))]" />
    <div className="relative z-10 flex h-full flex-col"><div className="flex justify-between text-[clamp(.65rem,.9vw,.82rem)] uppercase tracking-[.2em] text-violet-100"><span className="flex items-center gap-2"><CategoryMark label={label} />{label}</span><span>{view.eventType}</span></div><div className="mt-[.5vh] flex h-[calc(100%-2rem)] flex-col gap-1"><div><div className="flex items-center gap-3">{event.awayTeam && <SportsTeamLogo sport={event.sport} team={logoTeam(event,event.awayTeam)} size="md" />}{event.homeTeam && <SportsTeamLogo sport={event.sport} team={logoTeam(event,event.homeTeam)} size="md" />}<p className="line-clamp-2 text-[clamp(1rem,1.38vw,1.42rem)] font-black leading-[1.08]">{event.title}</p></div><p className="mt-1 truncate text-[clamp(.72rem,.9vw,.88rem)] text-white/70">{view.venueName ?? view.venueLocation ?? "Venue TBA"}{event.broadcast ? ` · ${event.broadcast}` : ""}</p></div><div className="mt-auto flex items-center justify-between gap-1"><span className="rounded-full bg-violet-600/80 px-2 py-1 text-[.6rem] font-bold uppercase">{view.live ? "Live" : "Next"}</span><p className="whitespace-nowrap text-[clamp(.78rem,.98vw,1rem)] font-black text-violet-100">{fullDate(event)}</p></div></div></div></article>;
}
function LeagueRow({ event }: { event: SportsEvent }) { const view=normalizeKioskSportsEvent(event)!; return <div className="grid min-h-0 grid-cols-[minmax(0,1fr)_auto] gap-3 overflow-hidden border-b border-white/10 px-2 py-[1.45vh] last:border-0"><div className="min-w-0"><p className="truncate text-[clamp(.78rem,1.05vw,1rem)] font-bold">{event.title}</p><p className="mt-1 text-xs uppercase tracking-[.12em] text-white/45">{view.sportLabel}</p></div><div className="text-right"><p className="text-[clamp(.72rem,.95vw,.9rem)] text-violet-100">{fullDate(event)}</p><p className="mt-1 text-xs text-white/45">{event.broadcast ?? ""}</p></div></div>; }
function collegeLogo(team: NonNullable<SportsEvent["homeTeam"]>) {
 const name=team.name.toLowerCase();
 if(/utah state/.test(name)) return "https://a.espncdn.com/i/teamlogos/ncaa/500/328.png";
 if(/washington state/.test(name)) return "https://a.espncdn.com/i/teamlogos/ncaa/500/265.png";
 if(/utah utes|^utah$/.test(name)) return "https://a.espncdn.com/i/teamlogos/ncaa/500/254.png";
 if(/kansas jayhawks/.test(name)) return "https://a.espncdn.com/i/teamlogos/ncaa/500/2305.png";
 if(/colorado buffaloes/.test(name)) return "https://a.espncdn.com/i/teamlogos/ncaa/500/38.png";
 if(/texas state/.test(name)) return "https://a.espncdn.com/i/teamlogos/ncaa/500/326.png";
 if(/colorado state/.test(name)) return "https://a.espncdn.com/i/teamlogos/ncaa/500/36.png";
 if(/fresno state/.test(name)) return "https://a.espncdn.com/i/teamlogos/ncaa/500/278.png";
 if(/san diego state/.test(name)) return "https://a.espncdn.com/i/teamlogos/ncaa/500/21.png";
 if(/oregon state/.test(name)) return "https://a.espncdn.com/i/teamlogos/ncaa/500/204.png";
 if(/west virginia/.test(name)) return "https://a.espncdn.com/i/teamlogos/ncaa/500/277.png";
 return team.logo;
}
function logoTeam(event: SportsEvent, team: NonNullable<SportsEvent["homeTeam"]>) {
  const id=team.id ?? "";
  const abbreviation=(team.abbreviation ?? "").toLowerCase();
  if(event.sport==="nfl" && /^[a-z]{2,3}$/.test(abbreviation)) return {...team,logo:`https://a.espncdn.com/i/teamlogos/nfl/500/${abbreviation}.png`};
  if(event.sport==="college-football") return {...team,logo:collegeLogo(team)};
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
function heroTheme(event?: SportsEvent) {
 const text=`${event?.title ?? ""} ${event?.homeTeam?.name ?? ""} ${event?.awayTeam?.name ?? ""}`.toLowerCase();
 if(event?.sport==="formula1") return {key:"redbull",accent:"#1e41ff",accent2:"#e10600"};
 if(event?.sport==="college-football" && /utah state/.test(text)) return {key:"usu",accent:"#0f2439",accent2:"#8aa2b8"};
 if(event?.sport==="college-football" && /utah utes|kansas.*utah/.test(text)) return {key:"utah",accent:"#cc0000",accent2:"#ffffff"};
 if(event?.sport==="mlb" && /angels/.test(text)) return {key:"angels",accent:"#ba0021",accent2:"#003263"};
 if(event?.sport==="nascar") return {key:"nascar",accent:"#ff5a1f",accent2:"#6d28d9"};
 if(event?.sport==="nfl" && /green bay|packers/.test(text)) return {key:"packers",accent:"#203731",accent2:"#ffb612"};
 return {key:"cosmos",accent:"#6f2dbd",accent2:"#a855f7"};
}
function smartHeadline(event: SportsEvent | undefined, packersGameDay: boolean) {
 if(!event) return "Your Sports";
 const text=`${event.title} ${event.homeTeam?.name ?? ""} ${event.awayTeam?.name ?? ""}`;
 if(event.sport==="nfl" && /green bay|packers/i.test(text)) return packersHeadline(event,packersGameDay);
 if(event.sport==="formula1") return `F1 at ${event.title.replace(/Grand Prix.*$/i,"Grand Prix").replace(/ ·.*$/,"")}`;
 if(event.sport==="college-football" && /utah state/i.test(text)) return "Utah State Game Day";
 if(event.sport==="college-football" && /utah utes|kansas.*utah/i.test(text)) return "Utah Game Day";
 if(event.sport==="mlb" && /angels/i.test(text)) return "Angels Game Day";
 if(event.sport==="nascar") return event.title.replace(/ ·.*$/,"");
 return headline(event);
}
function packersHeadline(event: SportsEvent | undefined, gameDay: boolean) {
  if (!event || event.sport !== "nfl" || !/green bay|packers/i.test(`${event.title} ${event.homeTeam?.name ?? ""} ${event.awayTeam?.name ?? ""}`)) return headline(event);
  if (gameDay) return "Packers Game Day";
  const days = Math.ceil((event.start.getTime() - Date.now()) / 86_400_000);
  if (days === 1) return "Packers Tomorrow";
  if (days > 1 && days <= 7) return "Packers Up Next";
  return "Packers Up Next";
}
function headline(event?: SportsEvent) { if (!event) return "Sports"; const text=`${event.homeTeam?.name ?? ""} ${event.awayTeam?.name ?? ""} ${event.title}`.toLowerCase(); if(text.includes("packers")) return "Packers Game Day"; if(text.includes("angels")) return "Angels Game Day"; if(event.sport==="f1") return "Formula 1"; if(event.sport==="nascar") return "NASCAR"; if(event.sport==="college-football") return "College Football"; return "Game Day"; }
function sportIcon(event: SportsEvent) { return event.sport==="nfl"||event.sport==="college-football"?"◉":event.sport==="mlb"?"◌":event.sport==="f1"?"F1":"◆"; }
function score(event: SportsEvent) { return event.awayTeam?.score !== undefined && event.homeTeam?.score !== undefined ? `${event.awayTeam.score} – ${event.homeTeam.score}` : "LIVE"; }
function eventTime(event: SportsEvent) { return event.start.toLocaleString([], { weekday:"short", hour:"numeric", minute:"2-digit" }); }
function dateLine(date: Date) { return `Today  |  ${date.toLocaleDateString([], { weekday:"long", month:"long", day:"numeric" })}`; }
