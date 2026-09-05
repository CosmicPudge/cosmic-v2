import type { SportsStanding } from "@/core/contracts/Sports";

export default function FavoriteDriverCard({ label, standing, kind = "driver" }: { label: string; standing?: SportsStanding; kind?: "driver" | "constructor" }) {
  return <div className="rounded-xl border border-violet-200/20 bg-violet-400/[.06] p-3"><p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-cyan-100/55">Favorite {kind}</p><p className="mt-1 text-sm text-white/85">{label}</p><p className="mt-1 text-xs text-white/45">{standing?.rank ? `P${standing.rank}` : "No result available"}{standing?.points !== undefined ? ` · ${standing.points} pts` : ""}</p></div>;
}
