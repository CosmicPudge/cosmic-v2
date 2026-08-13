import type { CalendarEvent } from "@/core/contracts";

interface CalendarAgendaProps {
  events: CalendarEvent[];
  loading: boolean;
  error: string | null;
}

export default function CalendarAgenda({
  events,
  loading,
  error,
}: CalendarAgendaProps) {
  return (
    <div className="h-full min-h-0 overflow-hidden rounded-xl border border-white/10 bg-white/5 px-3 py-2">
      <p className="text-[9px] uppercase tracking-[0.18em] text-white/50">
        Agenda
      </p>

      {loading ? (
        <p className="mt-1 text-xs text-white/50">
          Loading...
        </p>
      ) : error ? (
        <p className="mt-1 truncate text-xs text-red-300">
          {error}
        </p>
      ) : events.length === 0 ? (
        <p className="mt-1 text-xs text-white/50">
          Your day is clear.
        </p>
      ) : (
        <div className="mt-1 space-y-1">
          {events.slice(0, 3).map((event) => (
            <div
              key={event.id}
              className="
                flex
                h-8
                min-w-0
                items-center
                gap-3
                rounded-lg
                bg-white/5
                px-2
              "
            >
              <span className="w-16 shrink-0 text-[10px] text-white/45">
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