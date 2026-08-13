import type { CalendarEvent } from "@/core/contracts";

interface CalendarUpcomingProps {
  events: CalendarEvent[];
  loading: boolean;
}

export default function CalendarUpcoming({
  events,
  loading,
}: CalendarUpcomingProps) {
  return (
    <div className="min-h-0 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
      <p className="text-[9px] uppercase tracking-[0.18em] text-white/50">
        Upcoming
      </p>

      {loading ? (
        <p className="mt-1 text-xs text-white/50">
          Loading...
        </p>
      ) : events.length === 0 ? (
        <p className="mt-1 text-xs text-white/50">
          No upcoming events.
        </p>
      ) : (
        <div className="mt-1 space-y-1">
          {events.slice(0, 3).map((event) => (
            <div
              key={event.id}
              className="flex min-w-0 items-center gap-2 rounded-lg bg-white/5 px-2 py-1.5"
            >
              <span className="shrink-0 text-[10px] text-white/45">
                {event.start.toLocaleTimeString("en-US", {
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </span>

              <span className="min-w-0 truncate text-xs font-medium text-white">
                {event.title}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}