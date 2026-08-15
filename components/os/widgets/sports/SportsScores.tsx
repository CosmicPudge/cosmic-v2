import type { SportsEvent } from "@/core/contracts/Sports";

export default function SportsScores({ events }: { events: SportsEvent[] }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <p className="text-xs uppercase tracking-widest text-white/50">Upcoming</p>
      {events.length ? <div className="mt-2 space-y-2">{events.slice(0, 3).map((event) => <div key={event.id} className="flex items-start justify-between gap-2 text-sm"><div className="min-w-0"><p className="truncate text-white/80">{event.title}</p><p className="mt-0.5 text-xs text-white/45">{event.start.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })}</p></div><span className="shrink-0 text-xs text-white/55">{event.start.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</span></div>)}</div> : <p className="mt-2 text-sm text-white/60">No upcoming events are available.</p>}
    </div>
  );
}
