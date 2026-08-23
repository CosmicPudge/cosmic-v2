"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { SportsEvent, SportsStanding } from "@/core/contracts/Sports";
import type { SportsDirectoryEntry } from "@/services/sports/directory";
import { useSettingsRepository } from "@/services/settings/localRepository";
import { isFollowedName } from "@/services/sports/favorites";

interface Payload { entity: SportsDirectoryEntry; standing?: SportsStanding; events: SportsEvent[]; lastUpdated: string; }
const panel = "rounded-3xl border border-white/10 bg-white/[0.045] p-5";

export default function RaceEntityPage({ sport, entityType, entityId }: { sport: string; entityType: string; entityId: string }) {
  const [data, setData] = useState<Payload | null>(null); const [error, setError] = useState<string | null>(null);
  const { data: settings } = useSettingsRepository();
  useEffect(() => { let active = true; fetch(`/api/sports/entity/${sport}/${entityType}/${entityId}`, { cache: "no-store" }).then(async (response) => { if (!response.ok) throw new Error("Sports entity data is unavailable."); return response.json() as Promise<Payload>; }).then((value) => { if (active) setData(value); }).catch((reason) => { if (active) setError(reason instanceof Error ? reason.message : "Sports entity data is unavailable."); }); return () => { active = false; }; }, [sport, entityType, entityId]);
  if (error) return <section className={panel}><h1 className="text-xl font-semibold text-white">Entity unavailable</h1><p className="mt-2 text-sm text-white/55">{error}</p><Link href="/sports" className="mt-4 inline-flex text-sm text-cyan-100/75">Back to Sports</Link></section>;
  if (!data) return <div className={`${panel} animate-pulse text-sm text-white/45`}>Loading {entityType}…</div>;
  return <div className="mx-auto max-w-[1100px] space-y-5"><Link href="/sports" className="inline-flex text-sm text-white/45 hover:text-white">← Sports overview</Link><header className={panel}><p className="text-xs uppercase tracking-[0.2em] text-cyan-100/45">{sport.toUpperCase()} · {entityType}</p><div className="mt-2 flex flex-wrap items-center gap-3"><h1 className="text-3xl font-bold text-white">{data.entity.name}</h1>{isFollowedName(sport as "f1" | "nascar", data.entity.name, settings.preferences) ? <span className="rounded-full border border-cyan-200/25 bg-cyan-200/10 px-2.5 py-1 text-xs font-semibold text-cyan-100">Following</span> : null}</div><p className="mt-2 text-sm text-white/45">{data.entity.driverNumber ? `#${data.entity.driverNumber}` : data.entity.carNumber ? `#${data.entity.carNumber}` : ""} · Updated {new Date(data.lastUpdated).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</p></header><section className={panel}><h2 className="text-xs uppercase tracking-[0.2em] text-white/45">Championship position</h2><p className="mt-3 text-2xl font-semibold text-white">{data.standing?.rank ?? "—"}</p><p className="mt-1 text-sm text-white/55">{data.standing?.points !== undefined ? `${data.standing.points} points` : "Points unavailable"}{data.standing?.team ? ` · ${data.standing.team}` : ""}</p></section><section className={panel}><h2 className="text-xs uppercase tracking-[0.2em] text-white/45">Relevant schedule</h2><div className="mt-4 space-y-3">{data.events.map((event) => <Link key={event.id} href={`/sports/event/${encodeURIComponent(event.id)}`} className="block rounded-2xl border border-white/10 p-3 hover:bg-white/[0.06]"><p className="text-white">{event.title}</p><p className="mt-1 text-sm text-white/45">{new Date(event.start).toLocaleString()} · {event.status}</p></Link>)}</div></section></div>;
}
