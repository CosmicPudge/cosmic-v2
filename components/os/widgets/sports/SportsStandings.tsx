import type { SportsStanding } from "@/core/contracts/Sports";

export default function SportsStandings({ standings }: { standings: SportsStanding[] }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <p className="text-xs uppercase tracking-widest text-white/50">Standings</p>
      {standings.length ? <div className="mt-2 space-y-2">{standings.slice(0, 4).map((standing) => <div key={standing.id} className="flex items-center justify-between gap-3 text-sm"><span className="min-w-0 truncate text-white/80">{standing.rank ? `${standing.rank}. ` : ""}{standing.driver ?? standing.team ?? standing.name}</span><span className="shrink-0 text-xs text-white/50">{standing.record ?? (standing.points !== undefined ? `${standing.points} pts` : "—")}</span></div>)}</div> : <p className="mt-2 text-sm text-white/60">Standings are unavailable from current providers.</p>}
    </div>
  );
}
