import type { CalendarEvent } from "@/core/contracts";
import { WidgetEmpty, WidgetError, WidgetLoading } from "@/components/os/ui/widget";

interface CalendarAgendaProps {
  events: CalendarEvent[];
  currentEvent?: CalendarEvent;
  loading: boolean;
  error: string | null;
  kiosk?: boolean;
}

export default function CalendarAgenda({
  events,
  currentEvent,
  loading,
  error,
  kiosk = false,
}: CalendarAgendaProps) {
  const agendaEvents = events
    .filter((event) => event.id !== currentEvent?.id)
    .sort(
      (first, second) =>
        getPriorityRank(first) -
          getPriorityRank(second) ||
        first.start.getTime() - second.start.getTime()
    );

  return (
    <div className="h-full min-h-0 overflow-hidden rounded-xl border border-white/10 bg-white/5 px-3 py-2">
      <p className="text-[9px] uppercase tracking-[0.18em] text-white/50">
        Agenda
      </p>

      {loading ? (
        <WidgetLoading compact className="mt-1 justify-start" />
      ) : error ? (
        <WidgetError compact title={kiosk ? "Calendar temporarily unavailable" : "Calendar unavailable"} message={kiosk ? "Cosmic will retry automatically." : error} />
      ) : events.length === 0 ? (
        <WidgetEmpty compact title="Your day is clear." description="" />
      ) : (
        <div className="mt-1 space-y-1">
          {currentEvent && (
            <CalendarAgendaEvent
              event={currentEvent}
              label="Now"
            />
          )}

          {agendaEvents.slice(0, currentEvent ? 2 : 3).map((event) => (
            <CalendarAgendaEvent
              key={event.id}
              event={event}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CalendarAgendaEvent({
  event,
  label,
}: {
  event: CalendarEvent;
  label?: string;
}) {
  return (
    <div
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

function getPriorityRank(event: CalendarEvent): number {
  if (event.priority === "high") {
    return 0;
  }

  if (event.priority === "low") {
    return 2;
  }

  return 1;
}
