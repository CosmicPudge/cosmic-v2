"use client";

import { useMemo, useState } from "react";
import type { SportKind, SportsEvent, SportsEventStatus, SportsSnapshot, SportsSource, SportsStanding } from "@/core/contracts/Sports";
import { prioritizeFollowedEvents, sportLabels } from "@/services/sports/preferences";
import { useSports } from "@/hooks/os/useSports";

type SportsTab = "overview" | SportKind;

const tabs: Array<{ id: SportsTab; label: string }> = [
  { id: "overview", label: "Overview" },
  { id: "mlb", label: "Angels" },
  { id: "nfl", label: "Packers" },
  { id: "f1", label: "F1" },
  { id: "nascar", label: "NASCAR" },
  { id: "college-football", label: "Utah State" },
];

const card = "rounded-2xl border border-white/10 bg-white/5 p-4";
const heading = "mb-3 text-sm font-semibold uppercase tracking-widest text-white/45";

function statusLabel(status: SportsEventStatus): string {
  return status === "scheduled" ? "Upcoming" : status.toUpperCase();
}

function statusClass(status: SportsEventStatus): string {
  if (status === "live") return "border-red-200/30 bg-red-300/15 text-red-100";
  if (status === "delayed") return "border-amber-200/30 bg-amber-300/15 text-amber-100";
  if (status === "final") return "border-white/15 bg-white/10 text-white/65";
  return "border-sky-200/20 bg-sky-200/10 text-sky-100";
}

function humanTime(value: Date): string {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const sameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  const prefix = sameDay(value, today) ? "Today" : sameDay(value, tomorrow) ? "Tomorrow" : value.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
  return `${prefix} · ${value.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
}

function matchup(event: SportsEvent): string | undefined {
  if (!event.awayTeam || !event.homeTeam) return undefined;
  const away = `${event.awayTeam.abbreviation ?? event.awayTeam.name}${event.awayTeam.score !== undefined ? ` ${event.awayTeam.score}` : ""}`;
  const home = `${event.homeTeam.abbreviation ?? event.homeTeam.name}${event.homeTeam.score !== undefined ? ` ${event.homeTeam.score}` : ""}`;
  return `${away} at ${home}`;
}

function EventCard({ event, hero = false }: { event: SportsEvent; hero?: boolean }) {
  const detail = event.status === "scheduled" || event.status === "pregame" ? event.metadata?.sessionType ?? event.metadata?.track ?? event.venue : event.statusDetail ?? event.metadata?.sessionType ?? event.metadata?.track ?? event.venue;
  return <article className={hero ? "rounded-2xl border border-red-200/20 bg-gradient-to-br from-red-300/15 via-white/10 to-transparent p-5" : card}>
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-widest text-white/45">{sportLabels[event.sport]}</p>
        <h3 className={hero ? "mt-1 text-xl font-semibold text-white" : "mt-1 font-semibold text-white"}>{event.title}</h3>
        {matchup(event) && <p className="mt-2 text-sm text-white/75">{matchup(event)}</p>}
        <p className="mt-2 text-sm text-white/50">{humanTime(event.start)}{detail ? ` · ${detail}` : ""}{event.broadcast ? ` · ${event.broadcast}` : ""}</p>
      </div>
      <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${statusClass(event.status)}`}>{statusLabel(event.status)}</span>
    </div>
  </article>;
}

function EventList({ title, events, empty, limit }: { title: string; events: SportsEvent[]; empty: string; limit?: number }) {
  const displayed = limit ? events.slice(0, limit) : events;
  return <section><h2 className={heading}>{title}</h2>{displayed.length ? <div className="space-y-3">{displayed.map((event) => <EventCard key={event.id} event={event} />)}</div> : <div className={`${card} text-sm text-white/55`}>{empty}</div>}</section>;
}

function Standings({ standings, sport }: { standings: SportsStanding[]; sport: SportKind }) {
  if (!standings.length) return <div className={`${card} text-sm text-white/55`}>{sport === "f1" ? "Driver and constructor standings are unavailable from the current source." : "Standings unavailable from the current source."}</div>;
  return <div className={`${card} overflow-x-auto`}><table className="w-full min-w-[300px] text-left text-sm"><thead className="text-xs uppercase tracking-wider text-white/40"><tr><th className="pb-3">Rank</th><th className="pb-3">Team / driver</th><th className="pb-3">Record</th><th className="pb-3">Points</th></tr></thead><tbody>{standings.map((standing) => <tr key={standing.id} className="border-t border-white/10 text-white/70"><td className="py-3">{standing.rank ?? "—"}</td><td className="py-3 text-white">{standing.driver ?? standing.team ?? standing.name}</td><td className="py-3">{standing.record ?? (standing.wins !== undefined ? `${standing.wins}-${standing.losses ?? 0}` : "—")}</td><td className="py-3">{standing.points ?? "—"}</td></tr>)}</tbody></table></div>;
}

function SourceNotice({ sport, sources }: { sport: SportKind; sources: SportsSource[] }) {
  const fallback = sources.find((source) => source.sport === sport && source.fallback && source.status !== "unavailable");
  if (!fallback) return null;
  const gaps: string[] = [];
  if (!fallback.capabilities.standings) gaps.push("standings");
  if (sport === "f1" && !fallback.capabilities.sessions) gaps.push("full session timing");
  if (!gaps.length) return null;
  return <p className="text-sm text-white/45">{gaps.join(" and ")} unavailable from the current source.</p>;
}

function ProviderWarning({ sources }: { sources: SportsSource[] }) {
  const unavailable = sources.filter((source) => source.status === "unavailable" && !source.official);
  if (!unavailable.length) return null;
  return <div className="rounded-xl border border-amber-200/15 bg-amber-300/10 px-4 py-3 text-sm text-amber-100">{unavailable.map((source) => `${sportLabels[source.sport]} data temporarily unavailable.`).join(" ")}</div>;
}

export default function SportsView() {
  const { data, loading, error, refresh } = useSports();
  const [tab, setTab] = useState<SportsTab>("overview");
  const tabEvents = useMemo(() => data ? {
    live: prioritizeFollowedEvents(data.live.filter((event) => tab === "overview" || event.sport === tab)),
    upcoming: prioritizeFollowedEvents(data.upcoming.filter((event) => tab === "overview" || event.sport === tab)),
    recent: [...data.recent.filter((event) => tab === "overview" || event.sport === tab)].sort((first, second) => second.start.getTime() - first.start.getTime()),
  } : null, [data, tab]);

  if (loading && !data) return <div className="space-y-4"><div className={`${card} h-28 animate-pulse`} /><div className={`${card} h-36 animate-pulse`} /></div>;
  if (!data) return <div className={card}><h2 className="font-semibold text-white">Sports is unavailable</h2><p className="mt-2 text-sm text-white/55">{error ?? "Try refreshing scores and schedules."}</p><button type="button" onClick={() => void refresh()} className="mt-4 rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-200/80">Refresh</button></div>;

  const primaryLive = tabEvents?.live[0];
  const remainingLive = tabEvents?.live.slice(1) ?? [];
  const standings = tab === "overview" ? [] : data.standings[tab] ?? [];
  return <div className="space-y-6">
    <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Sports sections">{tabs.map((item) => <button key={item.id} type="button" role="tab" aria-selected={tab === item.id} onClick={() => setTab(item.id)} className={`shrink-0 rounded-xl border px-3 py-2 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-200/80 ${tab === item.id ? "border-sky-100/25 bg-sky-200/10 text-sky-50" : "border-white/10 text-white/60 hover:bg-white/10"}`}>{item.label}</button>)}</div>
    <ProviderWarning sources={data.sources} />
    {tab === "overview" ? <Overview data={data} live={primaryLive} additionalLive={remainingLive} upcoming={tabEvents?.upcoming ?? []} recent={tabEvents?.recent ?? []} /> : <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(20rem,0.75fr)]"><div className="space-y-6">{primaryLive ? <section><h2 className={heading}>Live now</h2><EventCard event={primaryLive} hero /></section> : null}<EventList title="Next up" events={tabEvents?.upcoming ?? []} empty="No upcoming events from this source." limit={1} /><EventList title="Upcoming schedule" events={(tabEvents?.upcoming ?? []).slice(1)} empty="No additional upcoming events." limit={8} /><EventList title="Recent results" events={tabEvents?.recent ?? []} empty="No recent results available." limit={5} /></div><aside className="space-y-6"><section><h2 className={heading}>Standings</h2><Standings standings={standings} sport={tab} /></section><SourceNotice sport={tab} sources={data.sources} /></aside></div>}</div>;
}

function Overview({ data, live, additionalLive, upcoming, recent }: { data: SportsSnapshot; live?: SportsEvent; additionalLive: SportsEvent[]; upcoming: SportsEvent[]; recent: SportsEvent[] }) {
  const nextToday = upcoming.filter((event) => event.start.toDateString() === new Date().toDateString());
  const soon = upcoming.filter((event) => !nextToday.includes(event));
  return <div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(20rem,0.7fr)]"><div className="space-y-6">{live ? <section><h2 className={heading}>Live now</h2><EventCard event={live} hero />{additionalLive.length ? <div className="mt-3 space-y-3">{additionalLive.map((event) => <EventCard key={event.id} event={event} />)}</div> : null}</section> : <div className={`${card} text-sm text-white/55`}>No followed events are live right now.</div>}<EventList title="Next today" events={nextToday} empty="Nothing else is scheduled today." limit={3} /><EventList title="Coming up soon" events={soon} empty="No upcoming events are available." limit={6} /></div><aside className="space-y-6"><EventList title="Recent results" events={recent} empty="No recent results available." limit={5} /><section><h2 className={heading}>Followed teams</h2><Standings standings={data.standings.mlb ?? []} sport="mlb" /></section></aside></div>;
}
