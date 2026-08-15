import type { SportsEvent } from "@/core/contracts/Sports";

function timeLabel(event: SportsEvent): string {
  return event.start.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export default function SportsCurrent({ event }: { event?: SportsEvent }) {
  const matchup = event?.awayTeam && event.homeTeam
    ? `${event.awayTeam.abbreviation ?? event.awayTeam.name} ${event.awayTeam.score ?? ""} at ${event.homeTeam.abbreviation ?? event.homeTeam.name} ${event.homeTeam.score ?? ""}`.trim()
    : undefined;

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <p className="text-xs uppercase tracking-widest text-white/50">
        {event ? (event.status === "live" || event.status === "delayed" ? "Live now" : "Next up") : "Current"}
      </p>
      <h3 className="mt-2 text-lg font-semibold text-white">{event?.title ?? "No Live Games"}</h3>
      <p className="mt-1 text-sm text-white/60">
        {event ? `${matchup ? `${matchup} · ` : ""}${event.statusDetail ?? timeLabel(event)}` : "Your followed teams are not playing right now."}
      </p>
    </div>
  );
}
