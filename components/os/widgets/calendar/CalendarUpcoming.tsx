import type { CalendarEvent } from "@/core/contracts";
import { WidgetEmpty, WidgetLoading } from "@/components/os/ui/widget";

interface CalendarUpcomingProps {
  events: CalendarEvent[];
  nextEvent?: CalendarEvent;
  loading: boolean;
}

export default function CalendarUpcoming({
  events,
  nextEvent,
  loading,
}: CalendarUpcomingProps) {
  const upcomingEvents = events.filter(
    (event) => event.id !== nextEvent?.id
  );

  return (
    <div className="min-h-0 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
      <p className="text-[9px] uppercase tracking-[0.18em] text-white/50">
        Upcoming
      </p>

      {loading ? (
        <WidgetLoading compact className="mt-1 justify-start" />
      ) : !nextEvent && events.length === 0 ? (
        <WidgetEmpty compact title="No upcoming events." description="" />
      ) : (
        <div className="mt-1 space-y-1">
          {nextEvent && (
            <CalendarUpcomingEvent
              event={nextEvent}
              label="Next"
            />
          )}

          {upcomingEvents.slice(0, nextEvent ? 2 : 3).map((event) => (
            <CalendarUpcomingEvent
              key={event.id}
              event={event}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CalendarUpcomingEvent({
  event,
  label,
}: {
  event: CalendarEvent;
  label?: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-2 rounded-lg bg-white/5 px-2 py-1.5">
      <span className="shrink-0 text-[10px] text-white/45">
        {label ??
          event.start.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
          })}
      </span>

      <span className="min-w-0 truncate text-xs font-medium text-white">
        {event.title}
      </span>
    </div>
  );
}
