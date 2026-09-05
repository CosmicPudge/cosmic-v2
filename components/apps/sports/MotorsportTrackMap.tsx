"use client";

import type { SportsEvent } from "@/core/contracts/Sports";
import Image from "next/image";
import { resolveMotorsportTrack } from "@/services/sports/tracks";

export default function MotorsportTrackMap({ event, compact = false }: { event: SportsEvent; compact?: boolean }) {
  const track = resolveMotorsportTrack(event);
  const label = track?.name ?? event.metadata?.circuit ?? event.metadata?.track ?? event.venue ?? "Track unavailable";
  return <div className={`rounded-2xl border border-white/10 bg-black/15 ${compact ? "p-3" : "p-4"}`} aria-label={`${label} track map`}><div className="flex items-start justify-between gap-3"><div><p className="text-[10px] uppercase tracking-[0.18em] text-cyan-100/45">Actual circuit</p><p className="mt-1 text-sm font-medium text-white/80">{label}</p>{track?.location ? <p className="mt-1 text-xs text-white/40">{track.location}</p> : null}{track?.configuration ? <p className="mt-1 text-xs text-white/40">{track.configuration}</p> : null}</div>{track?.country ? <span className="text-[10px] uppercase tracking-[0.14em] text-white/30">{track.country}</span> : null}</div>{track?.outlineAsset ? <div className={`relative mt-3 flex items-center justify-center ${compact ? "h-20" : "h-40 sm:h-48"}`}><Image src={track.outlineAsset} alt={`${label} circuit outline`} fill unoptimized className="object-contain opacity-80 [filter:drop-shadow(0_0_12px_rgba(103,232,249,.25))]" /></div> : <p className="mt-4 text-xs text-white/35">Verified outline unavailable; showing provider track text only.</p>}</div>;
}
